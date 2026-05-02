const express = require('express');
const router = express.Router();
const {
  getRegister,
  postRegister,
  getLogin,
  postLogin,
  getVerifyEmail,
  postVerifyEmail,
  postResendOtp,
  getForgot,
  postForgot,
  getReset,
  postReset,
  logout
} = require('../controllers/authController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

router.get('/register', getRegister);
router.post('/register', postRegister);

router.get('/login', getLogin);
router.post('/login', postLogin);

router.get('/verify-email', getVerifyEmail);
router.post('/verify-email', postVerifyEmail);
router.post('/resend-otp', postResendOtp);

router.get('/forgot', getForgot);
router.post('/forgot', postForgot);

router.get('/reset', getReset);
router.post('/reset', postReset);

router.post('/logout', ensureAuthenticated, logout);

module.exports = router;

