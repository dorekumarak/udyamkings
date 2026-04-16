const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../../middleware/auth');
const { getAllPayments, getPaymentDetails } = require('../../controllers/admin/paymentAdminController');

// Get all payments (with pagination and filtering)
router.get('/payments', isAuthenticated, isAdmin, getAllPayments);

// Get payment details
router.get('/payments/:id', isAuthenticated, isAdmin, getPaymentDetails);

module.exports = router;
