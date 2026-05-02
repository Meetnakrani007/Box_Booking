const User = require('../models/User');
const Owner = require('../models/Owner');
const Box = require('../models/Box');
const fs = require('fs');
const { sendOwnerWelcomeEmail } = require('../utils/email');

const getAdminDashboard = async (req, res, next) => {
  try {
    const [userCount, ownerCount, boxCount] = await Promise.all([
      User.countDocuments(),
      Owner.countDocuments(),
      Box.countDocuments()
    ]);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      stats: { userCount, ownerCount, boxCount }
    });
  } catch (err) {
    next(err);
  }
};

const getOwners = async (req, res, next) => {
  try {
    const owners = await Owner.find()
      .populate('user')
      .lean();
    res.render('admin/owners/index', {
      title: 'Manage Owners',
      owners
    });
  } catch (err) {
    next(err);
  }
};

const getCreateOwner = (req, res) => {
  res.render('admin/owners/create', {
    title: 'Create Owner'
  });
};

const postCreateOwner = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      accountName,
      accountNumber,
      ifsc,
      bankName,
      upiId
    } = req.body;

    if (!name || !email || !password || !phone) {
      req.flash('error', 'Name, email, password, and phone number are required');
      return res.redirect('/admin/owners/create');
    }

    const existing = await User.findOne({ email });
    if (existing) {
      req.flash('error', 'Email already in use');
      return res.redirect('/admin/owners/create');
    }

    const user = new User({
      name,
      email,
      password,
      role: 'owner',
      isVerified: true // Admins bypass email verification
    });
    await user.save();

    const owner = new Owner({
      user: user._id,
      phone,
      bankDetails: {
        accountName,
        accountNumber,
        ifsc,
        bankName,
        upiId
      }
    });
    await owner.save();

    // Send the welcome email with credentials
    await sendOwnerWelcomeEmail(email, name, password);

    req.flash('success', 'Owner created successfully and welcome email sent');
    res.redirect('/admin/owners');
  } catch (err) {
    next(err);
  }
};

const getBoxes = async (req, res, next) => {
  try {
    const boxes = await Box.find()
      .populate({
        path: 'owner',
        populate: { path: 'user' }
      })
      .lean();
    res.render('admin/boxes/index', {
      title: 'Manage Boxes',
      boxes
    });
  } catch (err) {
    next(err);
  }
};

const getCreateBox = (req, res) => {
  res.render('admin/boxes/create', {
    title: 'Create Box',
    facilities: Box.FACILITIES
  });
};

const postCreateBox = async (req, res, next) => {
  try {
    const {
      name,
      location,
      city,
      pricePerHour,
      description,
      latitude,
      longitude
    } = req.body;

    if (!name || !location || !city || !pricePerHour) {
      req.flash('error', 'Name, location, city and price are required');
      return res.redirect('/admin/boxes/create');
    }

    const facilities = Array.isArray(req.body.facilities)
      ? req.body.facilities
      : req.body.facilities
        ? [req.body.facilities]
        : [];

    const images = (req.files || []).map((f) => `/uploads/boxes/${f.filename}`);

    const box = new Box({
      name,
      location,
      city,
      pricePerHour,
      description,
      facilities,
      images,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined
    });

    await box.save();

    req.flash('success', 'Box created successfully');
    res.redirect('/admin/boxes');
  } catch (err) {
    next(err);
  }
};

const getAssignOwner = async (req, res, next) => {
  try {
    const boxes = await Box.find().lean();
    const owners = await Owner.find()
      .populate('user')
      .lean();
    res.render('admin/boxes/assign', {
      title: 'Assign Box to Owner',
      boxes,
      owners
    });
  } catch (err) {
    next(err);
  }
};

const postAssignOwner = async (req, res, next) => {
  try {
    const { boxId, ownerId } = req.body;
    if (!boxId || !ownerId) {
      req.flash('error', 'Box and Owner are required');
      return res.redirect('/admin/boxes/assign');
    }

    const [box, owner] = await Promise.all([
      Box.findById(boxId),
      Owner.findById(ownerId)
    ]);
    if (!box || !owner) {
      req.flash('error', 'Invalid box or owner');
      return res.redirect('/admin/boxes/assign');
    }

    box.owner = owner._id;
    await box.save();

    if (!owner.assignedBoxes.includes(box._id)) {
      owner.assignedBoxes.push(box._id);
      await owner.save();
    }

    req.flash('success', 'Box assigned to owner successfully');
    res.redirect('/admin/boxes');
  } catch (err) {
    next(err);
  }
};

