# 📋 BoxHook - Project Overview for Viva

## **Project Summary**
**BoxHook** is a full-stack **Box Cricket Venue Booking Platform** built with modern web technologies. It enables users to discover, book, and pay for box cricket venues online, while providing venue owners with a management dashboard and platform administrators with complete system control.

---

## **1. TECHNOLOGY STACK**

### **Backend**
- **Framework**: Express.js (Node.js)
- **Runtime**: Node.js ≥ 18
- **Language**: JavaScript (CommonJS)

### **Database**
- **Primary DB**: MongoDB (via Mongoose ODM)
- **Session Store**: MongoDB (connect-mongo)

### **Frontend**
- **Template Engine**: EJS (Embedded JavaScript Templating)
- **Layout System**: express-ejs-layouts
- **Styling**: CSS (custom)

### **Key Libraries**
| Purpose | Library | Version |
|---------|---------|---------|
| Authentication | bcrypt | 6.0.0 |
| Sessions | express-session | 1.19.0 |
| Payments | razorpay | 2.9.6 |
| File Upload | multer | 2.0.2 |
| Rate Limiting | express-rate-limit | 8.2.1 |
| Email | nodemailer | 8.0.1 |
| HTTP Override | method-override | 3.0.0 |
| Flash Messages | express-flash | 0.0.2 |
| Environment | dotenv | 17.3.1 |

---

## **2. CORE FEATURES**

### **Phase 1: Authentication System** ✅
- User registration with email verification
- OTP-based email verification
- Password hashing (bcrypt)
- Secure login/logout with session management
- Password reset via OTP
- Three user roles: **Admin**, **Owner**, **User**

### **Phase 2: Admin Panel** ✅
- **Owner Management**: Create, edit, delete owners
- **Box Management**: 
  - Create/edit/delete venues (boxes)
  - Upload multiple images per venue
  - Assign boxes to owners
  - Set pricing and facilities
- **Revenue Tracking**: View platform commission earnings
- Role-based access control

### **Phase 3: Public Pages** ✅
- Browse all available venues
- Filter boxes by city, price range, facilities
- Detailed venue pages with images, location, facilities
- Interactive map display with latitude/longitude
- Search and sorting functionality

### **Phase 4: Booking System** ✅
- Real-time slot availability checking
- **Database-level overlap prevention**: Prevents double-booking at DB level
- Slot booking with date & time selection
- Automatic calculation of total amount
- Commission split: Platform (% commission) + Owner (remaining)
- Booking status tracking: pending → confirmed → completed/cancelled

### **Phase 5: Payment Integration** ✅
- **Razorpay Integration** for online payments
- Order creation and payment verification
- HMAC signature verification for security
- Test & Live keys support
- Automatic commission calculation and split

### **Phase 6: User Dashboard** ✅
- View all personal bookings with status
- Cancel bookings (with status updates)
- Edit profile information
- Personal dashboard home

### **Phase 7: Owner Dashboard** ✅
- View assigned boxes
- View all bookings for their boxes
- Mark bookings as completed
- Revenue tracking per box
- Payout management

### **Phase 8: Hardening & Security** ✅
- Rate limiting on auth endpoints (login/register)
- File validation for image uploads
- Pagination for large datasets
- Custom 404 & 500 error pages
- Input sanitization and validation
- CSRF protection via session

### **Phase 9: Production Ready** ✅
- `.env.example` configuration template
- Auto-creation of uploads directory
- Environment-based configuration
- Comprehensive README documentation

---

## **3. DATABASE SCHEMA**

### **User Model**
```
{
  name, email, password (hashed), 
  role: [admin | owner | user],
  isVerified, verificationOtp, otpExpires,
  resetPasswordOtp, resetPasswordExpires,
  totalCommission,
  createdAt, updatedAt
}
```

### **Box Model**
```
{
  name, location, city,
  pricePerHour,
  description,
  images: [URLs],
  facilities: [FACILITIES enum],
  latitude, longitude,
  owner: ObjectId (ref),
  createdAt, updatedAt
}
```

### **Booking Model**
```
{
  box: ObjectId (ref),
  user: ObjectId (ref),
  owner: ObjectId (ref),
  date: YYYY-MM-DD,
  startTime: HH:MM (24h),
  endTime: HH:MM (24h),
  totalAmount, commissionAmount, ownerAmount,
  status: [pending | confirmed | cancelled | completed],
  paymentId, razorpayOrderId,
  paymentMethod, paymentDate,
  createdAt, updatedAt
}
```

### **Owner Model**
```
{
  name, email,
  boxes: [ObjectId refs],
  totalEarnings, payouts,
  createdAt, updatedAt
}
```

### **Payout Model**
```
{
  owner: ObjectId (ref),
  amount,
  status: [pending | processed],
  createdAt, updatedAt
}
```

---

## **4. PROJECT STRUCTURE**

