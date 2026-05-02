const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureRole } = require('../middleware/authMiddleware');
const { getBookingForm, postCreateBooking, getBookingDetail, cancelBooking } = require('../controllers/bookingController');
const { getCheckout, verifyPayment } = require('../controllers/paymentController');

router.get('/boxes/:id/book', ensureAuthenticated, getBookingForm);
router.post('/bookings', ensureAuthenticated, postCreateBooking);
router.get('/bookings/:id', ensureAuthenticated, getBookingDetail);
router.post('/bookings/:id/cancel', ensureAuthenticated, cancelBooking);
router.get('/bookings/:id/pay', ensureAuthenticated, getCheckout);
router.post('/bookings/:id/verify', ensureAuthenticated, verifyPayment);

module.exports = router;
