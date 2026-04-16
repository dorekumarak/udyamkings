const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const paymentController = require('../../controllers/admin/paymentController');

// Apply authentication and admin middleware to all routes
router.use(protect);
router.use(authorize('admin'));

// Get all payments with filters and pagination
router.get('/', paymentController.getPayments);

// Get payment statistics
router.get('/stats', paymentController.getPaymentStats);

// Export payments to CSV
router.get('/export', paymentController.exportPayments);

// Get single payment by ID
router.get('/:id', paymentController.getPayment);

// Process refund
router.post('/:id/refund', paymentController.processRefund);

// Get refund details
router.get('/:id/refund-details', paymentController.getRefundDetails);

module.exports = router;
