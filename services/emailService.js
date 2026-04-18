const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

exports.sendPaymentConfirmation = async (user, paymentDetails) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@udyamkings.com',
        to: user.email,
        subject: 'Payment Confirmation - UdyamKings',
        html: `
            <h2>Payment Received Successfully!</h2>
            <p>Dear ${user.name},</p>
            <p>We have received your payment of ₹${paymentDetails.amount} for application #${paymentDetails.applicationId}.</p>
            <p>Payment ID: ${paymentDetails.paymentId}</p>
            <p>Thank you for choosing UdyamKings!</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info('Payment confirmation email sent', {
            userEmail: user.email,
            applicationId: paymentDetails.applicationId,
            paymentId: paymentDetails.paymentId
        });
    } catch (error) {
        logger.error('Error sending payment confirmation email:', {
            error: error.message,
            stack: error.stack,
            userEmail: user.email,
            paymentDetails
        });
    }
};
