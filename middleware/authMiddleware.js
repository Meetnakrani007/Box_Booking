const User = require('../models/User');

const ensureAuthenticated = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      req.flash('error', 'Please log in to continue');
      return res.redirect('/auth/login');
    }

    const user = await User.findById(req.session.userId).lean();
    if (!user) {
      req.session.destroy(() => {});
      req.flash('error', 'Session expired. Please log in again.');
      return res.redirect('/auth/login');
    }

    req.user = user;
    res.locals.currentUser = user;
    next();
  } catch (err) {
    next(err);
  }
};

const ensureRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      req.flash('error', 'You are not authorized to access this resource');
      return res.redirect('/');
    }
    next();
  };

module.exports = {
  ensureAuthenticated,
  ensureRole
};

