require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const connectMongo = require('connect-mongo');
const methodOverride = require('method-override');
const flash = require('express-flash');
const expressLayouts = require('express-ejs-layouts');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const indexRoutes = require('./routes/indexRoutes');
const adminRoutes = require('./routes/adminRoutes');
const boxRoutes = require('./routes/boxRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const User = require('./models/User');

const app = express();

connectDB();

// ─── Ensure uploads directory exists ────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'public', 'uploads', 'boxes');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

// ─── View Engine ──────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/layout');

// ─── Static Files ────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// ─── Method Override ─────────────────────────────────────────────────────────
app.use(methodOverride('_method'));

// ─── Session ─────────────────────────────────────────────────────────────────
const MongoStore =
  (connectMongo && connectMongo.create && connectMongo) ||
  (connectMongo && connectMongo.default && connectMongo.default);

const sessionStore = MongoStore
  ? MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  })
  : null;

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'changeme',
    resave: false,
    saveUninitialized: false,
    store: sessionStore || undefined,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

// ─── Flash ───────────────────────────────────────────────────────────────────
app.use(flash());

// ─── Global Locals ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.successMessages = req.flash('success');
  res.locals.errorMessages = req.flash('error');
  res.locals.currentUser = null;
  next();
});

// ─── Attach User to Request ───────────────────────────────────────────────────
app.use(async (req, res, next) => {
  try {
    if (!req.session.userId) return next();
    const user = await User.findById(req.session.userId).lean();
    if (!user) {
      req.session.destroy(() => { });
      return next();
    }
    req.user = user;
    res.locals.currentUser = user;
    next();
  } catch (err) {
    next(err);
  }
});

// ─── Rate Limiting on Auth Routes ────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 200, // Allow 200 attempts in dev/testing
  message: 'Too many attempts, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/boxes', boxRoutes);
app.use('/', bookingRoutes);   // /boxes/:id/book, /bookings/...
app.use('/user', userRoutes);
app.use('/owner', ownerRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('error/404', { title: '404 Not Found' });
});

// ─── 500 / Global Error Handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(500).render('error/500', { title: 'Server Error' });
});

const PORT = process.env.BACKEND_PORT || process.env.PORT || 9090;
app.listen(PORT, () => console.log(`BoxHook running at http://localhost:${PORT}`));
