const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const formFieldController = require('../../controllers/admin/formFieldController');

// Apply authentication and admin middleware to all routes
router.use(protect);
router.use(authorize('admin'));

// Get all form fields
router.get('/', formFieldController.getFormFields);

// Get single form field
router.get('/:id', formFieldController.getFormField);

// Create new form field
router.post('/', formFieldController.createFormField);

// Update form field
router.put('/:id', formFieldController.updateFormField);

// Delete form field
router.delete('/:id', formFieldController.deleteFormField);

// Reorder form fields
router.put('/reorder', formFieldController.reorderFormFields);

module.exports = router;
