const Booking = require('../models/Booking');
const Box = require('../models/Box');

// ─── Helper: detect time overlap ─────────────────────────────────────────────
function timesOverlap(s1, e1, s2, e2) {
    // times in HH:MM format
    return s1 < e2 && e1 > s2;
}

// ─── GET /boxes/:id/book ─────────────────────────────────────────────────────
const getBookingForm = async (req, res, next) => {
    try {
        const box = await Box.findById(req.params.id).lean();
        if (!box) return res.status(404).render('error/404', { title: '404 Not Found' });
        res.render('bookings/new', { title: `Book ${box.name}`, box });
    } catch (err) { next(err); }
};

// ─── POST /bookings ───────────────────────────────────────────────────────────
const postCreateBooking = async (req, res, next) => {
    try {
        const { boxId, date, startTime, endTime } = req.body;

        if (!boxId || !date || !startTime || !endTime) {
            req.flash('error', 'All fields are required');
            return res.redirect(`/boxes/${boxId}/book`);
        }
        if (startTime >= endTime) {
            req.flash('error', 'End time must be after start time');
            return res.redirect(`/boxes/${boxId}/book`);
        }

        const box = await Box.findById(boxId);
        if (!box) return res.status(404).render('error/404', { title: '404 Not Found' });

        // Check for overlapping bookings (slot locking via DB)
        const existingBookings = await Booking.find({
            box: boxId,
            date,
            status: { $in: ['pending', 'confirmed'] }
        }).lean();

        const hasOverlap = existingBookings.some(b => timesOverlap(startTime, endTime, b.startTime, b.endTime));
        if (hasOverlap) {
            req.flash('error', 'This time slot is already booked. Please choose another.');
            return res.redirect(`/boxes/${boxId}/book`);
        }

        // Calculate amount
        const [sh, sm] = startTime.split(':').map(Number);
        const [eh, em] = endTime.split(':').map(Number);
        const hours = ((eh * 60 + em) - (sh * 60 + sm)) / 60;
        const totalAmount = Math.round(hours * box.pricePerHour);

        const booking = new Booking({
            box: boxId,
            user: req.user._id,
            owner: box.owner, // Required by new schema
            date,
            startTime,
            endTime,
            totalAmount,
            status: 'pending'
        });
        await booking.save();

        req.flash('success', 'Booking created! Please complete payment to confirm.');
        res.redirect(`/bookings/${booking._id}/pay`);
    } catch (err) { next(err); }
};

// ─── GET /bookings/:id ────────────────────────────────────────────────────────
const getBookingDetail = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('box')
            .populate('user')
            .lean();
        if (!booking) return res.status(404).render('error/404', { title: '404 Not Found' });
        if (booking.user._id.toString() !== req.user._id.toString() && req.user.role === 'user') {
            req.flash('error', 'Not authorized');
            return res.redirect('/user/dashboard');
        }
        res.render('bookings/detail', { title: 'Booking Detail', booking });
    } catch (err) { next(err); }
};

// ─── POST /bookings/:id/cancel ────────────────────────────────────────────────
const cancelBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) { req.flash('error', 'Booking not found'); return res.redirect('/user/dashboard'); }
        if (booking.user.toString() !== req.user._id.toString()) {
            req.flash('error', 'Not authorized');
            return res.redirect('/user/dashboard');
        }
        if (!['pending', 'confirmed'].includes(booking.status)) {
            req.flash('error', 'Booking cannot be cancelled');
            return res.redirect('/user/dashboard');
        }
        booking.status = 'cancelled';
        await booking.save();
        req.flash('success', 'Booking cancelled');
        res.redirect('/user/dashboard');
    } catch (err) { next(err); }
};

module.exports = { getBookingForm, postCreateBooking, getBookingDetail, cancelBooking };
