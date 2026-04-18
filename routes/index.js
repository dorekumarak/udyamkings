const express = require('express');
const router = express.Router();
// const passport = require('passport');
// const { ensureAuthenticated, forwardAuthenticated } = require('../middleware/auth');
// const { User } = require('../models');
// const authController = require('../controllers/authController');
// console.log('AuthController loaded:', typeof authController);
// console.log('registerPage method:', typeof authController.registerPage);
const { check, validationResult } = require('express-validator');

console.log('Routes file loaded successfully');

const requireLogin = async (req, res, next) => {
  try {
    if (!req.session || !req.session.user || !req.session.user.id) {
      req.flash('error_msg', 'Please log in to access the application form');
      return res.redirect('/login');
    }

    const { User } = require('../models');
    const user = await User.findByPk(req.session.user.id);

    if (!user) {
      req.session.user = null;
      req.flash('error_msg', 'Please log in again');
      return res.redirect('/login');
    }

    // Ensure downstream routes/templates can access a full user object
    req.user = user;
    res.locals.user = user;

    return next();
  } catch (err) {
    console.error('requireLogin error:', err);
    req.flash('error_msg', 'Authentication failed. Please login again.');
    return res.redirect('/login');
  }
};

const requireApiLogin = async (req, res, next) => {
  try {
    if (!req.session || !req.session.user || !req.session.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated. Please log in.'
      });
    }

    const { User } = require('../models');
    const user = await User.findByPk(req.session.user.id);

    if (!user) {
      req.session.user = null;
      return res.status(401).json({
        success: false,
        message: 'Not authenticated. Please log in again.'
      });
    }

    req.user = user;
    res.locals.user = user;

    return next();
  } catch (err) {
    console.error('requireApiLogin error:', err);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.'
    });
  }
};

// Home route with improved error handling
router.get('/', (req, res, next) => {
  try {
    console.log('Processing home route...');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const currentPath = req.path;
    
    const templateVars = {
      title: 'Home - UdyamKings',
      description: 'Empowering Entrepreneurs with Funding and Support',
      user: req.user || null,
      fullUrl: baseUrl,
      url: {
        pathname: currentPath
      },
      path: currentPath,
      appUrl: baseUrl,
      messages: {
        error: req.flash('error') || [],
        success: req.flash('success') || [],
        error_msg: req.flash('error_msg') || [],
        success_msg: req.flash('success_msg') || []
      }
    };
    
    console.log('Rendering index template with variables');
    res.render('index', templateVars);
  } catch (error) {
    console.error('Error in home route:', error);
    next(error); // Pass to express error handler
  }
});

// Test route at the beginning
router.get('/test', (req, res) => {
  res.send('Test route works');
});

// Admin login route (move to top)
router.get('/admin/login', (req, res) => {
  console.log('ADMIN LOGIN ROUTE HIT!');
  res.render('auth/admin-login', { 
    title: 'Admin Login',
    user: req.user,
    messages: {
      error: req.flash('error'),
      error_msg: req.flash('error_msg'),
      success_msg: req.flash('success_msg')
    },
    formData: {},
    layout: false  // Ensure no layout is used
  });
});

// Admin debug route
router.get('/admin/debug', (req, res) => {
  res.json({ 
    message: 'Admin debug route works',
    timestamp: new Date().toISOString()
  });
});

// Contact page route
router.get('/contact', (req, res) => {
  res.render('contact', { 
    title: 'Contact | UdyamKings',
    user: req.user,
    messages: {
      error: req.flash('error'),
      error_msg: req.flash('error_msg'),
      success_msg: req.flash('success_msg')
    },
    layout: false
  });
});

// Contact form submission
router.post('/contact', [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('message', 'Message is required').not().isEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error_msg', errors.array().map(err => err.msg).join('. '));
    return res.redirect('/contact');
  }

  const { name, email, subject, message } = req.body;
  
  // Here you would typically send an email or save to database
  // For now, just show success message
  req.flash('success_msg', 'Thank you for contacting us! We will get back to you soon.');
  res.redirect('/contact');
});

// About page route
router.get('/about', (req, res) => {
  res.render('about', { 
    title: 'About | UdyamKings',
    user: req.user,
    messages: {
      error: req.flash('error'),
      error_msg: req.flash('error_msg'),
      success_msg: req.flash('success_msg')
    },
    layout: false
  });
});

