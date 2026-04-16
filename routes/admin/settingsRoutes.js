const express = require('express');
const router = express.Router();
const settingsController = require('../../controllers/admin/settingsController');

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

// Apply authentication to all routes
router.use(requireAdminAuth);

// Get all settings
router.get('/', settingsController.getSettings);

// Update setting
router.put('/:key', settingsController.updateSetting);

// Admin user management
router.get('/admin-users', settingsController.getAdminUsers);
router.post('/admin-users', settingsController.createAdminUser);
router.put('/admin-users/:id', settingsController.updateAdminUser);
router.delete('/admin-users/:id', settingsController.deleteAdminUser);

// Backup management
router.post('/backup', settingsController.backupDatabase);
router.get('/backups', settingsController.getBackups);
router.get('/backups/:filename', settingsController.downloadBackup);
router.delete('/backups/:filename', settingsController.deleteBackup);

// Change current admin password
router.post('/change-password', settingsController.changePassword);

module.exports = router;
