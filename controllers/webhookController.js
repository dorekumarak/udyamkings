const crypto = require('crypto');
const { Application } = require('../models');
const logger = require('../utils/logger');

exports.handleWebhook = async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);
    
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

    if (signature !== expectedSignature) {
        return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const { event, payload } = req.body;
    
    try {
        if (event === 'payment.captured') {
            const { order_id, payment_id } = payload.payment.entity;
            
            await Application.update(
                {
                    payment_status: 'paid',
                    razorpay_payment_id: payment_id,
                    razorpay_signature: signature,
                    payment_date: new Date()
                },
                { where: { razorpay_order_id: order_id } }
            );
        }
        
        res.json({ success: true });
    } catch (error) {
        logger.error('Webhook error:', {
            error: error.message,
            stack: error.stack,
            event: req.body.event,
            payload: req.body.payload
        });
        res.status(500).json({ success: false, error: error.message });
    }
};
