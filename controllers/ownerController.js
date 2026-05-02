const Booking = require('../models/Booking');
const Box = require('../models/Box');
const Owner = require('../models/Owner');

// ─── GET /owner/dashboard ─────────────────────────────────────────────────────
const getOwnerDashboard = async (req, res, next) => {
    try {
        const owner = await Owner.findOne({ user: req.user._id }).lean();
        if (!owner) {
            req.flash('error', 'Owner profile not found');
            return res.redirect('/');
        }

        const boxes = await Box.find({ owner: owner._id }).lean();
        const boxIds = boxes.map(b => b._id);

        const bookings = await Booking.find({ box: { $in: boxIds } })
            .populate('box')
            .populate('user')
            .sort({ createdAt: -1 })
            .lean();

        const earnings = bookings
            .filter(b => b.status === 'confirmed' || b.status === 'completed')
            .reduce((sum, b) => sum + b.totalAmount, 0);

        res.render('owner/dashboard', { title: 'Owner Dashboard', boxes, bookings, earnings });
    } catch (err) { next(err); }
};

// ─── POST /owner/bookings/:id/status ─────────────────────────────────────────
const updateBookingStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const allowed = ['confirmed', 'cancelled', 'completed'];
        if (!allowed.includes(status)) {
            req.flash('error', 'Invalid status');
            return res.redirect('/owner/dashboard');
        }

        const booking = await Booking.findById(req.params.id).populate('box');
        if (!booking) { req.flash('error', 'Booking not found'); return res.redirect('/owner/dashboard'); }

        const owner = await Owner.findOne({ user: req.user._id });
        if (!owner || booking.box.owner.toString() !== owner._id.toString()) {
            req.flash('error', 'Not authorized');
            return res.redirect('/owner/dashboard');
        }

        booking.status = status;
        await booking.save();
        req.flash('success', `Booking marked as ${status}`);
        res.redirect('/owner/dashboard');
    } catch (err) { next(err); }
};

module.exports = { getOwnerDashboard, updateBookingStatus };
