const nodemailer = require('nodemailer');

// Set up the transporter
// In production, these should be real SMTP credentials in your .env
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Send an OTP email to the user.
 * If SMTP_USER is not configured, it will just console.log the OTP for testing.
 * @param {string} toEmail - The recipient's email address
 * @param {string} otp - The 6-digit OTP code
 */
const sendOTP = async (toEmail, otp) => {
    // If SMTP credentials are not set, just log to console to allow local testing
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('\n=============================================');
        console.log(`🔑 DEV MODE OTP: Email to ${toEmail}`);
        console.log(`YOUR OTP IS: ${otp}`);
        console.log('=============================================\n');
        return true;
    }

    try {
        const mailOptions = {
            from: `"BoxHook Admin" <${process.env.SMTP_USER}>`,
            to: toEmail,
            subject: 'Verify your BoxHook Account',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <h2 style="color: #22c55e;">BoxHook Registration</h2>
                    <p>Thank you for registering! Please use the following 6-digit code to verify your email address:</p>
                    <div style="background: #f3f4f6; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0; border-radius: 6px;">
                        ${otp}
                    </div>
                    <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes.</p>
                    <p style="color: #6b7280; font-size: 14px;">If you did not request this, please ignore this email.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('OTP Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return false;
    }
};

/**
 * Send a Password Reset OTP email to the user.
 * @param {string} toEmail - The recipient's email address
 * @param {string} otp - The 6-digit OTP code
 */
const sendPasswordResetOTP = async (toEmail, otp) => {
    // If SMTP credentials are not set, log to console
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('\n=============================================');
        console.log(`🔑 DEV MODE PASSWORD RESET: Email to ${toEmail}`);
        console.log(`YOUR RESET OTP IS: ${otp}`);
        console.log('=============================================\n');
        return true;
    }

    try {
        const mailOptions = {
            from: `"BoxHook Admin" <${process.env.SMTP_USER}>`,
            to: toEmail,
            subject: 'Password Reset Request - BoxHook',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <h2 style="color: #3b82f6;">Password Reset Request</h2>
                    <p>We received a request to reset your password. Please use the following 6-digit code to authorize this reset:</p>
                    <div style="background: #f3f4f6; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0; border-radius: 6px;">
                        ${otp}
                    </div>
                    <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes.</p>
                    <p style="color: #6b7280; font-size: 14px;">If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Password Reset Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending Password Reset email:', error);
        return false;
    }
};

const sendOwnerWelcomeEmail = async (toEmail, name, password) => {
    // If SMTP credentials are not set, log to console
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('\n=============================================');
        console.log(`🔑 DEV MODE WELCOME: Email to ${toEmail}`);
        console.log(`YOUR PASSWORD IS: ${password}`);
        console.log('=============================================\n');
        return true;
    }

    try {
        const mailOptions = {
            from: `"BoxHook Admin" <${process.env.SMTP_USER}>`,
            to: toEmail,
            subject: 'Welcome to BoxHook! Your Owner Account is Ready',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <h1 style="color: #22c55e; margin: 0;">BoxHook</h1>
                    </div>
                    <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px;">
                        <h2 style="color: #1e293b; margin-top: 0;">Welcome, ${name}!</h2>
                        <p style="color: #475569; font-size: 16px; line-height: 1.5;">Your venue owner account has been successfully created by the BoxHook administration team. You can now log in to your dashboard to manage your venues, view bookings, and track earnings.</p>
                        
                        <div style="margin: 25px 0; background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 6px;">
                            <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: 600;">Your Login Credentials</p>
                            <p style="margin: 0 0 8px 0; color: #1e293b; font-size: 16px;"><strong>Email:</strong> ${toEmail}</p>
                            <p style="margin: 0; color: #1e293b; font-size: 16px;"><strong>Password:</strong> <span style="font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${password}</span></p>
                        </div>

                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.APP_URL || 'http://localhost:9090'}/auth/login" style="background-color: #22c55e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; display: inline-block;">Login to Dashboard</a>
                        </div>
                    </div>
                    <p style="color: #94a3b8; font-size: 13px; text-align: center; margin-top: 25px;">For security reasons, we strongly recommend changing your password after your first login.<br>If you have any questions, please contact the admin team.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Welcome Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending Welcome email:', error);
        return false;
    }
};

module.exports = {
    sendOTP,
    sendPasswordResetOTP,
    sendOwnerWelcomeEmail
};
