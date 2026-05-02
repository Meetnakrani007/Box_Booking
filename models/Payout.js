const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Owner',
            required: true
        },
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 1
        },
        paymentDate: {
            type: Date,
            default: Date.now
        },
        reference: {
            type: String,
            trim: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Payout', payoutSchema);