// Home route
router.get('/', (req, res) => {
  res.render('home-full', { 
    title: 'Home | UdyamKings',
    page: 'home',
    user: req.user,
    messages: {
      error: req.flash('error'),
      error_msg: req.flash('error_msg'),
      success_msg: req.flash('success_msg')
    }
  });
});

// Auth routes
router.get('/login', (req, res) => {
  res.render('auth/login', { 
    title: 'Login',
    user: req.user,
    path: req.path,
    messages: {
      error: req.flash('error'),
      error_msg: req.flash('error_msg'),
      success_msg: req.flash('success_msg')
    },
    formData: {},
    layout: false
  });
});

// Admin login POST route
router.post('/admin/login', [
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password is required').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('auth/admin-login', {
        title: 'Admin Login',
        user: req.user,
        messages: {
          error: 'Please fix the errors below',
          error_msg: errors.array().map(e => e.msg),
          success_msg: req.flash('success_msg')
        },
        formData: req.body,
        layout: false
      });
    }

    const { email, password } = req.body;

    // Check if admin credentials (for demo, use hardcoded credentials)
    if (email === 'admin@udyamkings.com' && password === 'admin123') {
      req.session.adminId = 1; // Admin ID
      req.session.adminRole = 'super_admin'; // Admin role
      req.session.adminPermissions = {
        applicants: ['read', 'write', 'delete'],
        payments: ['read', 'refund'],
        forms: ['read', 'write'],
        content: ['read', 'write'],
        settings: ['read', 'write']
      };
      req.flash('success_msg', 'Welcome to Admin Panel');
      return res.redirect('/admin/dashboard');
    }

    req.flash('error', 'Invalid admin credentials');
    res.redirect('/admin/login');
  } catch (error) {
    console.error('Admin login error:', error);
    req.flash('error', 'An error occurred during login');
    res.redirect('/admin/login');
  }
});

