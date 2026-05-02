const User = require('../models/User');
const { sendOTP } = require('../utils/email');

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const getRegister = (req, res) => {
  res.render('auth/register', { title: 'Register' });
};

const postRegister = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      req.flash('error', 'All fields are required');
      return res.redirect('/auth/register');
    }

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/auth/register');
    }

    const existing = await User.findOne({ email });
    if (existing) {
      req.flash('error', 'Email already registered');
      return res.redirect('/auth/register');
    }

    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';

    const otp = generateOTP();

    const user = new User({
      name,
      email,
      password,
      role,
      isVerified: false,
      verificationOtp: otp,
      otpExpires: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    await user.save();

    await sendOTP(user.email, otp);

    req.flash('success', 'Registration successful. Please check your email for the verification code.');
    res.redirect(`/auth/verify-email?email=${encodeURIComponent(user.email)}`);
  } catch (err) {
    next(err);
  }
};

const getLogin = (req, res) => {
  res.render('auth/login', { title: 'Login' });
};

const postLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error', 'Email and password are required');
      return res.redirect('/auth/login');
    }

    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/auth/login');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/auth/login');
    }

    if (!user.isVerified) {
      req.flash('error', 'Please verify your email address before logging in.');
      return res.redirect(`/auth/verify-email?email=${encodeURIComponent(user.email)}`);
    }

    req.session.userId = user._id;
    req.flash('success', 'Logged in successfully');

    return res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
};

// ─── OTP VERIFICATION ─────────────────────────────────────────────────────────────

const getVerifyEmail = (req, res) => {
  const email = req.query.email || '';
  res.render('auth/verify', { title: 'Verify Email', email });
};

const postVerifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      req.flash('error', 'Missing required fields.');
      return res.redirect(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    }

    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/auth/register');
    }

    if (user.isVerified) {
      req.flash('info', 'Your account is already verified. Please log in.');
      return res.redirect('/auth/login');
    }

    if (user.verificationOtp !== otp) {
      req.flash('error', 'Invalid OTP code.');
      return res.redirect(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    }

    if (user.otpExpires < Date.now()) {
      req.flash('error', 'OTP code has expired. Please request a new one.');
      return res.redirect(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    }

    // Mark as verified
    user.isVerified = true;
    user.verificationOtp = null;
    user.otpExpires = null;
    await user.save();

    // Log the user in
    req.session.userId = user._id;
    req.flash('success', 'Email verified successfully! You are now logged in.');
    res.redirect('/dashboard');

  } catch (err) {
    next(err);
  }
};

const postResendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      req.flash('error', 'Email is required to resend OTP.');
      return res.redirect('/auth/login');
    }

    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Account not found.');
      return res.redirect('/auth/register');
    }

    if (user.isVerified) {
      req.flash('info', 'Account is already verified. Please log in.');
      return res.redirect('/auth/login');
    }

    const otp = generateOTP();
    user.verificationOtp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendOTP(user.email, otp);

    req.flash('success', 'A new verification code has been sent to your email.');
    res.redirect(`/auth/verify-email?email=${encodeURIComponent(user.email)}`);

  } catch (err) {
    next(err);
  }
};

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────────

const getForgot = (req, res) => {
  res.render('auth/forgot', { title: 'Forgot Password' });
};

const postForgot = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      req.flash('error', 'Please provide an email address.');
      return res.redirect('/auth/forgot');
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Security best practice: Don't reveal if account exists
      req.flash('success', 'If an account exists, a password reset code was sent.');
      return res.redirect('/auth/login');
    }

    const otp = generateOTP();
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendPasswordResetOTP(user.email, otp);

    req.flash('success', 'A password reset code has been sent to your email.');
    // Redirect to the reset page where they enter the OTP and new password
    res.redirect(`/auth/reset?email=${encodeURIComponent(user.email)}`);
  } catch (err) {
    next(err);
  }
};

const getReset = (req, res) => {
  const email = req.query.email || '';
  res.render('auth/reset', { title: 'Reset Password', email });
};

const postReset = async (req, res, next) => {
  try {
    const { email, otp, password, confirmPassword } = req.body;

    if (!email || !otp || !password || !confirmPassword) {
      req.flash('error', 'All fields are required.');
      return res.redirect(`/auth/reset?email=${encodeURIComponent(email)}`);
    }

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect(`/auth/reset?email=${encodeURIComponent(email)}`);
    }

    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Invalid request.');
      return res.redirect('/auth/forgot');
    }

    if (user.resetPasswordOtp !== otp) {
      req.flash('error', 'Invalid or expired OTP code.');
      return res.redirect(`/auth/reset?email=${encodeURIComponent(email)}`);
    }

    if (user.resetPasswordExpires < Date.now()) {
      req.flash('error', 'OTP code has expired. Please request a new one.');
      return res.redirect('/auth/forgot');
    }

    // Update password
    user.password = password;
    user.resetPasswordOtp = null;
    user.resetPasswordExpires = null;
    await user.save();

    req.flash('success', 'Your password has been reset successfully! You can now log in.');
    res.redirect('/auth/login');
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
};

module.exports = {
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
};