```
/
├── controllers/              # Business logic layer
│   ├── adminController.js    # Admin box/owner management
│   ├── authController.js     # Register, login, logout, password reset
│   ├── bookingController.js  # Booking creation, cancellation, overlap check
│   ├── ownerController.js    # Owner dashboard, revenue
│   ├── paymentController.js  # Razorpay integration
│   ├── publicController.js   # Public browsing, filtering
│   ├── revenueController.js  # Platform revenue tracking
│   └── userController.js     # User profile, dashboard
│
├── models/                   # MongoDB Mongoose schemas
│   ├── Booking.js
│   ├── Box.js
│   ├── Owner.js
│   ├── Payout.js
│   └── User.js
│
├── routes/                   # API endpoints
│   ├── adminRoutes.js        # /admin/*
│   ├── authRoutes.js         # /auth/*
│   ├── bookingRoutes.js      # /bookings/*
│   ├── boxRoutes.js          # /boxes/*
│   ├── indexRoutes.js        # /
│   ├── ownerRoutes.js        # /owner/*
│   └── userRoutes.js         # /user/*
│
├── middleware/
│   └── authMiddleware.js     # Authentication & authorization
│
├── views/                    # EJS templates
│   ├── layouts/layout.ejs    # Main layout wrapper
│   ├── auth/                 # Login, register, password reset
│   ├── admin/                # Admin dashboard & CRUD forms
│   ├── boxes/                # Public listing, detail, map
│   ├── bookings/             # Booking form, details
│   ├── user/                 # User dashboard, profile
│   ├── owner/                # Owner dashboard, revenue
│   ├── payment/              # Checkout form
│   ├── legal/                # Privacy, terms, cookies
│   ├── error/                # 404, 500 pages
│   └── partials/             # Navbar, messages
│
├── public/                   # Static files
│   ├── css/main.css
│   └── uploads/boxes/        # User-uploaded images
│
├── config/
│   └── db.js                 # MongoDB connection
│
├── utils/
│   └── email.js              # Nodemailer setup for OTP
│
├── middleware/
│   └── authMiddleware.js     # Auth checks & role-based access
│
├── server.js                 # Main Express app setup
├── package.json
└── README.md
```

---

## **5. KEY WORKFLOWS**

### **User Flow: Booking a Venue**
1. User registers/logs in
2. Browses venues on public pages (filtered by city/price/facilities)
3. Clicks on venue → sees details, images, facilities, reviews
4. Clicks "Book Now" → date/time selection
5. System checks database for overlaps
6. Shows total price = pricePerHour × hours
7. Proceeding to checkout → Razorpay payment
8. Payment verified via HMAC signature
9. Booking status: pending → confirmed
10. Confirmation email sent
11. User sees booking in dashboard

### **Owner Flow: Managing Venues**
1. Admin creates owner account
2. Admin creates box and assigns to owner
3. Owner logs in → views dashboard
4. Sees all assigned boxes and their bookings
5. Can view booking details and mark complete
6. Sees revenue generated per box
7. Requests payout (transferred to account)

### **Admin Flow: Platform Management**
1. First user to register becomes admin (auto-assigned role)
2. Manages all owners (CRUD)
3. Manages all boxes (CRUD + image upload + assign)
4. Views platform revenue (commission earned)
5. Manages user accounts and disputes
6. Views analytics dashboard

### **Payment Flow: Razorpay Integration**
1. User proceeds to checkout
2. Order created on Razorpay (server-side)
3. Razorpay order ID + key returned to frontend
4. Razorpay payment window opens
5. User pays via card/UPI/wallet
6. Payment callback sent to backend
7. HMAC verification (security check)
8. Booking confirmed if payment valid
9. Commission split recorded
10. Owner payout tracked

---

## **6. SECURITY FEATURES**

| Feature | Implementation |
|---------|-----------------|
| Password Hashing | bcrypt (6.0.0) |
| Session Management | express-session + MongoDB store |
| CSRF Protection | HTTP-only, secure cookies |
| Rate Limiting | express-rate-limit on auth endpoints |
| File Validation | Multer with type/size checks |
| Payment Security | HMAC signature verification |
| SQL Injection Protection | Mongoose ODM (no raw queries) |
| Environment Variables | .env file for secrets |
| Role-Based Access | Middleware checks on protected routes |
| OTP Authentication | Email-based verification |

---

## **7. API ENDPOINTS**

### **Authentication**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/logout` - User logout
- `POST /auth/verify-otp` - Email verification
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Password reset completion

### **Public Boxes**
- `GET /boxes` - List all boxes (with filters)
- `GET /boxes/:id` - Box details
- `GET /boxes/map` - Interactive map view

### **Bookings**
- `POST /bookings` - Create booking
- `GET /bookings/:id` - Booking details
- `DELETE /bookings/:id` - Cancel booking

### **User Dashboard**
- `GET /user/dashboard` - User bookings
- `GET /user/profile` - User profile
- `PUT /user/profile` - Update profile

