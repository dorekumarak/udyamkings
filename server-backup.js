require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const helmet = require('helmet');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, 'public/uploads');
const aadharDir = path.join(__dirname, 'public/uploads/aadhar');
const docsDir = path.join(__dirname, 'public/uploads/documents');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(aadharDir)) {
    fs.mkdirSync(aadharDir, { recursive: true });
}
if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'aadhar') {
            cb(null, aadharDir);
        } else {
            cb(null, docsDir);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept images and PDFs
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only images and PDF files are allowed'));
        }
    }
});
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const xss = require('xss-clean');
const compression = require('compression');
const sequelize = require('./config/db');
const expressLayouts = require('express-ejs-layouts');
const errorHandler = require('./middleware/error');

// Import routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
console.log('Routes imported successfully');

// Passport configuration
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Initialize express
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(compression());

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Static folders
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Global variables
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Flash messages
app.use(flash());

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Simple session-based authentication
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { User } = require('./models');
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Add variables to all responses
app.use((req, res, next) => {
  res.locals.fullUrl = req.protocol + '://' + req.get('host');
  res.locals.url = { pathname: req.path };
  res.locals.path = req.path;
  res.locals.user = req.session.user || null;
  res.locals.messages = req.flash();
  next();
});

app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// ==================== ADMIN ROUTES ====================

// Admin login route
app.get('/admin/login', (req, res) => {
  console.log('ADMIN LOGIN ROUTE HIT!');
  res.render('admin-login-clean', {
    title: 'Admin Login',
    user: req.user,
    messages: {
      error: req.flash('error'),
      error_msg: req.flash('error_msg'),
      success_msg: req.flash('success_msg')
    }
  });
});

// Application submission route
app.post('/apply', upload.fields([
  { name: 'aadhar', maxCount: 1 },
  { name: 'extra_docs', maxCount: 10 }
]), async (req, res) => {
  try {
    console.log('Application submission received');
    
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please login to submit application' 
      });
    }
    
    const { 
      business_name, 
      applicant_type, 
      description_short, 
      description_long, 
      amount_requested, 
      annual_revenue, 
      years_in_operation 
    } = req.body;
    
    // Validate required fields
    if (!business_name || !amount_requested) {
      return res.status(400).json({ 
        success: false, 
        message: 'Business name and amount are required' 
      });
    }
    
    // Get file paths
    const aadharPath = req.files.aadhar ? req.files.aadhar[0].filename : null;
    const extraDocsPaths = req.files.extra_docs ? req.files.extra_docs.map(file => file.filename) : [];
    
    // Create application in database
    const { Application } = require('./models');
    const application = await Application.create({
      user_id: req.session.user.id,
      applicant_type: applicant_type || 'individual',
      business_name: business_name,
      description_short: description_short || '',
      description_long: description_long || '',
      amount_requested: parseFloat(amount_requested),
      aadhar_path: aadharPath ? 'uploads/aadhar/' + aadharPath : null,
      extra_docs_paths: extraDocsPaths.length > 0 ? extraDocsPaths.map(doc => 'uploads/documents/' + doc) : null,
      annual_revenue: parseFloat(annual_revenue) || 0,
      years_in_operation: parseInt(years_in_operation) || 0,
      payment_status: 'pending',
      application_status: 'pending',
      application_fee: 500 // Default application fee
    });
    
    console.log('Application created successfully:', application.id);
    
    res.json({ 
      success: true, 
      message: 'Application submitted successfully!',
      applicationId: application.id
    });
    
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error submitting application: ' + error.message 
    });
  }
});

// Admin login POST route
app.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', email);
  
  if (email === 'admin@udyamkings.com' && password === 'admin123') {
    req.session.user = {
      email: email,
      role: 'admin',
      name: 'Administrator'
    };
    req.flash('success_msg', 'Welcome to Admin Panel');
    return res.redirect('/admin/dashboard');
  }
  
  req.flash('error', 'Invalid admin credentials');
  res.redirect('/admin/login');
});

