const express = require('express');
const router = express.Router();
const { getBoxListing, getBoxDetail, getBoxMap, getBoxMapData } = require('../controllers/publicController');

router.get('/', getBoxListing);
router.get('/map', getBoxMap);              // Must be before /:id
router.get('/api/map-data', getBoxMapData); // JSON for Google Maps
router.get('/:id', getBoxDetail);

module.exports = router;
