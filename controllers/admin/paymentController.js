const { Payment, Application, User } = require('../../models');
const asyncHandler = require('../../middleware/async');
const { Op } = require('sequelize');
const Razorpay = require('razorpay');

// Function to get Razorpay configuration dynamically
async function getRazorpayConfig() {
    const Content = require('../../models').Content;

    try {
        // Try to get keys from database first
        const keyIdSetting = await Content.findOne({
            where: { key: 'razorpay_key_id', category: 'settings' }
        });

        const keySecretSetting = await Content.findOne({
            where: { key: 'razorpay_key_secret', category: 'settings' }
        });

        // Use database values if available, otherwise fall back to env vars
        const keyId = keyIdSetting?.value || process.env.RAZORPAY_KEY_ID;
        const keySecret = keySecretSetting?.value || process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            throw new Error('Razorpay keys not configured. Please set them in admin panel or environment variables.');
        }

        return { keyId, keySecret };
    } catch (error) {
        console.error('Error getting Razorpay config:', error);
        // Fallback to env vars
        return {
            keyId: process.env.RAZORPAY_KEY_ID,
            keySecret: process.env.RAZORPAY_KEY_SECRET
        };
    }
}

// Function to initialize Razorpay with current config
async function getRazorpayInstance() {
    const config = await getRazorpayConfig();
    return new Razorpay({
        key_id: config.keyId,
        key_secret: config.keySecret
    });
}

// @desc    Get all payments with filters and pagination
// @route   GET /api/v1/admin/payments
// @access  Private/Admin
exports.getPayments = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        status,
        search,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build where clause
    const whereClause = {};
    
    if (status) {
        whereClause.status = status;
    }
    
    if (search) {
        whereClause[Op.or] = [
            { razorpay_payment_id: { [Op.like]: `%${search}%` } },
            { '$Application.business_name$': { [Op.like]: `%${search}%` } },
            { '$Application.User.email$': { [Op.like]: `%${search}%` } }
        ];
    }
    
    if (startDate && endDate) {
        whereClause.createdAt = {
            [Op.between]: [new Date(startDate), new Date(endDate)]
        };
    }

    const { count, rows: payments } = await Payment.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: Application,
                include: [
                    {
                        model: User,
                        attributes: ['name', 'email']
                    }
                ]
            }
        ],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
    });

    res.status(200).json({
        success: true,
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        payments
    });
});

// @desc    Get single payment by ID
// @route   GET /api/v1/admin/payments/:id
// @access  Private/Admin
exports.getPayment = asyncHandler(async (req, res) => {
    const payment = await Payment.findByPk(req.params.id, {
        include: [
            {
                model: Application,
                include: [
                    {
                        model: User,
                        attributes: ['name', 'email', 'mobile']
                    }
                ]
            }
        ]
    });

    if (!payment) {
        return res.status(404).json({
            success: false,
            message: 'Payment not found'
        });
    }

    res.status(200).json({
        success: true,
        data: payment
    });
});

// @desc    Process refund
// @route   POST /api/v1/admin/payments/:id/refund
// @access  Private/Admin
exports.processRefund = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount, notes } = req.body;

    const payment = await Payment.findByPk(id, {
        include: [Application]
    });

    if (!payment) {
        return res.status(404).json({
            success: false,
            message: 'Payment not found'
        });
    }

    if (payment.status !== 'captured') {
        return res.status(400).json({
            success: false,
            message: 'Payment can only be refunded if captured'
        });
    }

    if (payment.refund_amount && payment.refund_amount > 0) {
        return res.status(400).json({
            success: false,
            message: 'Payment has already been refunded'
        });
    }

    try {
        // Get Razorpay instance with current config
        const razorpay = await getRazorpayInstance();

        // Process refund with Razorpay
        const refund = await razorpay.payments.refund(payment.razorpay_payment_id, {
            amount: amount || payment.amount,
            notes: notes || {
                application_id: payment.Application.id,
                business_name: payment.Application.business_name,
                refunded_by: req.user.name
            }
        });

        // Update payment record
        await payment.update({
            status: 'refunded',
            refund_amount: amount || payment.amount,
            refund_id: refund.id,
            refund_notes: notes,
            refund_date: new Date()
        });

        // Update application payment status
        await payment.Application.update({
            payment_status: 'refunded'
        });

        res.status(200).json({
            success: true,
            message: 'Refund processed successfully',
            data: {
                payment,
                refund
            }
        });
    } catch (error) {
        console.error('Refund error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process refund',
            error: error.message
        });
    }
});