// Login form submission (email + password)
router.post('/login', [
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Check if this is an AJAX request
    if (req.xhr || req.headers.accept === 'application/json') {
      return res.status(400).json({
        success: false,
        message: errors.array().map(err => err.msg).join('. ')
      });
    }
    req.flash('error_msg', errors.array().map(err => err.msg).join('. '));
    return res.redirect('/login');
  }

  const { email, password } = req.body;

  try {
    const { User } = require('../models');
    const user = await User.findOne({ where: { email } });

    if (!user) {
      if (req.xhr || req.headers.accept === 'application/json') {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/login');
    }

    // Check if email is verified
    if (!user.email_verified) {
      if (req.xhr || req.headers.accept === 'application/json') {
        return res.status(401).json({
          success: false,
          message: 'Please verify your email before logging in'
        });
      }
      req.flash('error_msg', 'Please verify your email before logging in');
      return res.redirect('/login');
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      if (req.xhr || req.headers.accept === 'application/json') {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/login');
    }

    // Login successful - create session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    // Return JSON response for AJAX requests
    if (req.xhr || req.headers.accept === 'application/json') {
      return res.json({
        success: true,
        message: 'Login successful'
      });
    }

    req.flash('success_msg', 'Login successful');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    if (req.xhr || req.headers.accept === 'application/json') {
      return res.status(500).json({
        success: false,
        message: 'An error occurred during login'
      });
    }
    req.flash('error_msg', 'An error occurred during login');
    res.redirect('/login');
  }
});

// 2) Show login OTP form
router.get('/login-otp', (req, res) => {
  res.render('auth/login-otp', {
    title: 'Enter Login OTP',
    user: req.user,
    messages: {
      error: req.flash('error'),
      error_msg: req.flash('error_msg'),
      success_msg: req.flash('success_msg')
    }
  });
});

// 3) Handle login OTP submission
router.post('/login-otp', (req, res, next) => {
  const { otp } = req.body;
  const sessionOtp = req.session.loginOtp;

  if (!sessionOtp) {
    req.flash('error_msg', 'Login session expired. Please request a new code.');
    return res.redirect('/login');
  }

  if (Date.now() > sessionOtp.expiresAt) {
    req.flash('error_msg', 'Login code has expired. Please request a new one.');
    return res.redirect('/login');
  }

  if (otp !== sessionOtp.otp) {
    req.flash('error_msg', 'Invalid login code. Please try again.');
    return res.redirect('/login-otp');
  }

  req.flash('error_msg', 'Login functionality temporarily disabled');
  res.redirect('/login');
});

// 4) Resend login OTP
router.post('/resend-login-otp', (req, res) => {
  const sessionOtp = req.session.loginOtp;
  if (!sessionOtp) {
    req.flash('error_msg', 'Login session expired. Please start again.');
    return res.redirect('/login');
  }

  try {
    const { generateOtp, sendOtpToEmail } = require('../utils/otpService');
    const newOtp = generateOtp();
    const otpExpiresAt = Date.now() + 10 * 60 * 1000;

    req.session.loginOtp.otp = newOtp;
    req.session.loginOtp.expiresAt = otpExpiresAt;

    sendOtpToEmail(sessionOtp.email, newOtp);

    req.flash('success_msg', 'A new login code has been sent to your email.');
    res.redirect('/login-otp');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Could not resend login code. Please try again.');
    res.redirect('/login');
  }
});

// Registration page
router.get('/register', (req, res) => {
  res.render('auth/register', { 
    title: 'Register',
    user: req.user,
    path: req.path,
    messages: {
      error: req.flash('error'),
      error_msg: req.flash('error_msg'),
      success_msg: req.flash('success_msg')
    },
    formData: {},
    layout: false
  });
});

// Registration form submission with email OTP
router.post('/register', [
  check('fullName', 'Full name is required').not().isEmpty().trim().escape(),
  check('mobile', 'Mobile number is required').not().isEmpty().trim(),
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('city').optional().trim().escape(),
  check('password', 'Password is required and must be at least 6 characters').isLength({ min: 6 }).trim()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Check if this is an AJAX request
      if (req.xhr || req.headers.accept === 'application/json') {
        return res.status(400).json({
          success: false,
          message: errors.array().map(err => err.msg).join('. ')
        });
      }
      
      // Save form data to repopulate the form
      req.flash('formData', {
        fullName: req.body.fullName,
        mobile: req.body.mobile,
        email: req.body.email,
        city: req.body.city
      });
      
      // Add validation errors to flash
      req.flash('error_msg', errors.array().map(err => err.msg).join('. '));
      return res.redirect('/register');
    }
    
    const { fullName, mobile, email, city, password } = req.body;
    
    // Check if user already exists
    const { User } = require('../models');
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      if (req.xhr || req.headers.accept === 'application/json') {
        return res.status(400).json({
          success: false,
          message: 'Email is already registered'
        });
      }
      
      req.flash('formData', { fullName, mobile, email, city });
      req.flash('error_msg', 'Email is already registered');
      return res.redirect('/register');
    }
    
    // Create new user
    const newUser = await User.create({
      name: fullName.trim(),
      email,
      mobile,
      city,
      password,
      email_verified: true // Auto-verify for now since we don't have email service
    });

    // Return JSON response for AJAX requests
    if (req.xhr || req.headers.accept === 'application/json') {
      return res.json({
        success: true,
        message: 'Account created successfully'
      });
    }

    req.flash('success_msg', 'Registration successful! Please login.');
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    if (req.xhr || req.headers.accept === 'application/json') {
      return res.status(500).json({
        success: false,
        message: 'Error registering user'
      });
    }
    req.flash('error_msg', 'Error registering user');
    res.redirect('/register');
  }
});

// Email verification page
router.get('/verify-email', (req, res) => {
  res.render('auth/verify-email', {
    title: 'Verify Email',
    user: req.user,
    messages: {
      error: req.flash('error'),
      error_msg: req.flash('error_msg'),
      success_msg: req.flash('success_msg')
    }
  });
});

// Handle email OTP verification
router.post('/verify-email', async (req, res) => {
  const { otp } = req.body;

  const sessionOtp = req.session.emailOtp;
  if (!sessionOtp) {
    req.flash('error_msg', 'Verification session expired. Please register again.');
    return res.redirect('/register');
  }

  if (Date.now() > sessionOtp.expiresAt) {
    req.flash('error_msg', 'OTP has expired. Please request a new one.');
    return res.redirect('/verify-email');
  }

  if (otp !== sessionOtp.otp) {
    req.flash('error_msg', 'Invalid OTP. Please try again.');
    return res.redirect('/verify-email');
  }

  try {
    // Mark user as verified
    // await User.update(
    //   { email_verified: true },
    //   { where: { id: sessionOtp.userId } }
    // );

    delete req.session.emailOtp;

    req.flash('success_msg', 'Email verified successfully. You can now log in.');
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error verifying email. Please try again.');
    res.redirect('/verify-email');
  }
});

