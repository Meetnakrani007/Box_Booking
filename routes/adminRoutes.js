const express = require('express');
const path = require('path');
const multer = require('multer');
const {
  ensureAuthenticated,
  ensureRole
} = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/adminController');
const { getAdminRevenueDashboard, getAdminRevenueApi, postOwnerPayout } = require('../controllers/revenueController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public', 'uploads', 'boxes'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '';
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });

router.use(ensureAuthenticated, ensureRole('admin'));

router.get('/dashboard', getAdminDashboard);

router.get('/owners', getOwners);
router.get('/owners/create', getCreateOwner);
router.post('/owners/create', postCreateOwner);
router.get('/owners/:id/edit', getEditOwner);
router.put('/owners/:id', postEditOwner);
router.delete('/owners/:id', deleteOwner);

router.get('/boxes', getBoxes);
router.get('/boxes/create', getCreateBox);
router.post('/boxes/create', upload.array('images', 5), postCreateBox);
router.get('/boxes/assign', getAssignOwner);
router.post('/boxes/assign', postAssignOwner);
router.get('/boxes/:id/edit', getEditBox);
router.put('/boxes/:id', upload.array('images', 5), postEditBox);
router.delete('/boxes/:id', deleteBox);

router.get('/revenue', getAdminRevenueDashboard);
router.post('/revenue/payout', postOwnerPayout);
router.get('/api/revenue', getAdminRevenueApi);

module.exports = router;