// @desc    Get payment statistics
// @route   GET /api/v1/admin/payments/stats
// @access  Private/Admin
exports.getPaymentStats = asyncHandler(async (req, res) => {
    const totalPayments = await Payment.count();
    const capturedPayments = await Payment.count({
        where: { status: 'captured' }
    });
    const failedPayments = await Payment.count({
        where: { status: 'failed' }
    });
    const refundedPayments = await Payment.count({
        where: { status: 'refunded' }
    });

    // Calculate total revenue
    const capturedPaymentRecords = await Payment.findAll({
        where: { status: 'captured' },
        attributes: ['amount']
    });
    
    const totalRevenue = capturedPaymentRecords.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

    // Get monthly payment data
    const monthlyData = await Payment.findAll({
        attributes: [
            [require('sequelize').fn('MONTH', require('sequelize').col('createdAt')), 'month'],
            [require('sequelize').fn('YEAR', require('sequelize').col('createdAt')), 'year'],
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
            [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total']
        ],
        where: {
            createdAt: {
                [require('sequelize').Op.gte]: new Date(new Date().getFullYear(), 0, 1)
            }
        },
        group: [
            require('sequelize').fn('MONTH', require('sequelize').col('createdAt')),
            require('sequelize').fn('YEAR', require('sequelize').col('createdAt'))
        ],
        order: [
            [require('sequelize').fn('YEAR', require('sequelize').col('createdAt')), 'ASC'],
            [require('sequelize').fn('MONTH', require('sequelize').col('createdAt')), 'ASC']
        ]
    });

    res.status(200).json({
        success: true,
        data: {
            total_payments: totalPayments,
            captured_payments: capturedPayments,
            failed_payments: failedPayments,
            refunded_payments: refundedPayments,
            total_revenue: totalRevenue / 100, // Convert from paise to rupees
            monthly_data: monthlyData
        }
    });
});

// @desc    Export payments to CSV
// @route   GET /api/v1/admin/payments/export
// @access  Private/Admin
exports.exportPayments = asyncHandler(async (req, res) => {
    const { status, startDate, endDate } = req.query;
    
    // Build where clause
    const whereClause = {};
    
    if (status) {
        whereClause.status = status;
    }
    
    if (startDate && endDate) {
        whereClause.createdAt = {
            [Op.between]: [new Date(startDate), new Date(endDate)]
        };
    }

    const payments = await Payment.findAll({
        where: whereClause,
        include: [
            {
                model: Application,
                include: [
                    {
                        model: User,
                        attributes: ['name', 'email']
                    }
                ]
            }
        ],
        order: [['createdAt', 'DESC']]
    });

    // Convert to CSV
    const csv = convertToCSV(payments);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=payments.csv');
    res.send(csv);
});

// @desc    Get refund details
// @route   GET /api/v1/admin/payments/:id/refund-details
// @access  Private/Admin
exports.getRefundDetails = asyncHandler(async (req, res) => {
    const payment = await Payment.findByPk(req.params.id);

    if (!payment) {
        return res.status(404).json({
            success: false,
            message: 'Payment not found'
        });
    }

    if (!payment.refund_id) {
        return res.status(404).json({
            success: false,
            message: 'No refund found for this payment'
        });
    }

    try {
        // Get Razorpay instance with current config
        const razorpay = await getRazorpayInstance();

        // Get refund details from Razorpay
        const refund = await razorpay.payments.fetchRefund(payment.refund_id);

        res.status(200).json({
            success: true,
            data: {
                payment,
                refund
            }
        });
    } catch (error) {
        console.error('Refund details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch refund details',
            error: error.message
        });
    }
});

// Helper function to convert payments to CSV
function convertToCSV(payments) {
    const headers = [
        'Payment ID',
        'Business Name',
        'Applicant Name',
        'Email',
        'Amount',
        'Status',
        'Refund Amount',
        'Refund ID',
        'Created Date',
        'Refund Date'
    ];
    
    const rows = payments.map(payment => [
        payment.razorpay_payment_id || 'N/A',
        payment.Application.business_name,
        payment.Application.User.name,
        payment.Application.User.email,
        (payment.amount / 100).toFixed(2),
        payment.status,
        payment.refund_amount ? (payment.refund_amount / 100).toFixed(2) : '0',
        payment.refund_id || 'N/A',
        payment.createdAt.toISOString().split('T')[0],
        payment.refund_date ? payment.refund_date.toISOString().split('T')[0] : 'N/A'
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}
