const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const contentController = require('../../controllers/admin/contentController');

// Apply authentication and admin middleware to all routes
router.use(protect);
router.use(authorize('admin'));

// Get all content
router.get('/', contentController.getAllContent);

// Get content by category
router.get('/category/:category', contentController.getContentByCategory);

// Get single content by ID
router.get('/:id', contentController.getContentById);

// Create new content
router.post('/', contentController.createContent);

// Update content
router.put('/:id', contentController.updateContent);

// Delete content
router.delete('/:id', contentController.deleteContent);

// Bulk update content
router.put('/bulk', contentController.bulkUpdateContent);

module.exports = router;
