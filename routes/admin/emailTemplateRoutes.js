const express = require('express');
const router = express.Router();
const emailTemplateController = require('../../controllers/admin/emailTemplateController');

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

// Get all email templates
router.get('/', emailTemplateController.getAllEmailTemplates);

// Get email template by ID
router.get('/:id', emailTemplateController.getEmailTemplateById);

// Create new email template
router.post('/', emailTemplateController.createEmailTemplate);

// Update email template
router.put('/:id', emailTemplateController.updateEmailTemplate);

// Delete email template
router.delete('/:id', emailTemplateController.deleteEmailTemplate);

// Send test email
router.post('/:id/test', emailTemplateController.sendTestEmail);

// Preview email template
router.post('/:id/preview', emailTemplateController.previewEmailTemplate);

// Get template variables
router.get('/variables', emailTemplateController.getTemplateVariables);

module.exports = router;
