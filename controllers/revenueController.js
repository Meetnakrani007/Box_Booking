const Booking = require('../models/Booking');
const Owner = require('../models/Owner');
const User = require('../models/User');
const Payout = require('../models/Payout');
const mongoose = require('mongoose');

const getDateFilter = (filter) => {
    const now = new Date();
    let startDate = null;
    let endDate = now;

    switch (filter) {
        case 'last15days':
            startDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
            break;
        case 'last30days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case 'currentMonth':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'previousMonth':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
        case 'currentYear':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
    }
    return { startDate, endDate };
};

// ─── ADMIN DASHBAORD RENDERING ───────────────────────────────────────────────
const getAdminRevenueDashboard = async (req, res, next) => {
    try {
        const admin = await User.findOne({ role: 'admin' });
        const owners = await Owner.find().populate('user').lean();

        res.render('admin/revenue', {
            title: 'Platform Revenue Dashboard',
            owners,
            admin
        });
    } catch (err) { next(err); }
};

// ─── ADMIN POST PAYOUT ────────────────────────────────────────────────────────
const postOwnerPayout = async (req, res, next) => {
    try {
        const { ownerId, amount, reference } = req.body;
        const payoutAmount = Number(amount);

        if (!ownerId || !payoutAmount || payoutAmount <= 0) {
            req.flash('error', 'Invalid payout details');
            return res.redirect('/admin/revenue');
        }

        const owner = await Owner.findById(ownerId);
        const admin = await User.findOne({ role: 'admin' });

        if (!owner || !admin) {
            req.flash('error', 'User not found');
            return res.redirect('/admin/revenue');
        }

        const pendingBalance = (owner.totalEarnings || 0) - (owner.totalPaid || 0);
        if (payoutAmount > pendingBalance) {
            req.flash('error', `Cannot pay more than the pending balance of ₹${pendingBalance}`);
            return res.redirect('/admin/revenue');
        }

        // Create Payout Record
        const payout = new Payout({
            owner: owner._id,
            admin: admin._id,
            amount: payoutAmount,
            reference: reference || `TXN-${Date.now()}`
        });
        await payout.save();

        // Update Balances
        owner.totalPaid = (owner.totalPaid || 0) + payoutAmount;
        await owner.save();

        admin.totalPaidToOwners = (admin.totalPaidToOwners || 0) + payoutAmount;
        await admin.save();

        req.flash('success', `Successfully paid ₹${payoutAmount} to owner`);
        res.redirect('/admin/revenue');
    } catch (err) { next(err); }
};

// ─── ADMIN REVENUE API ────────────────────────────────────────────────────────
const getAdminRevenueApi = async (req, res, next) => {
    try {
        const filter = req.query.filter || 'all';
        const { startDate, endDate } = getDateFilter(filter);

        let query = { status: { $in: ['confirmed', 'completed'] }, paymentDate: { $ne: null } };
        if (startDate) {
            query.paymentDate = { $gte: startDate, $lte: endDate };
        }

        const bookings = await Booking.find(query).populate({ path: 'owner', populate: { path: 'user' } }).lean();

        const ownersQuery = await Owner.find().populate('user').lean();

        let totalGrossRevenue = 0;
        let totalCommission = 0;
        let ownerEarnings = {};

        // Pre-fill owner object to ensure we send balances even if no new bookings in filter range
        ownersQuery.forEach(o => {
            if (o.user) {
                const totalE = o.totalEarnings || 0;
                const totalP = o.totalPaid || 0;
                ownerEarnings[o._id.toString()] = {
                    id: o._id,
                    name: o.user.name,
                    totalEarnings: totalE,
                    totalPaid: totalP,
                    pendingBalance: totalE - totalP,
                    periodEarnings: 0 // Earnings ONLY within the filtered date
                };
            }
        });

        // Aggregate for Chart.js (Daily or Monthly depending on filter)
        let chartData = {};

        bookings.forEach(b => {
            totalGrossRevenue += b.totalAmount || 0;
            totalCommission += b.commissionAmount || 0;

            if (b.owner) {
                const oid = b.owner._id.toString();
                if (ownerEarnings[oid]) {
                    ownerEarnings[oid].periodEarnings += (b.ownerAmount || 0);
                }
            }

            // Group by date string (YYYY-MM-DD or YYYY-MM)
            const dateStr = b.paymentDate.toISOString().split('T')[0];
            chartData[dateStr] = (chartData[dateStr] || 0) + (b.commissionAmount || 0);
        });

        const sortedDates = Object.keys(chartData).sort();
        const labels = sortedDates;
        const data = sortedDates.map(d => chartData[d]);

        // Recent limit 10
        const recentTransactions = bookings.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)).slice(0, 10);

        // Fetch recent payouts
        const recentPayouts = await Payout.find().populate({ path: 'owner', populate: { path: 'user' } }).sort({ paymentDate: -1 }).limit(10).lean();

        const adminDoc = await User.findOne({ role: 'admin' }).lean();
        const adminCashHolding = (adminDoc.totalRevenue || 0) - (adminDoc.totalPaidToOwners || 0);

        res.json({
            totalGrossRevenue,
            totalCommission,
            totalBookings: bookings.length,
            adminCashHolding,
            ownerEarnings: Object.values(ownerEarnings), // Convert map to array
            recentTransactions,
            recentPayouts,
            chart: { labels, data }
        });
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
};

// ─── OWNER DASHBAORD RENDERING ───────────────────────────────────────────────
const getOwnerRevenueDashboard = async (req, res, next) => {
    try {
        const owner = await Owner.findOne({ user: req.user._id }).lean();
        if (!owner) {
            req.flash('error', 'Owner profile not found');
            return res.redirect('/');
        }
        res.render('owner/revenue', { title: 'My Earnings', owner });
    } catch (err) { next(err); }
};

// ─── OWNER REVENUE API ────────────────────────────────────────────────────────
const getOwnerRevenueApi = async (req, res, next) => {
    try {
        const owner = await Owner.findOne({ user: req.user._id });
        if (!owner) return res.status(403).json({ error: 'Not authorized' });

        const filter = req.query.filter || 'all';
        const { startDate, endDate } = getDateFilter(filter);

        let query = {
            owner: owner._id,
            status: { $in: ['confirmed', 'completed'] },
            paymentDate: { $ne: null }
        };
        if (startDate) {
            query.paymentDate = { $gte: startDate, $lte: endDate };
        }

        const bookings = await Booking.find(query).populate('box').lean();

        let totalEarnings = 0;
        let chartData = {};

        bookings.forEach(b => {
            totalEarnings += b.ownerAmount || 0;
            const dateStr = b.paymentDate.toISOString().split('T')[0];
            chartData[dateStr] = (chartData[dateStr] || 0) + (b.ownerAmount || 0);
        });

        const sortedDates = Object.keys(chartData).sort();
        const labels = sortedDates;
        const data = sortedDates.map(d => chartData[d]);

        const recentTransactions = bookings.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)).slice(0, 10);
        const recentPayouts = await Payout.find({ owner: owner._id }).sort({ paymentDate: -1 }).limit(10).lean();

        const pendingBalance = (owner.totalEarnings || 0) - (owner.totalPaid || 0);

        res.json({
            totalEarnings,
            totalBookings: bookings.length,
            totalPaid: owner.totalPaid || 0,
            pendingBalance: pendingBalance,
            recentTransactions,
            recentPayouts,
            chart: { labels, data }
        });
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
};

module.exports = {
    getAdminRevenueDashboard,
    getAdminRevenueApi,
    postOwnerPayout,
    getOwnerRevenueDashboard,
    getOwnerRevenueApi
};
