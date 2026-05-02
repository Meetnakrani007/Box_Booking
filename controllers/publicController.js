const Box = require('../models/Box');
const Booking = require('../models/Booking');

// ─── GET /boxes ─────────────────────────────────────────────────────────────
const getBoxListing = async (req, res, next) => {
    try {
        const { city, maxPrice, facility, q, page: pageQ } = req.query;
        const filter = {};
        if (city && city.trim()) filter.city = { $regex: city.trim(), $options: 'i' };
        if (maxPrice && !isNaN(maxPrice)) filter.pricePerHour = { $lte: Number(maxPrice) };
        if (facility) filter.facilities = facility;
        if (q && q.trim()) filter.name = { $regex: q.trim(), $options: 'i' };

        const limit = 9;
        const page = Math.max(1, parseInt(pageQ) || 1);
        const skip = (page - 1) * limit;

        const [boxes, total] = await Promise.all([
            Box.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Box.countDocuments(filter)
        ]);

        const cities = await Box.distinct('city');
        const facilities = Box.FACILITIES;
        const totalPages = Math.ceil(total / limit);

        res.render('boxes/index', {
            title: 'Find a Box Cricket Venue',
            boxes,
            cities,
            facilities,
            filters: { city: city || '', maxPrice: maxPrice || '', facility: facility || '', q: q || '' },
            pagination: { page, totalPages, total }
        });
    } catch (err) { next(err); }
};

// ─── GET /boxes/:id ─────────────────────────────────────────────────────────
const getBoxDetail = async (req, res, next) => {
    try {
        const box = await Box.findById(req.params.id)
            .populate({ path: 'owner', populate: { path: 'user' } })
            .lean();
        if (!box) { return res.status(404).render('error/404', { title: '404 Not Found' }); }

        // Nearby: same city, not this box
        const nearby = await Box.find({ city: box.city, _id: { $ne: box._id } }).limit(4).lean();

        res.render('boxes/show', {
            title: box.name,
            box,
            nearby
        });
    } catch (err) { next(err); }
};

// ─── GET /boxes/map ──────────────────────────────────────────────────────────
const getBoxMap = async (req, res, next) => {
    try {
        res.render('boxes/map', {
            title: 'Venue Map — BoxHook',
            googleMapsKey: process.env.GOOGLE_MAPS_KEY || ''
        });
    } catch (err) { next(err); }
};

// ─── GET /api/boxes/map-data (JSON) ──────────────────────────────────────────
const getBoxMapData = async (req, res, next) => {
    try {
        // Only return boxes that have valid GPS coordinates
        const boxes = await Box.find({
            latitude: { $exists: true, $ne: null },
            longitude: { $exists: true, $ne: null }
        }).select('name city location pricePerHour facilities latitude longitude images').lean();
        res.json(boxes);
    } catch (err) { next(err); }
};

module.exports = { getBoxListing, getBoxDetail, getBoxMap, getBoxMapData };
