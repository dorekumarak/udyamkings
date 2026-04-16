const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const {
    createOrder,
    verifyPayment,
    getPaymentStatus,
    getAllPayments,
    updateApplicationFee,
    getApplicationFee,
    processRefund
} = require('../controllers/paymentController');

// User routes
router.post('/create-order', isAuthenticated, createOrder);
router.post('/verify-payment', isAuthenticated, verifyPayment);
router.get('/status/:applicationId', isAuthenticated, getPaymentStatus);

// Admin routes
router.get('/admin/all', isAuthenticated, isAdmin, getAllPayments);
router.get('/admin/fee', isAuthenticated, isAdmin, getApplicationFee);
router.put('/admin/fee', isAuthenticated, isAdmin, updateApplicationFee);
router.post('/admin/refund/:applicationId', isAuthenticated, isAdmin, processRefund);

module.exports = router;
