const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Application, ApplicationSetting, User } = require('../models');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_1234567890', // Replace with actual key
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret_1234567890' // Replace with actual secret
});

// Create Razorpay order
const createOrder = async (req, res) => {
    try {
        const { applicationId } = req.body;
        const userId = req.user.id;

        // Get application fee from settings
        const applicationFee = await ApplicationSetting.getApplicationFee();

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: applicationFee * 100, // Convert to paise
            currency: 'INR',
            receipt: `receipt_${applicationId}`,
            notes: {
                applicationId: applicationId.toString(),
                userId: userId.toString()
            }
        });

        // Update application with order ID
        await Application.update(
            { 
                razorpay_order_id: order.id,
                application_fee: applicationFee
            },
            { where: { id: applicationId, user_id: userId } }
        );

        res.json({
            success: true,
            order: order
        });
    } catch (error) {
        logger.error('Error creating Razorpay order:', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            applicationId: req.body.applicationId
        });
        res.status(500).json({
            success: false,
            message: 'Failed to create payment order',
            error: error.message
        });
    }
};

// Verify payment
const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            applicationId
        } = req.body;

        const userId = req.user.id;

        // Verify signature
        const generatedSignature = crypto
            .createHmac('sha256', razorpay.key_secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }

        // Update application with payment details
        const [updated] = await Application.update(
            {
                razorpay_payment_id: razorpay_payment_id,
                razorpay_signature: razorpay_signature,
                payment_status: 'paid',
                payment_date: new Date(),
                application_status: 'pending' // Set to pending for admin review
            },
            { 
                where: { id: applicationId, user_id: userId },
                returning: true
            }
        );

        if (updated) {
            // Get user details for email
            const user = await User.findByPk(userId);
            
            // Send payment confirmation email
            await emailService.sendPaymentConfirmation(user, {
                amount: updated.application_fee,
                applicationId: updated.id,
                paymentId: razorpay_payment_id
            });
        }

        res.json({
            success: true,
            message: 'Payment verified successfully',
            application: updated
        });
    } catch (error) {
        logger.error('Payment verification failed:', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            applicationId
        });
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: error.message
        });
    }
};

// Get payment status
const getPaymentStatus = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const userId = req.user.id;

        const application = await Application.findOne({
            where: { id: applicationId, user_id: userId },
            attributes: ['id', 'payment_status', 'application_status', 'application_fee', 'razorpay_order_id']
        });

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        res.json({
            success: true,
            payment: application
        });
    } catch (error) {
        logger.error('Error getting payment status:', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            applicationId: req.params.applicationId
        });
        res.status(500).json({
            success: false,
            message: 'Failed to get payment status',
            error: error.message
        });
    }
};

// Admin: Get all payments
const getAllPayments = async (req, res) => {
    try {
        const payments = await Application.findAll({
            attributes: [
                'id',
                'user_id',
                'business_name',
                'payment_status',
                'application_status',
                'application_fee',
                'razorpay_order_id',
                'razorpay_payment_id',
                'created_at'
            ],
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            payments: payments
        });
    } catch (error) {
        logger.error('Error getting all payments:', {
            error: error.message,
            stack: error.stack,
            adminId: req.user?.id
        });
        res.status(500).json({
            success: false,
            message: 'Failed to get payments',
            error: error.message
        });
    }
};

// Admin: Update application fee
const updateApplicationFee = async (req, res) => {
    try {
        const { fee } = req.body;

        if (!fee || isNaN(fee) || fee <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid fee amount'
            });
        }

        await ApplicationSetting.updateApplicationFee(fee);

        res.json({
            success: true,
            message: 'Application fee updated successfully',
            fee: parseFloat(fee)
        });
    } catch (error) {
        logger.error('Error updating application fee:', {
            error: error.message,
            stack: error.stack,
            adminId: req.user?.id,
            newFee: req.body.fee
        });
        res.status(500).json({
            success: false,
            message: 'Failed to update application fee',
            error: error.message
        });
    }
};

// Admin: Get current application fee
const getApplicationFee = async (req, res) => {
    try {
        const fee = await ApplicationSetting.getApplicationFee();

        res.json({
            success: true,
            fee: fee
        });
    } catch (error) {
        logger.error('Error getting application fee:', {
            error: error.message,
            stack: error.stack,
            adminId: req.user?.id
        });
        res.status(500).json({
            success: false,
            message: 'Failed to get application fee',
            error: error.message
        });
    }
};

// Admin: Process refund
const processRefund = async (req, res) => {
    try {
        const { applicationId } = req.params;

        const application = await Application.findOne({
            where: { id: applicationId }
        });

        if (!application || !application.razorpay_payment_id) {
            return res.status(404).json({
                success: false,
                message: 'Application or payment not found'
            });
        }

        // Process refund through Razorpay
        const refund = await razorpay.refunds.create({
            payment_id: application.razorpay_payment_id,
            amount: application.application_fee * 100 // Convert to paise
        });

        // Update application status
        await Application.update(
            {
                payment_status: 'refunded',
                application_status: 'rejected'
            },
            { where: { id: applicationId } }
        );

        res.json({
            success: true,
            message: 'Refund processed successfully',
            refund: refund
        });
    } catch (error) {
        logger.error('Error processing refund:', {
            error: error.message,
            stack: error.stack,
            adminId: req.user?.id,
            applicationId: req.params.applicationId
        });
        res.status(500).json({
            success: false,
            message: 'Failed to process refund',
            error: error.message
        });
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    getPaymentStatus,
    getAllPayments,
    updateApplicationFee,
    getApplicationFee,
    processRefund
};
