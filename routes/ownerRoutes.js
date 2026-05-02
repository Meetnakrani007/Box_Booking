const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureRole } = require('../middleware/authMiddleware');
const { getOwnerDashboard, updateBookingStatus } = require('../controllers/ownerController');
const { getOwnerRevenueDashboard, getOwnerRevenueApi } = require('../controllers/revenueController');

router.use(ensureAuthenticated, ensureRole('owner'));

router.get('/dashboard', getOwnerDashboard);
router.post('/bookings/:id/status', updateBookingStatus);

router.get('/revenue', getOwnerRevenueDashboard);
router.get('/api/revenue', getOwnerRevenueApi);

module.exports = router;
