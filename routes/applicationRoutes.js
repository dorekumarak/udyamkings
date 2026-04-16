const express = require('express');
const router = express.Router();
const { isAuthenticated, isEmailVerified, ensureAuthenticated } = require('../middleware/auth');
const applicationController = require('../controllers/applicationController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../public/uploads/applications');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('Multer destination:', uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = file.fieldname + '-' + uniqueSuffix + ext;
        console.log('Multer filename:', filename);
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'));
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Create user uploads directory if it doesn't exist
const uploadDirUser = path.join(__dirname, '../public/uploads/users');
if (!fs.existsSync(uploadDirUser)) {
    fs.mkdirSync(uploadDirUser, { recursive: true });
}

// Configure multer for user document uploads
const storageUser = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDirUser);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = file.fieldname + '-' + uniqueSuffix + ext;
        cb(null, filename);
    }
});

const uploadUser = multer({ 
    storage: storageUser,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Public route to get form configuration
router.get('/api/application/form-config', applicationController.getFormConfig);

// Application form routes
router.get('/apply', ensureAuthenticated, async function(req, res) {
  try {
    const { Application } = require('../models');
    const draftApplication = await Application.findOne({ 
      where: { user_id: req.user.id, application_status: 'draft' } 
    });

    res.render('apply-new', { 
      title: 'Apply for Funding | UdyamKings',
      layout: false,
      draftApplication: draftApplication ? draftApplication.toJSON() : null,
      user: req.user
    });
  } catch (error) {
    console.error('Error rendering /apply:', error);
    res.status(500).send('Error loading application form: ' + error.message);
  }
});
router.post(
    '/apply',
    ensureAuthenticated,
    upload.fields([
        { name: 'aadharFile', maxCount: 1 },
        { name: 'gstFile', maxCount: 1 },
        { name: 'registrationFile', maxCount: 1 },
        { name: 'financialFile', maxCount: 5 }
    ]),
    applicationController.submitApplication
);

// Application status routes
router.get('/applications', applicationController.getUserApplications);
router.get('/applications/:id', applicationController.getApplicationDetails);

router.get('/profile', ensureAuthenticated, async (req, res) => {
  const { Application } = require('../models');
  const application = await Application.findOne({ where: { user_id: req.user.id } });
  res.render('profile', { 
    title: 'My Profile | UdyamKings',
    user: req.user,
    hasApplication: !!application,
    messages: {
      error: req.flash('error'),
      error_msg: req.flash('error_msg'),
      success_msg: req.flash('success_msg')
    }
  });
});

router.post('/api/upload-document', ensureAuthenticated, uploadUser.single('document'), async (req, res) => {
  try {
    const { type } = req.body;
    const filePath = req.file.filename;
    const { User } = require('../models');
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // Map type to field
    const fieldMap = {
      aadhar: 'aadhar_path',
      gst: 'gst_path',
      registration: 'registration_path',
      financial: 'financial_path'
    };
    const field = fieldMap[type];
    if (!field) {
      return res.status(400).json({ success: false, message: 'Invalid document type' });
    }
    user[field] = filePath;
    await user.save();
    res.json({ success: true, message: 'Document uploaded successfully' });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

router.post('/api/delete-document', ensureAuthenticated, async (req, res) => {
  try {
    const { type } = req.body;
    const { User } = require('../models');
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const fieldMap = {
      aadhar: 'aadhar_path',
      gst: 'gst_path',
      registration: 'registration_path',
      financial: 'financial_path'
    };
    const field = fieldMap[type];
    if (!field) {
      return res.status(400).json({ success: false, message: 'Invalid document type' });
    }
    if (user[field]) {
      // Delete the file
      const filePath = path.join(__dirname, '../public/uploads/users', user[field]);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      user[field] = null;
      await user.save();
    }
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

// Admin routes
router.get('/admin/applications', 
    isAdmin, 
    applicationController.getAllApplications
);
router.put('/admin/applications/:id/status',
    isAdmin,
    applicationController.updateApplicationStatus
);

module.exports = router;

// Helper function to check if user is admin
function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    res.status(403).json({ message: 'Access denied. Admin privileges required.' });
}