# BoxHook 🏏

A full-stack box cricket venue booking platform built with **Node.js, Express, MongoDB (Mongoose), EJS, and Razorpay**.

---

## Features

| Phase | Feature |
|---|---|
| ✅ Phase 1 | Auth — Register, Login, Logout (bcrypt + session) |
| ✅ Phase 2 | Admin Panel — Manage Owners & Boxes (CRUD + image upload + assign) |
| ✅ Phase 3 | Public Pages — Browse & filter venues, Box detail page |
| ✅ Phase 4 | Booking System — Slot booking with DB-level overlap prevention |
| ✅ Phase 5 | Razorpay Payment — Online payment with HMAC signature verification |
| ✅ Phase 6 | User Dashboard — View/cancel bookings, edit profile |
| ✅ Phase 7 | Owner Dashboard — View own boxes & bookings, mark complete |
| ✅ Phase 8 | Hardening — Rate limiting, file validation, pagination, error pages |
| ✅ Phase 9 | Deployment Ready — .env.example, README, uploads dir auto-creation |

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)
- Razorpay account (for payment; test keys work fine)

### 1. Clone & Install

```bash
git clone <your-repo>
cd boxhook
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Fill in your values in .env
```

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `SESSION_SECRET` | Strong random string |
| `RAZORPAY_KEY_ID` | Razorpay Test Key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay Test Key Secret |
| `PORT` | Server port (default 9090) |

### 3. Run

```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

App will be at **http://localhost:9090**

### 4. First Admin

The **first user to register** automatically gets the `admin` role.

---

## Project Structure

```
├── controllers/
│   ├── adminController.js      # Admin CRUD for boxes & owners
│   ├── authController.js       # Register, login, logout
│   ├── bookingController.js    # Create, cancel bookings (overlap check)
│   ├── ownerController.js      # Owner dashboard & booking status
│   ├── paymentController.js    # Razorpay order create + verify
│   ├── publicController.js     # Public box listing & detail
│   └── userController.js       # User dashboard & profile
├── models/
│   ├── Booking.js
│   ├── Box.js
│   ├── Owner.js
│   └── User.js
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── bookingRoutes.js
│   ├── boxRoutes.js
│   ├── indexRoutes.js
│   ├── ownerRoutes.js
│   └── userRoutes.js
├── views/
│   ├── admin/           # Admin panel views
│   ├── auth/            # Login, register
│   ├── bookings/        # Booking form, detail
│   ├── boxes/           # Public listing, detail
│   ├── error/           # 404, 500 pages
│   ├── owner/           # Owner dashboard
│   ├── payment/         # Razorpay checkout
│   ├── user/            # User dashboard, profile
│   └── layouts/layout.ejs
├── middleware/authMiddleware.js
├── public/uploads/boxes/    # Uploaded venue images
├── .env
├── .env.example
└── server.js
```

---

## Roles

| Role | Access |
|---|---|
| `admin` | Full admin panel — manage owners, boxes, assign |
| `owner` | Owner dashboard — view own venues & bookings, mark complete |
| `user` | Browse venues, book, pay, manage bookings |

---

## Razorpay Setup

1. Create an account at [razorpay.com](https://razorpay.com)
2. Go to **Settings → API Keys → Generate Test Key**
3. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to your `.env`

Payments made with test cards will **not charge real money**.
