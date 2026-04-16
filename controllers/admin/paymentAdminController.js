const { Application, User } = require('../../models');
const logger = require('../../utils/logger');

exports.getAllPayments = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;
        
        const where = {};
        if (status) where.payment_status = status;
        
        const { count, rows: payments } = await Application.findAndCountAll({
            where,
            include: [{
                model: User,
                attributes: ['id', 'name', 'email']
            }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        res.json({
            success: true,
            data: payments,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        logger.error('Error fetching payments:', {
            error: error.message,
            stack: error.stack,
            adminId: req.user?.id,
            query: req.query
        });
        res.status(500).json({ success: false, error: 'Failed to fetch payments' });
    }
};

exports.getPaymentDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        const payment = await Application.findByPk(id, {
            include: [{
                model: User,
                attributes: ['id', 'name', 'email', 'phone']
            }]
        });
        
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        
        res.json({ success: true, data: payment });
    } catch (error) {
        logger.error('Error fetching payment details:', {
            error: error.message,
            stack: error.stack,
            adminId: req.user?.id,
            paymentId: req.params.id
        });
        res.status(500).json({ success: false, error: 'Failed to fetch payment details' });
    }
};
