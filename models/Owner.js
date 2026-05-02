const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    phone: {
      type: String,
      required: true
    },
    bankDetails: {
      accountName: String,
      accountNumber: String,
      ifsc: String,
      bankName: String,
      upiId: String
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    commissionPercent: {
      type: Number,
      default: 9
    },
    totalPaid: {
      type: Number,
      default: 0
    },
    assignedBoxes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Box'
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Owner', ownerSchema);

