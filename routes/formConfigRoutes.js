const express = require('express');
const router = express.Router();
const formConfigController = require('../controllers/formConfigController');

// Middleware to check admin authentication for API routes
const requireAdminAuth = (req, res, next) => {
    // Check if user is logged in as admin via session
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({
            success: false,
            message: 'Admin authentication required'
        });
    }
};

// Admin routes for form configuration
router.use(requireAdminAuth);

router.get('/', formConfigController.getAllFormConfigs);
router.get('/:id', formConfigController.getFormConfig);
router.post('/', formConfigController.saveFormConfig);
router.put('/:id', formConfigController.saveFormConfig);
router.delete('/:id', formConfigController.deleteFormConfig);
router.post('/reorder', formConfigController.reorderFormConfigs);

module.exports = router;
