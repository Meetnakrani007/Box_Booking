const Booking = require('../models/Booking');
const User = require('../models/User');

// ─── GET /user/dashboard ──────────────────────────────────────────────────────
const getUserDashboard = async (req, res, next) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate('box')
            .sort({ createdAt: -1 })
            .lean();
        res.render('user/dashboard', { title: 'My Bookings', bookings });
    } catch (err) { next(err); }
};

// ─── GET /user/profile ────────────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
    try {
        res.render('user/profile', { title: 'My Profile' });
    } catch (err) { next(err); }
};

// ─── POST /user/profile ───────────────────────────────────────────────────────
const postProfile = async (req, res, next) => {
    try {
        const { name, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);
        if (name && name.trim()) user.name = name.trim();

        if (newPassword && newPassword.trim()) {
            if (!currentPassword) {
                req.flash('error', 'Current password is required to set a new password');
                return res.redirect('/user/profile');
            }
            const match = await user.comparePassword(currentPassword);
            if (!match) {
                req.flash('error', 'Current password is incorrect');
                return res.redirect('/user/profile');
            }
            if (newPassword.length < 6) {
                req.flash('error', 'New password must be at least 6 characters');
                return res.redirect('/user/profile');
            }
            user.password = newPassword;
        }

        await user.save();
        req.flash('success', 'Profile updated');
        res.redirect('/user/profile');
    } catch (err) { next(err); }
};

module.exports = { getUserDashboard, getProfile, postProfile };