// Admin dashboard route
app.get('/admin/dashboard', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error_msg', 'You are not authorized to view that page');
    return res.redirect('/admin/login');
  }
  
  console.log('Admin dashboard accessed by:', req.session.user.email);
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Admin Dashboard</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 40px; 
                background-color: #f8f9fa;
            }
            .header { 
                background: #0A2463; 
                color: white; 
                padding: 20px; 
                border-radius: 8px; 
                margin-bottom: 20px;
            }
            .nav-link {
                display: inline-block;
                background: #28a745;
                color: white;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 4px;
                margin: 10px 10px 10px 0;
                transition: background-color 0.3s;
            }
            .nav-link:hover {
                background: #218838;
            }
            .home-link {
                background: #007bff;
            }
            .home-link:hover {
                background: #0056b3;
            }
            .logout-link {
                background: #dc3545;
            }
            .logout-link:hover {
                background: #c82333;
            }
            .card {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                margin-bottom: 20px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Admin Dashboard</h1>
            <p>Welcome, ${req.session.user.name}!</p>
        </div>
        
        <div class="card">
            <a href="/" class="nav-link home-link">🏠 Go to Home Page</a>
            <a href="/admin/reports" class="nav-link">📊 Generate Reports</a>
            <a href="/admin/users" class="nav-link">👥 Manage Users</a>
            <a href="/admin/applications" class="nav-link">📋 View Applications</a>
            <a href="/admin/logout" class="nav-link logout-link">🚪 Logout</a>
        </div>
        
        <div class="card">
            <h2>Quick Access</h2>
            <p><strong>Main Website:</strong> <a href="/">http://localhost:${process.env.PORT || 3002}</a></p>
            <p><strong>Admin Portal:</strong> <a href="/admin/login">Admin Login</a></p>
        </div>
    </body>
    </html>
  `);
});

              function viewReport(type) {
                  alert('This is the live Application Summary Report showing real-time data from the database.');
              }
          </script>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Error generating report:', error);
    req.flash('error_msg', 'Error generating report: ' + error.message);
    res.redirect('/admin/dashboard');
  }
});

// Admin users route - REAL User Data
app.get('/admin/users', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error_msg', 'You are not authorized to view that page');
    return res.redirect('/admin/login');
  }
  
  try {
    console.log('Admin users accessed by:', req.session.user.email);
    
    // Fetch real users from database
    const { User } = require('./models');
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'mobile', 'city', 'role', 'email_verified', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    
    // Calculate statistics
    const totalUsers = users.length;
    const verifiedUsers = users.filter(user => user.email_verified).length;
    const adminUsers = users.filter(user => user.role === 'admin').length;
    const regularUsers = users.filter(user => user.role === 'user').length;
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Manage Users - Admin Dashboard</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 40px; background-color: #f8f9fa; }
              .header { background: #0A2463; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
              .btn { display: inline-block; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 5px; cursor: pointer; border: none; }
              .btn-primary { background: #007bff; color: white; }
              .btn-danger { background: #dc3545; color: white; }
              .btn-success { background: #28a745; color: white; }
              .btn-warning { background: #ffc107; color: #212529; }
              .stats-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                  gap: 15px;
                  margin-bottom: 20px;
              }
              .stat-card {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 20px;
                  border-radius: 8px;
                  text-align: center;
              }
              .stat-number {
                  font-size: 2rem;
                  font-weight: bold;
                  margin-bottom: 5px;
              }
              .stat-label {
                  font-size: 0.9rem;
                  opacity: 0.9;
              }
              .table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 20px;
              }
              .table th, .table td {
                  padding: 12px;
                  text-align: left;
                  border-bottom: 1px solid #dee2e6;
              }
              .table th {
                  background-color: #f8f9fa;
                  font-weight: bold;
              }
              .table tr:hover {
                  background-color: #f8f9fa;
              }
              .status-badge {
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  font-weight: bold;
              }
              .status-verified { background: #d4edda; color: #155724; }
              .status-unverified { background: #f8d7da; color: #721c24; }
              .role-admin { background: #cce5ff; color: #004085; }
              .role-user { background: #e2e3e5; color: #383d41; }
              .text-center { text-align: center; }
              .section-title {
                  font-size: 1.2rem;
                  font-weight: bold;
                  margin-bottom: 15px;
                  color: #0A2463;
              }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>Manage Users</h1>
              <p>Welcome, ${req.session.user.name}! Real-time user data as of ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="card">
              <a href="/" class="btn btn-primary">🏠 Go to Home Page</a>
              <a href="/admin/dashboard" class="btn btn-primary" style="background: #6c757d;">🔙 Back to Dashboard</a>
              <button class="btn btn-success" onclick="window.print()">🖨️ Print Users</button>
              <button class="btn btn-warning" onclick="exportUsers()">📊 Export Users</button>
              <a href="/admin/logout" class="btn btn-danger">🚪 Logout</a>
          </div>
          
          <div class="stats-grid">
              <div class="stat-card">
                  <div class="stat-number">${totalUsers}</div>
                  <div class="stat-label">Total Users</div>
              </div>
              <div class="stat-card">
                  <div class="stat-number">${verifiedUsers}</div>
                  <div class="stat-label">Verified Users</div>
              </div>
              <div class="stat-card">
                  <div class="stat-number">${adminUsers}</div>
                  <div class="stat-label">Admin Users</div>
              </div>
              <div class="stat-card">
                  <div class="stat-number">${regularUsers}</div>
                  <div class="stat-label">Regular Users</div>
              </div>
          </div>
          
          <div class="card">
              <div class="section-title">All Users (${totalUsers} total)</div>
              <table class="table">
                  <thead>
                      <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Mobile</th>
                          <th>City</th>
                          <th>Role</th>
                          <th>Verified</th>
                          <th>Joined Date</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${users.map(user => `
                          <tr>
                              <td>#${user.id}</td>
                              <td>${user.name}</td>
                              <td>${user.email}</td>
                              <td>${user.mobile || 'N/A'}</td>
                              <td>${user.city || 'N/A'}</td>
                              <td><span class="status-badge ${user.role === 'admin' ? 'role-admin' : 'role-user'}">${user.role}</span></td>
                              <td><span class="status-badge ${user.email_verified ? 'status-verified' : 'status-unverified'}">${user.email_verified ? 'Verified' : 'Not Verified'}</span></td>
                              <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                          </tr>
                      `).join('')}
                  </tbody>
              </table>
          </div>
          
          <script>
              function exportUsers() {
                  alert('User export functionality would be implemented here. This would generate a downloadable Excel file with all user data.');
              }
          </script>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Error loading users:', error);
    req.flash('error_msg', 'Error loading users: ' + error.message);
    res.redirect('/admin/dashboard');
  }
});

// Admin applications route - REAL Application Data
app.get('/admin/applications', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error_msg', 'You are not authorized to view that page');
    return res.redirect('/admin/login');
  }
  
  try {
    console.log('Admin applications accessed by:', req.session.user.email);
    
    // Fetch real applications from database
    const { Application, User } = require('./models');
    const applications = await Application.findAll({
      include: [{ 
        model: User, 
        as: 'user', 
        attributes: ['name', 'email', 'mobile'] 
      }],
      order: [['created_at', 'DESC']]
    });
    
    // Calculate statistics
    const totalApplications = applications.length;
    const pendingApplications = applications.filter(app => app.application_status === 'pending').length;
    const underReviewApplications = applications.filter(app => app.application_status === 'under_review').length;
    const acceptedApplications = applications.filter(app => app.application_status === 'accepted').length;
    const rejectedApplications = applications.filter(app => app.application_status === 'rejected').length;
    
    const totalAmountRequested = applications.reduce((sum, app) => sum + parseFloat(app.amount_requested || 0), 0);
    const paidApplications = applications.filter(app => app.payment_status === 'paid').length;
    const totalFeesCollected = applications
      .filter(app => app.payment_status === 'paid')
      .reduce((sum, app) => sum + parseFloat(app.application_fee || 0), 0);
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>View Applications - Admin Dashboard</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 40px; background-color: #f8f9fa; }
              .header { background: #0A2463; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
              .btn { display: inline-block; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 5px; cursor: pointer; border: none; }
              .btn-primary { background: #007bff; color: white; }
              .btn-danger { background: #dc3545; color: white; }
              .btn-success { background: #28a745; color: white; }
              .btn-warning { background: #ffc107; color: #212529; }
              .stats-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                  gap: 15px;
                  margin-bottom: 20px;
              }
              .stat-card {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 20px;
                  border-radius: 8px;
                  text-align: center;
              }
              .stat-number {
                  font-size: 2rem;
                  font-weight: bold;
                  margin-bottom: 5px;
              }
              .stat-label {
                  font-size: 0.9rem;
                  opacity: 0.9;
              }
              .table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 20px;
              }
              .table th, .table td {
                  padding: 12px;
                  text-align: left;
                  border-bottom: 1px solid #dee2e6;
              }
              .table th {
                  background-color: #f8f9fa;
                  font-weight: bold;
              }
              .table tr:hover {
                  background-color: #f8f9fa;
              }
              .status-badge {
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  font-weight: bold;
              }
              .status-pending { background: #fff3cd; color: #856404; }
              .status-under_review { background: #cce5ff; color: #004085; }
              .status-accepted { background: #d4edda; color: #155724; }
              .status-rejected { background: #f8d7da; color: #721c24; }
              .payment-paid { background: #d4edda; color: #155724; }
              .payment-pending { background: #fff3cd; color: #856404; }
              .payment-failed { background: #f8d7da; color: #721c24; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .section-title {
                  font-size: 1.2rem;
                  font-weight: bold;
                  margin-bottom: 15px;
                  color: #0A2463;
              }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>View Applications</h1>
              <p>Welcome, ${req.session.user.name}! Real-time application data as of ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="card">
              <a href="/" class="btn btn-primary">🏠 Go to Home Page</a>
              <a href="/admin/dashboard" class="btn btn-primary" style="background: #6c757d;">🔙 Back to Dashboard</a>
              <button class="btn btn-success" onclick="window.print()">🖨️ Print Applications</button>
              <button class="btn btn-warning" onclick="exportApplications()">📊 Export Applications</button>
              <a href="/admin/logout" class="btn btn-danger">🚪 Logout</a>
          </div>
          
          <div class="stats-grid">
              <div class="stat-card">
                  <div class="stat-number">${totalApplications}</div>
                  <div class="stat-label">Total Applications</div>
              </div>
              <div class="stat-card">
                  <div class="stat-number">₹${totalAmountRequested.toLocaleString('en-IN')}</div>
                  <div class="stat-label">Total Amount Requested</div>
              </div>
              <div class="stat-card">
                  <div class="stat-number">${paidApplications}</div>
                  <div class="stat-label">Paid Applications</div>
              </div>
              <div class="stat-card">
                  <div class="stat-number">₹${totalFeesCollected.toLocaleString('en-IN')}</div>
                  <div class="stat-label">Fees Collected</div>
              </div>
          </div>
          
          <div class="card">
              <div class="section-title">Application Status Breakdown</div>
              <table class="table">
                  <thead>
                      <tr>
                          <th>Status</th>
                          <th>Count</th>
                          <th>Percentage</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr>
                          <td><span class="status-badge status-pending">Pending</span></td>
                          <td>${pendingApplications}</td>
                          <td>${totalApplications > 0 ? ((pendingApplications / totalApplications) * 100).toFixed(1) : 0}%</td>
                      </tr>
                      <tr>
                          <td><span class="status-badge status-under_review">Under Review</span></td>
                          <td>${underReviewApplications}</td>
                          <td>${totalApplications > 0 ? ((underReviewApplications / totalApplications) * 100).toFixed(1) : 0}%</td>
                      </tr>
                      <tr>
                          <td><span class="status-badge status-accepted">Accepted</span></td>
                          <td>${acceptedApplications}</td>
                          <td>${totalApplications > 0 ? ((acceptedApplications / totalApplications) * 100).toFixed(1) : 0}%</td>
                      </tr>
                      <tr>
                          <td><span class="status-badge status-rejected">Rejected</span></td>
                          <td>${rejectedApplications}</td>
                          <td>${totalApplications > 0 ? ((rejectedApplications / totalApplications) * 100).toFixed(1) : 0}%</td>
                      </tr>
                  </tbody>
          <div class="card">
              <div class="section-title">All Applications (${totalApplications} total)</div>
              <table class="table">
                  <thead>
                      <tr>
                          <th>ID</th>
                          <th>Business Name</th>
                          <th>Applicant</th>
                          <th>Email</th>
                          <th>Mobile</th>
                          <th>Amount</th>
                          <th>Application Status</th>
                          <th>View Details</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${applications.map(app => `
                          <tr>
                              <td>#${app.id}</td>
                              <td>${app.business_name}</td>
                              <td>${app.user ? app.user.name : 'N/A'}</td>
                              <td>${app.user ? app.user.email : 'N/A'}</td>
                              <td>${app.user ? app.user.mobile || 'N/A' : 'N/A'}</td>
                              <td class="text-right">₹${parseFloat(app.amount_requested || 0).toLocaleString('en-IN')}</td>
                              <td><span class="status-badge status-${app.application_status}">${app.application_status.replace('_', ' ')}</span></td>
                              <td>
                                  <button class="btn btn-info" onclick="viewApplicationDetails(${app.id})" style="padding: 5px 10px; font-size: 12px;">📂 Open</button>
                              </td>
                          </tr>
                      `).join('')}
                  </tbody>
              </table>
          </div>
          
          <!-- Modal for Application Details -->
          <div id="applicationModal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5);">
              <div style="background-color: white; margin: 50px auto; padding: 20px; width: 90%; max-width: 800px; max-height: 80vh; overflow-y: auto; border-radius: 8px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                      <h2 id="modalTitle">Application Details</h2>
                      <button onclick="closeModal()" style="background: #dc3545; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;">✖ Close</button>
                  </div>
                  <div id="modalContent">
                      <!-- Content will be loaded here -->
                  </div>
              </div>
          </div>
          
          <script>
              function acceptApplication(appId) {
                  if (confirm('Are you sure you want to accept this application?')) {
                      fetch('/admin/applications/' + appId + '/accept', {
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json'
                          }
                      })
                      .then(function(response) {
                          return response.json();
                      })
                      .then(function(data) {
                          if (data.success) {
                              alert('Application accepted successfully!');
                              location.reload();
                          } else {
                              alert('Error: ' + data.message);
                          }
                      })
                      .catch(function(error) {
                          console.error('Error:', error);
                          alert('Error accepting application');
                      });
                  }
              }
              
              function rejectApplication(appId) {
                  var reason = prompt('Please enter reason for rejection:');
                  if (reason) {
                      fetch('/admin/applications/' + appId + '/reject', {
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ reason: reason })
                      })
                      .then(function(response) {
                          return response.json();
                      })
                      .then(function(data) {
                          if (data.success) {
                              alert('Application rejected successfully!');
                              location.reload();
                          } else {
                              alert('Error: ' + data.message);
                          }
                      })
                      .catch(function(error) {
                          console.error('Error:', error);
                          alert('Error rejecting application');
                      });
                  }
              }
              
              function exportApplications() {
                  // Show export options
                  var exportType = confirm('Choose export format:\nOK = Excel Export\nCancel = PDF Export');
                  
                  if (exportType) {
                      // Excel Export
                      window.location.href = '/admin/applications/export/excel';
                  } else {
                      // PDF Export
                      window.location.href = '/admin/applications/export/pdf';
                  }
              }
              
              function viewApplicationDetails(appId) {
                  console.log('Open button clicked for application:', appId);
                  fetch('/admin/applications/' + appId + '/details')
                      .then(function(response) {
                          console.log('Response status:', response.status);
                          return response.json();
                      })
                      .then(function(data) {
                          console.log('Response data:', data);
                          if (data.success) {
                              displayApplicationDetails(data.application);
                          } else {
                              alert('Error: ' + data.message);
                          }
                      })
                      .catch(function(error) {
                          console.error('Error:', error);
                          alert('Error loading application details');
                      });
              }
              
              function displayApplicationDetails(app) {
                  console.log('Displaying application details:', app);
                  var modal = document.getElementById('applicationModal');
                  var modalTitle = document.getElementById('modalTitle');
                  var modalContent = document.getElementById('modalContent');
                  
                  console.log('Modal element:', modal);
                  console.log('Modal title element:', modalTitle);
                  console.log('Modal content element:', modalContent);
                  
                  modalTitle.textContent = 'Application #' + app.id + ' - ' + app.business_name;
                  
                  var content = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">';
                  content += '<div><h3 style="color: #0A2463; margin-bottom: 15px;">👤 Applicant Information</h3>';
                  content += '<table style="width: 100%; border-collapse: collapse;">';
                  content += '<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Name:</td><td style="padding: 8px; border: 1px solid #ddd;">' + (app.user ? app.user.name : 'N/A') + '</td></tr>';
                  content += '<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email:</td><td style="padding: 8px; border: 1px solid #ddd;">' + (app.user ? app.user.email : 'N/A') + '</td></tr>';
                  content += '<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Mobile:</td><td style="padding: 8px; border: 1px solid #ddd;">' + (app.user ? app.user.mobile || 'N/A' : 'N/A') + '</td></tr>';
                  content += '<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Applicant Type:</td><td style="padding: 8px; border: 1px solid #ddd;">' + (app.applicant_type || 'N/A') + '</td></tr>';
                  content += '</table></div>';
                  
                  content += '<div><h3 style="color: #0A2463; margin-bottom: 15px;">📊 Application Details</h3>';
                  content += '<table style="width: 100%; border-collapse: collapse;">';
                  content += '<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Business Name:</td><td style="padding: 8px; border: 1px solid #ddd;">' + app.business_name + '</td></tr>';
                  content += '<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Amount Requested:</td><td style="padding: 8px; border: 1px solid #ddd;">₹' + parseFloat(app.amount_requested || 0).toLocaleString('en-IN') + '</td></tr>';
                  content += '<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Application Status:</td><td style="padding: 8px; border: 1px solid #ddd;"><span class="status-badge status-' + app.application_status + '">' + app.application_status.replace('_', ' ') + '</span></td></tr>';
                  content += '<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Payment Status:</td><td style="padding: 8px; border: 1px solid #ddd;"><span class="status-badge payment-' + app.payment_status + '">' + app.payment_status + '</span></td></tr>';
                  content += '<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Applied Date:</td><td style="padding: 8px; border: 1px solid #ddd;">' + new Date(app.created_at).toLocaleDateString() + '</td></tr>';
                  content += '</table></div></div>';
                  
                  content += '<div style="margin-top: 20px;"><h3 style="color: #0A2463; margin-bottom: 15px;">📝 Business Description</h3>';
                  content += '<div style="padding: 15px; background-color: #f8f9fa; border-radius: 5px; border: 1px solid #ddd;">';
                  content += '<p><strong>Short Description:</strong></p><p>' + (app.description_short || 'N/A') + '</p>';
                  content += '<p><strong>Long Description:</strong></p><p>' + (app.description_long || 'N/A') + '</p>';
                  content += '</div></div>';
                  
                  content += '<div style="margin-top: 20px;"><h3 style="color: #0A2463; margin-bottom: 15px;">💰 Financial Information</h3>';
                  content += '<table style="width: 100%; border-collapse: collapse;">';
                  content += '<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Annual Revenue:</td><td style="padding: 8px; border: 1px solid #ddd;">₹' + parseFloat(app.annual_revenue || 0).toLocaleString('en-IN') + '</td></tr>';
                  content += '<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Years in Operation:</td><td style="padding: 8px; border: 1px solid #ddd;">' + (app.years_in_operation || 'N/A') + '</td></tr>';
                  content += '<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Application Fee:</td><td style="padding: 8px; border: 1px solid #ddd;">₹' + parseFloat(app.application_fee || 0).toLocaleString('en-IN') + '</td></tr>';
                  content += '</table></div>';
                  
                  content += '<div style="margin-top: 20px;"><h3 style="color: #0A2463; margin-bottom: 15px;">📄 Documents</h3>';
                  content += '<div style="padding: 15px; background-color: #f8f9fa; border-radius: 5px; border: 1px solid #ddd;">';
                  content += '<p><strong>Aadhar Document:</strong> ';
                  content += '<a href="/admin/applications/' + app.id + '/document/aadhar" target="_blank" style="margin-left: 10px; padding: 5px 10px; background: #007bff; color: white; text-decoration: none; border-radius: 3px;">📄 View Aadhar</a>';
                  content += '</p>';
                  
                  if (app.extra_docs_paths && app.extra_docs_paths.length > 0) {
                      content += '<p><strong>Additional Documents:</strong></p>';
                      app.extra_docs_paths.forEach(function(doc, index) {
                          content += '<a href="/admin/applications/' + app.id + '/document/extra/' + index + '" target="_blank" style="margin-right: 10px; padding: 5px 10px; background: #17a2b8; color: white; text-decoration: none; border-radius: 3px;">📋 Document ' + (index + 1) + '</a>';
                      });
                  } else {
                      content += '<p>No additional documents uploaded</p>';
                  }
                  content += '</div></div>';
                  
                  if (app.admin_notes) {
                      content += '<div style="margin-top: 20px;"><h3 style="color: #0A2463; margin-bottom: 15px;">📋 Admin Notes</h3>';
                      content += '<div style="padding: 15px; background-color: #fff3cd; border-radius: 5px; border: 1px solid #ddd;">';
                      content += '<p>' + app.admin_notes + '</p>';
                      content += '</div></div>';
                  }
                  
                  content += '<div style="margin-top: 20px; text-align: center;">';
                  if (app.application_status === 'pending' || app.application_status === 'under_review') {
                      content += '<button onclick="acceptApplication(' + app.id + '); closeModal();" style="margin-right: 10px; padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">✅ Accept Application</button>';
                      content += '<button onclick="rejectApplication(' + app.id + '); closeModal();" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">❌ Reject Application</button>';
                  }
                  content += '</div>';
                  
                  modalContent.innerHTML = content;
                  console.log('Modal content set, showing modal...');
                  modal.style.display = 'block';
                  console.log('Modal should now be visible');
              }
              
              function closeModal() {
                  document.getElementById('applicationModal').style.display = 'none';
              }
          </script>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Error loading applications:', error);
    req.flash('error_msg', 'Error loading applications: ' + error.message);
    res.redirect('/admin/dashboard');
  }
});

// Admin accept application route
app.post('/admin/applications/:id/accept', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }
  
  try {
    const { Application } = require('./models');
    const applicationId = req.params.id;
    
    const application = await Application.findByPk(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    await application.update({
      application_status: 'accepted',
      admin_notes: 'Application accepted by admin'
    });
    
    console.log('Application ' + applicationId + ' accepted by admin ' + req.session.user.email);
    res.json({ success: true, message: 'Application accepted successfully' });
    
  } catch (error) {
    console.error('Error accepting application:', error);
    res.status(500).json({ success: false, message: 'Error accepting application' });
  }
});

// Admin reject application route
app.post('/admin/applications/:id/reject', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }
  
  try {
    const { Application } = require('./models');
    const applicationId = req.params.id;
    const { reason } = req.body;
    
    const application = await Application.findByPk(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    await application.update({
      application_status: 'rejected',
      admin_notes: reason || 'Application rejected by admin'
    });
    
    console.log('Application ' + applicationId + ' rejected by admin ' + req.session.user.email + ' - Reason: ' + reason);
    res.json({ success: true, message: 'Application rejected successfully' });
    
  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({ success: false, message: 'Error rejecting application' });
  }
});

// Admin download document route
app.get('/admin/applications/:id/document/:type/:index?', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send('Unauthorized');
  }
  
  try {
    const { Application } = require('./models');
    const applicationId = req.params.id;
    const documentType = req.params.type;
    const docIndex = req.params.index;
    
    const application = await Application.findByPk(applicationId);
    if (!application) {
      return res.status(404).send('Application not found');
    }
    
    let filePath;
    let fileName;
    
    if (documentType === 'aadhar') {
      filePath = path.join(__dirname, 'public', application.aadhar_path);
      fileName = 'application_' + applicationId + '_aadhar' + path.extname(application.aadhar_path);
    } else if (documentType === 'extra') {
      if (!application.extra_docs_paths || !application.extra_docs_paths[docIndex]) {
        return res.status(404).send('Document not found');
      }
      filePath = path.join(__dirname, 'public', application.extra_docs_paths[docIndex]);
      fileName = 'application_' + applicationId + '_doc_' + (parseInt(docIndex) + 1) + path.extname(application.extra_docs_paths[docIndex]);
    } else {
      return res.status(400).send('Invalid document type');
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }
    
    // Set headers for download
    res.setHeader('Content-Disposition', 'attachment; filename="' + fileName + '"');
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Send file
    res.sendFile(filePath);
    
    console.log('Document downloaded: Application ' + applicationId + ', Type: ' + documentType + ', Admin: ' + req.session.user.email);
    
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).send('Error downloading document');
  }
});

// Admin export applications to Excel
app.get('/admin/applications/export/excel', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send('Unauthorized');
  }
  
  try {
    const { Application, User } = require('./models');
    const applications = await Application.findAll({
      include: [{ 
        model: User, 
        as: 'user', 
        attributes: ['name', 'email', 'mobile'] 
      }],
      order: [['created_at', 'DESC']]
    });
    
    // Create CSV content
    let csvContent = 'Application ID,Business Name,Applicant Name,Email,Mobile,Amount Requested,Application Status,Payment Status,Applied Date\n';
    
    applications.forEach(app => {
      csvContent += app.id + ',"' + app.business_name + '","' + (app.user ? app.user.name : 'N/A') + '","' + (app.user ? app.user.email : 'N/A') + '","' + (app.user ? app.user.mobile || 'N/A' : 'N/A') + '",' + (app.amount_requested || 0) + ',' + app.application_status + ',' + app.payment_status + ',' + new Date(app.created_at).toLocaleDateString() + '\n';
    });
    
    // Set headers for download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="applications_export_' + new Date().toISOString().split('T')[0] + '.csv"');
    
    console.log('Excel export downloaded by admin ' + req.session.user.email);
    res.send(csvContent);
    
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    res.status(500).send('Error exporting to Excel');
  }
});

// Admin export applications to PDF
app.get('/admin/applications/export/pdf', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send('Unauthorized');
  }
  
  try {
    const { Application, User } = require('./models');
    const applications = await Application.findAll({
      include: [{ 
        model: User, 
        as: 'user', 
        attributes: ['name', 'email', 'mobile'] 
      }],
      order: [['created_at', 'DESC']]
    });
    
    // Calculate statistics
    const totalApplications = applications.length;
    const totalAmountRequested = applications.reduce((sum, app) => sum + parseFloat(app.amount_requested || 0), 0);
    const pendingApplications = applications.filter(app => app.application_status === 'pending').length;
    const acceptedApplications = applications.filter(app => app.application_status === 'accepted').length;
    const rejectedApplications = applications.filter(app => app.application_status === 'rejected').length;
    
    // Generate HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Applications Report</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .stats { margin-bottom: 30px; }
              .stats table { width: 100%; border-collapse: collapse; }
              .stats th, .stats td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .applications-table { width: 100%; border-collapse: collapse; }
              .applications-table th, .applications-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .applications-table th { background-color: #f2f2f2; }
              .text-right { text-align: right; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>Loan Applications Report</h1>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
              <p>Generated by: ${req.session.user.name}</p>
          </div>
          
          <div class="stats">
              <h2>Summary Statistics</h2>
              <table>
                  <tr><th>Total Applications</th><td>${totalApplications}</td></tr>
                  <tr><th>Total Amount Requested</th><td class="text-right">₹${totalAmountRequested.toLocaleString('en-IN')}</td></tr>
                  <tr><th>Pending Applications</th><td>${pendingApplications}</td></tr>
                  <tr><th>Accepted Applications</th><td>${acceptedApplications}</td></tr>
                  <tr><th>Rejected Applications</th><td>${rejectedApplications}</td></tr>
              </table>
          </div>
          
          <div class="applications">
              <h2>Application Details</h2>
              <table class="applications-table">
                  <thead>
                      <tr>
                          <th>ID</th>
                          <th>Business Name</th>
                          <th>Applicant</th>
                          <th>Email</th>
                          <th>Mobile</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Payment</th>
                          <th>Date</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${applications.map(app => `
                          <tr>
                              <td>${app.id}</td>
                              <td>${app.business_name}</td>
                              <td>${app.user ? app.user.name : 'N/A'}</td>
                              <td>${app.user ? app.user.email : 'N/A'}</td>
                              <td>${app.user ? app.user.mobile || 'N/A' : 'N/A'}</td>
                              <td class="text-right">₹${parseFloat(app.amount_requested || 0).toLocaleString('en-IN')}</td>
                              <td>${app.application_status}</td>
                              <td>${app.payment_status}</td>
                              <td>${new Date(app.created_at).toLocaleDateString()}</td>
                          </tr>
                      `).join('')}
                  </tbody>
              </table>
          </div>
      </body>
      </html>
    `;
    
    // Set headers for PDF download (HTML format that can be saved as PDF)
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="applications_report_${new Date().toISOString().split('T')[0]}.html"`);
    
    console.log(`PDF export downloaded by admin ${req.session.user.email}`);
    res.send(htmlContent);
    
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    res.status(500).send('Error exporting to PDF');
  }
});

// Admin get application details route
app.get('/admin/applications/:id/details', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }
  
  try {
    const { Application, User } = require('./models');
    const applicationId = req.params.id;
    
    const application = await Application.findByPk(applicationId, {
      include: [{ 
        model: User, 
        as: 'user', 
        attributes: ['name', 'email', 'mobile'] 
      }]
    });
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    console.log(`Application details viewed: Application ${applicationId}, Admin: ${req.session.user.email}`);
    res.json({ success: true, application: application });
    
  } catch (error) {
    console.error('Error fetching application details:', error);
    res.status(500).json({ success: false, message: 'Error fetching application details' });
  }
});

// Admin logout route
app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// ==================== END ADMIN ROUTES ====================

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/', indexRoutes);
console.log('Routes mounted successfully');

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.'
  });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3002;
const startServer = async () => {
  try {
    // Sync database
    await sequelize.sync({ force: false });
    console.log('✅ Database synced successfully');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(60));
      console.log(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`🌐 Access the site at: http://localhost:${PORT}`);
      console.log(`👑 Admin portal: http://localhost:${PORT}/admin/login`);
      console.log('='.repeat(60) + '\n');
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      console.log(`\n📡 ${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