// Resend email OTP (during verification step)
router.post('/resend-email-otp', async (req, res) => {
  const sessionOtp = req.session.emailOtp;
  if (!sessionOtp) {
    req.flash('error_msg', 'Verification session expired. Please register again.');
    return res.redirect('/register');
  }

  try {
    const { generateOtp, sendOtpToEmail } = require('../utils/otpService');
    const newOtp = generateOtp();
    const otpExpiresAt = Date.now() + 10 * 60 * 1000;

    req.session.emailOtp.otp = newOtp;
    req.session.emailOtp.expiresAt = otpExpiresAt;

    sendOtpToEmail(sessionOtp.email, newOtp);

    req.flash('success_msg', 'A new verification code has been sent to your email.');
    res.redirect('/verify-email');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Could not resend OTP. Please try again.');
    res.redirect('/verify-email');
  }
});

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) { 
      return next(err); 
    }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/login');
  });
});

// Protected routes
router.post('/api/application/submit', requireApiLogin, async (req, res) => {
  try {
    console.log('POST /api/application/submit hit', {
      sessionUserId: req.session?.user?.id,
      userId: req.user?.id,
      bodyKeys: req.body ? Object.keys(req.body) : null,
      body: req.body
    });

    const {
      businessName,
      businessType,
      businessDescription,
      fundingAmount,
      useOfFunds,
      terms,
      declaration
    } = req.body;

    console.log('Extracted fields:', {
      businessName,
      businessType,
      businessDescription,
      fundingAmount,
      useOfFunds,
      terms,
      declaration
    });

    if (!terms || !declaration) {
      console.log('Validation failed: terms or declaration missing');
      return res.status(400).json({
        success: false,
        message: 'Please accept the Terms and Conditions and confirm the declaration before submitting.'
      });
    }

    if (!businessName || !businessDescription || !fundingAmount || !useOfFunds) {
      console.log('Validation failed: required fields missing');
      return res.status(400).json({
        success: false,
        message: 'Please complete all required fields before submitting.'
      });
    }

    console.log('Validation passed, creating application...');

    const { Application } = require('../models');

    // Check if user already has an application
    const existingApplication = await Application.findOne({ where: { user_id: req.user.id } });
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You can only submit one application per account.'
      });
    }

    const applicantType = businessType === 'existing'
      ? 'existing_business'
      : 'fresh_startup';

    console.log('Creating application with data:', {
      user_id: req.user.id,
      applicant_type: applicantType,
      business_name: String(businessName).trim(),
      description_short: String(businessDescription).trim(),
      description_long: String(useOfFunds).trim(),
      amount_requested: Number(fundingAmount),
      application_status: 'draft',
      payment_status: 'pending'
    });

    await Application.create({
      user_id: req.user.id,
      applicant_type: applicantType,
      business_name: String(businessName).trim(),
      description_short: String(businessDescription).trim(),
      description_long: String(useOfFunds).trim(),
      amount_requested: Number(fundingAmount),
      aadhar_path: 'pending-upload',
      extra_docs_paths: null,
      preferred_contact_time: null,
      annual_revenue: null,
      years_in_operation: null,
      application_status: 'draft', // Set proper status
      payment_status: 'pending'   // Set proper payment status
    });

    console.log('Application created successfully');

    return res.json({
      success: true,
      message: 'Application submitted successfully'
    });
  } catch (err) {
    console.error('Error in POST /api/application/submit:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit application. Please try again.'
    });
  }
});

