const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureRole } = require('../middleware/authMiddleware');
const { getUserDashboard, getProfile, postProfile } = require('../controllers/userController');

router.use(ensureAuthenticated, ensureRole('user'));

router.get('/dashboard', getUserDashboard);
router.get('/profile', getProfile);
router.post('/profile', postProfile);

module.exports = router;
