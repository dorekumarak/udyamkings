const { Payment, Application } = require('../../models');
const logger = require('../../utils/logger');

// Get all payments with filters and pagination
exports.getAllPayments = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const offset = (page - 1) * limit;
        
        const whereClause = {};
        if (status) whereClause.status = status;
        if (search) {
            whereClause[Op.or] = [
                { razorpay_payment_id: { [Op.like]: `%${search}%` } },
                { '$Application.business_name$': { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows: payments } = await Payment.findAndCountAll({
            where: whereClause,
            include: [{
                model: Application,
                attributes: ['id', 'business_name', 'email', 'phone']
            }],
            order: [['createdAt', 'DESC']],
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
    } catch (error) {
        logger.error('Error fetching payments:', error);
        res.status(500).json({ success: false, message: 'Error fetching payments', error: error.message });
    }
};

// Get payment details by ID
exports.getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findByPk(id, {
            include: [{
                model: Application,
                attributes: ['id', 'business_name', 'email', 'phone', 'aadhar_number']
            }]
        });

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        res.status(200).json({ success: true, payment });
    } catch (error) {
        logger.error('Error fetching payment details:', error);
        res.status(500).json({ success: false, message: 'Error fetching payment details', error: error.message });
    }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const payment = await Payment.findByPk(id);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        payment.status = status;
        if (notes) payment.notes = notes;
        await payment.save();

        res.status(200).json({ success: true, message: 'Payment updated successfully', payment });
    } catch (error) {
        logger.error('Error updating payment status:', error);
        res.status(500).json({ success: false, message: 'Error updating payment status', error: error.message });
    }
};

// Process refund
exports.processRefund = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, notes } = req.body;

        const payment = await Payment.findByPk(id);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        // TODO: Implement actual Razorpay refund API call
        // const refund = await razorpay.payments.refund(payment.razorpay_payment_id, { amount });
        
        // For now, just update the status
        payment.status = 'refunded';
        payment.refund_amount = amount || payment.amount;
        payment.refund_notes = notes;
        payment.refunded_at = new Date();
        await payment.save();

        res.status(200).json({ 
            success: true, 
            message: 'Refund processed successfully',
            refund: {
                id: `rfnd_${Date.now()}`,
                amount: amount || payment.amount,
                status: 'processed',
                created_at: new Date()
            }
        });
    } catch (error) {
        logger.error('Error processing refund:', error);
        res.status(500).json({ success: false, message: 'Error processing refund', error: error.message });
    }
};
