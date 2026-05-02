const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/authMiddleware');

const Box = require('../models/Box');

router.get('/', async (req, res, next) => {
  try {
    const featuredBoxes = await Box.find().sort({ createdAt: -1 }).limit(3).lean();
    res.render('home', { title: 'BoxHook - Home', featuredBoxes });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard', ensureAuthenticated, (req, res) => {
  if (req.user.role === 'admin') return res.redirect('/admin/dashboard');
  if (req.user.role === 'owner') return res.redirect('/owner/dashboard');
  return res.redirect('/user/dashboard');
});

// ─── Legal Pages ─────────────────────────────────────────────────────────────
router.get('/privacy', (req, res) => {
  res.render('legal/privacy', { title: 'Privacy Policy' });
});

router.get('/terms', (req, res) => {
  res.render('legal/terms', { title: 'Terms of Service' });
});

router.get('/cookies', (req, res) => {
  res.render('legal/cookies', { title: 'Cookie Policy' });
});

module.exports = router;

