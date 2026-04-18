const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const applicationController = require('../../controllers/admin/applicationController');

// Apply authentication and admin middleware to all routes
router.use(protect);
router.use(authorize('admin'));

// Get all applications with filters and pagination
router.get('/', applicationController.getApplications);

// Export applications to CSV
router.get('/export', applicationController.exportApplications);

// Get single application by ID
router.get('/:id', applicationController.getApplication);

// Update application status
router.put('/:id/status', applicationController.updateApplicationStatus);

// Add admin note to application
router.post('/:id/notes', applicationController.addNote);

// Delete application
router.delete('/:id', applicationController.deleteApplication);

module.exports = router;