### **Owner Dashboard**
- `GET /owner/dashboard` - Owner's boxes & bookings
- `GET /owner/revenue` - Revenue tracking
- `PUT /owner/bookings/:id` - Mark booking complete

### **Admin Panel**
- `GET /admin/dashboard` - Admin overview
- `GET /admin/boxes` - List all boxes
- `POST /admin/boxes` - Create box
- `PUT /admin/boxes/:id` - Edit box
- `DELETE /admin/boxes/:id` - Delete box
- `GET /admin/owners` - List owners
- `POST /admin/owners` - Create owner
- `PUT /admin/owners/:id` - Edit owner
- `DELETE /admin/owners/:id` - Delete owner
- `GET /admin/revenue` - Revenue dashboard

### **Payment**
- `POST /payment/create-order` - Razorpay order creation
- `POST /payment/verify` - Payment verification

---

## **8. ENVIRONMENT CONFIGURATION**

Required `.env` variables:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/boxhook
SESSION_SECRET=your-random-strong-secret-key
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
PORT=9090
NODE_ENV=development
ADMIN_EMAIL=admin@example.com
NODEMAILER_USER=your-email@gmail.com
NODEMAILER_PASS=app-specific-password
COMMISSION_PERCENTAGE=20
```

---

## **9. INSTALLATION & DEPLOYMENT**

### **Local Development**
```bash
git clone <repo>
cd boxhook
npm install
cp .env.example .env
# Fill in .env values
npm run dev       # With nodemon
```

### **Production**
```bash
npm install --production
npm start         # NODE_ENV=production
```

App runs on **http://localhost:9090**

---

## **10. KEY CHALLENGES & SOLUTIONS**

| Challenge | Solution |
|-----------|----------|
| Double-booking prevention | Compound index on (box, date, status) + DB-level check in controller |
| Commission tracking | Split totalAmount into commissionAmount + ownerAmount at booking time |
| File upload security | Multer with file type/size validation + sanitized filenames |
| Session persistence | MongoDB session store for distributed deployments |
| Timezone handling | Store dates as YYYY-MM-DD strings, times in 24h format |
| Payment security | HMAC signature verification prevents unauthorized transactions |
| Email delivery | Nodemailer with OAuth2 for OTP delivery |
| Concurrent bookings | Atomic database operations + overlap check logic |

---

## **11. USER ROLES & PERMISSIONS**

| Role | Permissions |
|------|------------|
| **Admin** | Create/edit/delete owners, boxes; view all revenue; manage all users |
| **Owner** | View assigned boxes; see bookings; mark complete; track revenue |
| **User** | Browse venues; make bookings; cancel bookings; edit profile; view bookings |
| **Public** | Browse boxes, view details (no account needed) |

---

## **12. SCALABILITY & FUTURE ENHANCEMENTS**

✅ **Current Implementation**
- Single Node.js instance
- MongoDB (scalable to sharding)
- Session store in DB (supports multiple instances)
- Multer for file uploads

🔮 **Future Improvements**
- Redis for session caching
- AWS S3 for image storage
- WebSockets for real-time notifications
- Advanced analytics dashboard
- Review/rating system
- Instant messaging between users & owners
- Mobile app (React Native)
- Microservices architecture (separate payment service)
- CI/CD pipeline (GitHub Actions)
- Docker containerization

---

## **13. TESTING & QUALITY**

### **Manual Testing Covered**
- ✅ Registration with email verification
- ✅ Login/logout flow
- ✅ Booking overlap prevention
- ✅ Payment flow with test Razorpay keys
- ✅ Admin CRUD operations
- ✅ Role-based access control
- ✅ File upload validation

### **Suggested Improvements**
- Unit tests (Jest)
- Integration tests (Supertest)
- E2E tests (Cypress/Playwright)
- Load testing (Artillery)
- Security audit (OWASP)

---

## **14. PROJECT HIGHLIGHTS**

🎯 **What Makes This Project Unique**
1. **Real-world use case**: Actual venue booking platform
2. **Complete CRUD operations**: Full data lifecycle management
3. **Payment integration**: Razorpay with secure verification
4. **Multi-role system**: Flexible permission hierarchy
5. **Database efficiency**: Overlap prevention at DB level
6. **Production-ready**: Error handling, logging, validation
7. **Scalable architecture**: MongoDB + session store support
8. **Security-first**: Password hashing, rate limiting, CSRF protection

---

## **15. DEMO FLOW FOR VIVA**

**Suggested Demo Sequence**:
1. Show homepage with box listings
2. Filter boxes by city/price
3. Register new user → email verification
4. Login as user
5. Browse box details → make a booking
6. Show payment flow (Razorpay test)
7. View booking in user dashboard
8. Login as admin → show admin panel
9. Create/edit a box
10. Logout → show 404/500 error pages

---

**Version**: 1.0.0  
**Author**: [Your Name]  
**Last Updated**: May 2024
