require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const helmet = require('helmet');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
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

app.use(cookieParser());
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
  res.locals.fullUrl = `${req.protocol}://${req.get('host')}`;
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

// Admin reports route - REAL Application Summary Report
app.get('/admin/reports', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error_msg', 'You are not authorized to view that page');
    return res.redirect('/admin/login');
  }
  
  try {
    console.log('Admin reports accessed by:', req.session.user.email);
    
    // Fetch real data from database
    const { Application, User } = require('./models');
    
    // Get all applications with user data
    const applications = await Application.findAll({
      include: [{ 
        model: User, 
        as: 'user', 
        attributes: ['name', 'email', 'phone', 'address'] 
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
    const averageAmountRequested = totalApplications > 0 ? totalAmountRequested / totalApplications : 0;
    
    const paidApplications = applications.filter(app => app.payment_status === 'paid').length;
    const totalFeesCollected = applications
      .filter(app => app.payment_status === 'paid')
      .reduce((sum, app) => sum + parseFloat(app.application_fee || 0), 0);
    
    // Get monthly statistics
    const monthlyStats = {};
    applications.forEach(app => {
      const month = new Date(app.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!monthlyStats[month]) {
        monthlyStats[month] = { count: 0, amount: 0 };
      }
      monthlyStats[month].count++;
      monthlyStats[month].amount += parseFloat(app.amount_requested || 0);
    });
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Application Summary Report - Admin Dashboard</title>
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
              .card {
                  background: white;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  margin-bottom: 20px;
              }
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
              .btn {
                  display: inline-block;
                  padding: 10px 20px;
                  text-decoration: none;
                  border-radius: 4px;
                  margin: 5px;
                  cursor: pointer;
                  border: none;
              }
              .btn-primary { background: #007bff; color: white; }
              .btn-success { background: #28a745; color: white; }
              .btn-info { background: #17a2b8; color: white; }
              .btn:hover { opacity: 0.8; }
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
              <h1>Application Summary Report</h1>
              <p>Welcome, ${req.session.user.name}! Real-time application data as of ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="card">
              <a href="/" class="btn btn-primary">🏠 Go to Home Page</a>
              <a href="/admin/dashboard" class="btn btn-primary" style="background: #6c757d;">📊 Admin Dashboard</a>
              <button class="btn btn-success" onclick="window.print()">🖨️ Print Report</button>
              <button class="btn btn-info" onclick="exportToExcel()">📊 Export Excel</button>
              <a href="/admin/logout" class="btn btn-primary" style="background: #dc3545;">🚪 Logout</a>
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
                  <div class="stat-number">₹${averageAmountRequested.toLocaleString('en-IN', {maximumFractionDigits: 0})}</div>
                  <div class="stat-label">Average Amount</div>
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
              </table>
          </div>
          
          ${Object.keys(monthlyStats).length > 0 ? `
          <div class="card">
              <div class="section-title">Monthly Application Trends</div>
              <table class="table">
                  <thead>
                      <tr>
                          <th>Month</th>
                          <th>Applications</th>
                          <th>Amount Requested</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${Object.entries(monthlyStats).map(([month, stats]) => `
                          <tr>
                              <td>${month}</td>
                              <td>${stats.count}</td>
                              <td class="text-right">₹${stats.amount.toLocaleString('en-IN')}</td>
                          </tr>
                      `).join('')}
                  </tbody>
              </table>
          </div>
          ` : ''}
          
          <div class="card">
              <div class="section-title">Recent Applications (${applications.length} total)</div>
              <table class="table">
                  <thead>
                      <tr>
                          <th>ID</th>
                          <th>Business Name</th>
                          <th>Applicant</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Payment</th>
                          <th>Date</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${applications.slice(0, 10).map(app => `
                          <tr>
                              <td>#${app.id}</td>
                              <td>${app.business_name}</td>
                              <td>${app.user ? app.user.name : 'N/A'}</td>
                              <td class="text-right">₹${parseFloat(app.amount_requested || 0).toLocaleString('en-IN')}</td>
                              <td><span class="status-badge status-${app.application_status}">${app.application_status.replace('_', ' ')}</span></td>
                              <td><span class="status-badge ${app.payment_status === 'paid' ? 'status-accepted' : 'status-pending'}">${app.payment_status}</span></td>
                              <td>${new Date(app.created_at).toLocaleDateString()}</td>
                          </tr>
                      `).join('')}
                      ${applications.length > 10 ? `
                          <tr>
                              <td colspan="7" class="text-center">
                                  <em>... and ${applications.length - 10} more applications</em>
                              </td>
                          </tr>
                      ` : ''}
                  </tbody>
              </table>
          </div>
          
          <script>
              function exportToExcel() {
                  alert('Excel export functionality would be implemented here. This would generate a downloadable Excel file with all application data.');
              }
              
              function generateReport(type, format) {
                  if (format === 'pdf') {
                      window.print();
                  } else {
                      exportToExcel();
                  }
              }
              
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

// Admin users route
app.get('/admin/users', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error_msg', 'You are not authorized to view that page');
    return res.redirect('/admin/login');
  }
  
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
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Manage Users</h1>
            <p>Welcome, ${req.session.user.name}!</p>
        </div>
        <div class="card">
            <a href="/" class="btn btn-primary">🏠 Go to Home Page</a>
            <a href="/admin/dashboard" class="btn btn-primary">📊 Admin Dashboard</a>
            <a href="/admin/logout" class="btn btn-danger">🚪 Logout</a>
        </div>
        <div class="card">
            <h2>User Management</h2>
            <p>User management functionality will be implemented here.</p>
        </div>
    </body>
    </html>
  `);
});

// Admin applications route
app.get('/admin/applications', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error_msg', 'You are not authorized to view that page');
    return res.redirect('/admin/login');
  }
  
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
        </style>
    </head>
    <body>
        <div class="header">
            <h1>View Applications</h1>
            <p>Welcome, ${req.session.user.name}!</p>
        </div>
        <div class="card">
            <a href="/" class="btn btn-primary">🏠 Go to Home Page</a>
            <a href="/admin/dashboard" class="btn btn-primary">📊 Admin Dashboard</a>
            <a href="/admin/logout" class="btn btn-danger">🚪 Logout</a>
        </div>
        <div class="card">
            <h2>Loan Applications</h2>
            <p>Application management functionality will be implemented here.</p>
        </div>
    </body>
    </html>
  `);
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
