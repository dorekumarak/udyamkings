const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { Application } = require('../models');

// Payment success page
router.get('/payment-success', isAuthenticated, async (req, res) => {
    try {
        const { order_id, payment_id, amount } = req.query;
        
        // Find the application for this order
        const application = await Application.findOne({
            where: { razorpay_order_id: order_id, user_id: req.user.id }
        });

        if (!application) {
            return res.status(404).render('error', {
                message: 'Application not found',
                error: { status: 404 }
            });
        }

        res.render('payment-success', {
            order: {
                id: order_id,
                amount: amount || application.application_fee * 100
            },
            payment: {
                razorpay_payment_id: payment_id
            },
            user: req.user
        });
    } catch (error) {
        console.error('Payment success error:', error);
        res.status(500).render('error', {
            message: 'Error processing payment success',
            error: req.app.get('env') === 'development' ? error : {}
        });
    }
});

module.exports = router;