// ─── EDIT BOX ─────────────────────────────────────────────────────────────────
const getEditBox = async (req, res, next) => {
  try {
    const box = await Box.findById(req.params.id).lean();
    if (!box) { req.flash('error', 'Box not found'); return res.redirect('/admin/boxes'); }
    const owners = await Owner.find().populate('user').lean();
    res.render('admin/boxes/edit', { title: 'Edit Box', box, facilities: Box.FACILITIES, owners });
  } catch (err) { next(err); }
};

const postEditBox = async (req, res, next) => {
  try {
    const box = await Box.findById(req.params.id);
    if (!box) { req.flash('error', 'Box not found'); return res.redirect('/admin/boxes'); }
    const { name, location, city, pricePerHour, description, latitude, longitude } = req.body;
    box.name = name || box.name;
    box.location = location || box.location;
    box.city = city || box.city;
    box.pricePerHour = pricePerHour || box.pricePerHour;
    box.description = description;
    box.latitude = latitude ? Number(latitude) : box.latitude;
    box.longitude = longitude ? Number(longitude) : box.longitude;
    box.facilities = Array.isArray(req.body.facilities)
      ? req.body.facilities
      : req.body.facilities ? [req.body.facilities] : [];
    if (req.files && req.files.length > 0) {
      box.images = req.files.map(f => `/uploads/boxes/${f.filename}`);
    }
    await box.save();
    req.flash('success', 'Box updated successfully');
    res.redirect('/admin/boxes');
  } catch (err) { next(err); }
};

const deleteBox = async (req, res, next) => {
  try {
    const box = await Box.findById(req.params.id);
    if (!box) { req.flash('error', 'Box not found'); return res.redirect('/admin/boxes'); }
    // Remove box from any owner's assignedBoxes
    await Owner.updateMany({ assignedBoxes: box._id }, { $pull: { assignedBoxes: box._id } });
    await box.deleteOne();
    req.flash('success', 'Box deleted');
    res.redirect('/admin/boxes');
  } catch (err) { next(err); }
};

// ─── EDIT OWNER ────────────────────────────────────────────────────────────────
const getEditOwner = async (req, res, next) => {
  try {
    const owner = await Owner.findById(req.params.id).populate('user').lean();
    if (!owner) { req.flash('error', 'Owner not found'); return res.redirect('/admin/owners'); }
    res.render('admin/owners/edit', { title: 'Edit Owner', owner });
  } catch (err) { next(err); }
};

const postEditOwner = async (req, res, next) => {
  try {
    const owner = await Owner.findById(req.params.id).populate('user');
    if (!owner) { req.flash('error', 'Owner not found'); return res.redirect('/admin/owners'); }
    const { name, phone, accountName, accountNumber, ifsc, bankName, upiId } = req.body;
    owner.user.name = name || owner.user.name;
    await owner.user.save();
    owner.phone = phone || owner.phone;
    owner.bankDetails = { accountName, accountNumber, ifsc, bankName, upiId };
    await owner.save();
    req.flash('success', 'Owner updated');
    res.redirect('/admin/owners');
  } catch (err) { next(err); }
};

const deleteOwner = async (req, res, next) => {
  try {
    const owner = await Owner.findById(req.params.id);
    if (!owner) { req.flash('error', 'Owner not found'); return res.redirect('/admin/owners'); }
    // Unassign their boxes
    await Box.updateMany({ owner: owner._id }, { $set: { owner: null } });
    await User.findByIdAndDelete(owner.user);
    await owner.deleteOne();
    req.flash('success', 'Owner deleted');
    res.redirect('/admin/owners');
  } catch (err) { next(err); }
};

module.exports = {
  getAdminDashboard,
  getOwners,
  getCreateOwner,
  postCreateOwner,
  getBoxes,
  getCreateBox,
  postCreateBox,
  getAssignOwner,
  postAssignOwner,
  getEditBox,
  postEditBox,
  deleteBox,
  getEditOwner,
  postEditOwner,
  deleteOwner
};

