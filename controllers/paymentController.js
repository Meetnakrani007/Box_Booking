const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Owner = require('../models/Owner');
const User = require('../models/User');

const getRazorpayInstance = () => new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ─── GET /bookings/:id/pay ────────────────────────────────────────────────────
const getCheckout = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('box').lean();
        if (!booking) return res.status(404).render('error/404', { title: '404 Not Found' });
        if (booking.status !== 'pending') {
            req.flash('error', 'This booking is not awaiting payment');
            return res.redirect('/user/dashboard');
        }

        const razorpay = getRazorpayInstance();
        const order = await razorpay.orders.create({
            amount: booking.totalAmount * 100, // paise
            currency: 'INR',
            receipt: booking._id.toString()
        });

        // Persist order id
        await Booking.findByIdAndUpdate(booking._id, { razorpayOrderId: order.id });

        res.render('payment/checkout', {
            title: 'Complete Payment',
            booking,
            order,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (err) { next(err); }
};

// ─── POST /bookings/:id/verify ────────────────────────────────────────────────
const verifyPayment = async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        const booking = await Booking.findOne({ razorpayOrderId: razorpay_order_id });
        if (!booking) { req.flash('error', 'Booking not found'); return res.redirect('/user/dashboard'); }

        if (expectedSignature !== razorpay_signature) {
            booking.status = 'failed';
            await booking.save();
            req.flash('error', 'Payment verification failed');
            return res.redirect('/user/dashboard');
        }

        // Simulated Split Payment Logic for Academic Use
        // All money initially goes to admin's Razorpay account. Split is logged internally.
        const ownerDoc = await Owner.findById(booking.owner);
        const adminDoc = await User.findOne({ role: 'admin' });

        const commissionPercent = ownerDoc ? ownerDoc.commissionPercent : 9;
        const commissionAmount = Math.round(booking.totalAmount * (commissionPercent / 100));
        const ownerAmount = booking.totalAmount - commissionAmount;

        if (ownerDoc) {
            ownerDoc.totalEarnings = (ownerDoc.totalEarnings || 0) + ownerAmount;
            await ownerDoc.save();
        }

        if (adminDoc) {
            adminDoc.totalCommission = (adminDoc.totalCommission || 0) + commissionAmount;
            adminDoc.totalRevenue = (adminDoc.totalRevenue || 0) + booking.totalAmount;
            await adminDoc.save();
        }

        booking.status = 'confirmed';
        booking.paymentId = razorpay_payment_id;
        booking.commissionAmount = commissionAmount;
        booking.ownerAmount = ownerAmount;
        booking.paymentMethod = 'razorpay';
        booking.paymentDate = new Date();
        await booking.save();

        req.flash('success', 'Payment successful! Your booking is confirmed.');
        res.redirect(`/bookings/${booking._id}`);
    } catch (err) { next(err); }
};

module.exports = { getCheckout, verifyPayment };
