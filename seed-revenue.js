require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Owner = require('./models/Owner');
const Booking = require('./models/Booking');
const Payout = require('./models/Payout');
const Box = require('./models/Box');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/boxhook')
    .then(async () => {
        console.log('Connected to DB');

        // 1. Reset Admin Values completely to 0 first
        const admin = await User.findOne({ email: 'nakranimeet2005@gmail.com' });
        if (admin) {
            admin.totalRevenue = 0;
            admin.totalCommission = 0;
            admin.totalPaidToOwners = 0;
            await admin.save();
            console.log('Admin reset to 0');
        }

        // 2. Reset Owner Values completely to 0 first
        const userOwner = await User.findOne({ email: 'nakranimeet805@gmail.com' });
        let ownerRecord = null;
        if (userOwner) {
            ownerRecord = await Owner.findOne({ user: userOwner._id });
            if (ownerRecord) {
                ownerRecord.totalEarnings = 0;
                ownerRecord.totalPaid = 0;
                await ownerRecord.save();
                console.log('Owner reset to 0');
            }
        }

        // 3. Clear existing data to clean dashboards (Optional, but fixes 'recent transactions/payouts')
        // Remove if you want to keep old test bookings history
        await Booking.deleteMany({});
        await Payout.deleteMany({});
        console.log('Cleared existing Bookings and Payouts to provide a clean slate for the dashboard.');


        // 4. Now add the 2400 values
        const platformTotalRevenue = 2400;

        if (admin) {
            admin.totalRevenue += platformTotalRevenue;
            admin.totalCommission += (platformTotalRevenue * 0.09);
            await admin.save();
            console.log(`Admin added 2400: totalRevenue=${admin.totalRevenue}, totalCommission=${admin.totalCommission}`);
        }

        if (ownerRecord) {
            ownerRecord.totalEarnings += (platformTotalRevenue * 0.91);
            await ownerRecord.save();
            console.log(`Owner added 2400: totalEarnings=${ownerRecord.totalEarnings}`);
        }

        // 5. Create 2 Mock Bookings of 1200 each to show on the dashboard
        if (userOwner) {
            let box = await mongoose.model('Box').findOne();
            if (!box) {
                box = await mongoose.model('Box').create({
                    name: 'Dummy Box',
                    location: 'Test Location',
                    city: 'Test City',
                    pricePerHour: 600
                });
            }

            const today = new Date().toISOString().split('T')[0];

            for (let i = 0; i < 2; i++) {
                await Booking.create({
                    user: admin._id, // Just linking admin as the booker
                    owner: ownerRecord ? ownerRecord._id : null,
                    box: box._id,
                    date: today,
                    startTime: `${10 + (i * 2)}:00`,
                    endTime: `${12 + (i * 2)}:00`,
                    totalAmount: 1200,
                    commissionAmount: 1200 * 0.09,
                    ownerAmount: 1200 * 0.91,
                    status: 'completed',
                    paymentStatus: 'completed',
                    paymentDate: new Date()
                }).catch(e => console.log('Mock booking creation skipped:', e.message));
            }
            console.log("2 Mock bookings of 1200 created.");
        }
        console.log('Database seeding complete. Values reset to 0 then added 2400.');
        process.exit(0);
    })
    .catch(err => {
        console.error('Error connecting to DB:', err);
        process.exit(1);
    });
