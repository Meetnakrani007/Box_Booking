const mongoose = require('mongoose');

const FACILITIES = [
  'Water',
  'Change Room',
  'Lighting',
  'Parking',
  'Seating',
  'Warm-Up Area',
  'Washroom',
  'Power Backup',
  'First Aid',
  'CCTV',
  'Equipment'
];

const boxSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    pricePerHour: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
    images: [{ type: String }],
    facilities: [
      {
        type: String,
        enum: FACILITIES
      }
    ],
    latitude: { type: Number },
    longitude: { type: Number },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Owner',
      default: null
    }
  },
  { timestamps: true }
);

boxSchema.statics.FACILITIES = FACILITIES;

module.exports = mongoose.model('Box', boxSchema);