router.get('/dashboard', requireLogin, async (req, res) => {
  try {
    const { User, Application } = require('../models');

    // Get user stats
    const totalApplications = await Application.count({ where: { user_id: req.user.id } });
    const approvedApplications = await Application.count({ where: { user_id: req.user.id, application_status: 'accepted' } });
    const pendingApplications = await Application.count({ 
      where: { 
        user_id: req.user.id, 
        application_status: ['pending', 'draft'] // Include both pending and draft applications
      } 
    });

    // Get recent applications
    const recentApplications = await Application.findAll({
      where: { user_id: req.user.id },
      limit: 5,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'business_name', 'amount_requested', 'application_status', 'created_at']
    });

    // Get latest application for status display
    const latestApplication = await Application.findOne({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']]
    });

    // Helper function for status badges
    const getStatusBadgeClass = function(status) {
      const statusMap = {
        'accepted': 'success',
        'rejected': 'danger',
        'pending': 'warning',
        'draft': 'secondary'
      };
      return statusMap[status] || 'secondary';
    };

    // Make function available in template
    res.locals.getStatusBadgeClass = getStatusBadgeClass;

    // Format recent applications for template
    const formattedApplications = recentApplications.map(app => ({
      id: app.id,
      businessName: app.business_name,
      amount: app.amount_requested,
      status: app.application_status,
      date: app.created_at,
      type: 'Business Funding' // Default type
    }));

    // Mock data for stats and activity (replace with real data later)
    const stats = {
      totalApplications: totalApplications || 0,
      approvedApplications: approvedApplications || 0,
      pendingApplications: pendingApplications || 0,
      totalInvested: 0 // This would need investment tracking
    };

    const recentActivity = [
      {
        icon: 'fas fa-file-alt',
        message: 'New application submitted',
        timeAgo: '2 hours ago'
      },
      {
        icon: 'fas fa-check-circle',
        message: 'Application approved',
        timeAgo: '1 day ago'
      }
    ];

    // Enhanced user object with additional properties
    const userData = {
      ...req.user.toJSON(),
      pendingApplications: pendingApplications,
      unreadNotifications: 0, // This would need notification system
      recentNotifications: [], // This would need notification system
      avatar: req.user.avatar || null
    };

    res.render('dashboard', {
      title: 'Dashboard | UdyamKings',
      user: userData,
      stats,
      recentApplications: formattedApplications,
      recentActivity,
      latestApplication,
      getStatusBadgeClass,
      messages: {
        error: req.flash('error'),
        error_msg: req.flash('error_msg'),
        success_msg: req.flash('success_msg')
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    req.flash('error_msg', 'Failed to load dashboard data');
    res.redirect('/login');
  }
});

// Admin-only: list users
router.get('/admin/users', async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      req.flash('error_msg', 'You are not authorized to view that page');
      return res.redirect('/dashboard');
    }

    // const users = await User.findAll({
    //   attributes: ['id', 'name', 'email', 'email_verified', 'mobile', 'city', 'createdAt']
    // });
    const users = []; // Empty array for testing

    res.render('admin/users', {
      title: 'Users | Admin',
      user: req.user,
      users
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading users');
    res.redirect('/dashboard');
  }
});

// Other pages
router.get('/about', (req, res) => {
  res.render('about', { 
    title: 'About Us',
    user: req.user 
  });
});

router.get('/how-it-works', (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const currentPath = req.path;
    
    const templateVars = {
      title: 'How It Works - UdyamKings',
      description: 'Learn how our funding process works for entrepreneurs',
      user: req.user || null,
      fullUrl: baseUrl,
      url: {
        pathname: currentPath
      },
      path: currentPath,
      appUrl: baseUrl,
      messages: {
        error: req.flash('error') || [],
        success: req.flash('success') || [],
        error_msg: req.flash('error_msg') || [],
        success_msg: req.flash('success_msg') || []
      }
    };
    
    console.log('Rendering how-it-works page with variables');
    res.render('index', templateVars);
  } catch (error) {
    console.error('Error in how-it-works route:', error);
    next(error); // Pass to express error handler
  }
});

router.get('/contact', (req, res) => {
  res.render('contact', { 
    title: 'Contact Us',
    user: req.user 
  });
});

router.get('/terms', (req, res) => {
  res.render('terms', { 
    title: 'Terms & Conditions',
    user: req.user 
  });
});

router.get('/profile', requireLogin, (req, res) => {
  res.render('profile', { 
    title: 'My Profile | UdyamKings',
    user: req.user,
    messages: {
      error: req.flash('error'),
      error_msg: req.flash('error_msg'),
      success_msg: req.flash('success_msg')
    }
  });
});

module.exports = router;
