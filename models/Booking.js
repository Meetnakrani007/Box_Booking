const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        box: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Box',
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Owner',
            required: true
        },
        date: { type: String, required: true }, // YYYY-MM-DD
        startTime: { type: String, required: true }, // HH:MM (24h)
        endTime: { type: String, required: true }, // HH:MM (24h)
        totalAmount: { type: Number, required: true, min: 0 },
        commissionAmount: { type: Number, default: 0 },
        ownerAmount: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled', 'completed'],
            default: 'pending'
        },
        paymentId: { type: String, default: null },
        razorpayOrderId: { type: String, default: null },
        paymentMethod: { type: String, default: 'razorpay' },
        paymentDate: { type: Date, default: null }
    },
    { timestamps: true }
);

// Compound index for overlap detection
bookingSchema.index({ box: 1, date: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
