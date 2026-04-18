const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { Application, User } = require('../models');
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../public/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only image and PDF files are allowed'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Apply authentication middleware to all admin routes
router.use(isAuthenticated);
router.use(isAdmin);

// Admin Dashboard
router.get('/', adminController.getDashboard);

// Application Routes
router.get('/applications', adminController.listApplications);
router.get('/applications/:id', adminController.viewApplication);

// Application Status Update
router.put('/applications/:id/status', adminController.updateApplicationStatus);

// Application Deletion
router.delete('/applications/:id', adminController.deleteApplication);

// Form Configuration
router.get('/form-config', adminController.getFormConfig);

// Form Field Management
router.post('/form-config/fields', adminController.saveFormField);
router.post('/form-config/fields/:fieldId', adminController.saveFormField);
router.delete('/form-config/fields/:fieldId', adminController.deleteFormField);
router.post('/form-config/reorder', adminController.reorderFields);
router.post('/form-config/reset', adminController.resetFormConfig);

// File Upload Endpoint (for form builder)
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Return the file path relative to the public directory
    const filePath = '/uploads/' + path.basename(req.file.path);
    res.json({ 
        success: true, 
        filePath: filePath,
        fileName: req.file.originalname,
        fileSize: req.file.size
    });
});

// Export Applications
router.get('/applications/export', async (req, res) => {
    try {
        const { format = 'csv', startDate, endDate } = req.query;
        
        let whereClause = {};
        if (startDate && endDate) {
            whereClause.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }
        
        const applications = await Application.findAll({
            where: whereClause,
            include: [{
                model: User,
                as: 'user',
                attributes: ['name', 'email', 'mobile']
            }],
            order: [['createdAt', 'DESC']]
        });
        
        if (format === 'csv') {
            // Convert to CSV
            let csv = 'ID,Business Name,Applicant,Email,Phone,Amount,Status,Date\n';
            
            applications.forEach(app => {
                csv += `"${app.id}",`;
                csv += `"${app.business_name}",`;
                csv += `"${app.user?.name || 'N/A'}",`;
                csv += `"${app.user?.email || 'N/A'}",`;
                csv += `"${app.user?.mobile || 'N/A'}",`;
                csv += `"${app.amount_requested}",`;
                csv += `"${app.application_status}",`;
                csv += `"${app.createdAt.toISOString().split('T')[0]}"\n`;
            });
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=applications.csv');
            return res.send(csv);
        } else if (format === 'excel') {
            // In a real app, you would use a library like exceljs
            res.status(501).send('Excel export not yet implemented');
        } else if (format === 'pdf') {
            // In a real app, you would use a library like pdfkit or puppeteer
            res.status(501).send('PDF export not yet implemented');
        } else {
            res.status(400).json({ error: 'Invalid export format' });
        }
    } catch (error) {
        console.error('Error exporting applications:', error);
        res.status(500).json({ error: 'Error exporting applications' });
    }
});

module.exports = router;
