const express = require('express');
const router = express.Router();
const paymentsController = require('../../controllers/admin/paymentsController');
const { isAuthenticated, isAdmin } = require('../../middleware/auth');

// Apply authentication and admin middleware to all routes
router.use(isAuthenticated);
router.use(isAdmin);

// Get all payments with filters and pagination
router.get('/', paymentsController.getAllPayments);

// Get payment details by ID
router.get('/:id', paymentsController.getPaymentById);

// Update payment status
router.put('/:id/status', paymentsController.updatePaymentStatus);

// Process refund
router.post('/:id/refund', paymentsController.processRefund);

module.exports = router;
