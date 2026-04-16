const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');

const app = express();
const PORT = 3003;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(flash());

// Session configuration
app.use(session({
  secret: 'admin-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Global variables for flash messages
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Admin login route
app.get('/admin/login', (req, res) => {
  console.log('ADMIN LOGIN ROUTE HIT!');
  res.render('admin-login-clean', {
    title: 'Admin Login',
    user: req.user,
    formData: {}
  });
});

// Admin login POST route
app.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', email);
  
  // Check admin credentials
  if (email === 'admin@udyamkings.com' && password === 'admin123') {
    req.session.user = {
      email: email,
      role: 'admin',
      name: 'Administrator'
    };
    req.flash('success_msg', 'Welcome to Admin Panel');
    console.log('Login successful, redirecting to dashboard');
    return res.redirect('/admin/dashboard');
  }
  
  req.flash('error_msg', 'Invalid admin credentials');
  console.log('Login failed');
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
            .success { 
                background: #d4edda; 
                color: #155724; 
                padding: 10px; 
                border-radius: 4px; 
                margin: 20px 0; 
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
            <a href="http://localhost:3002" class="nav-link home-link">🏠 Go to Home Page</a>
            <a href="/admin/reports" class="nav-link">📊 Generate Reports</a>
            <a href="/admin/users" class="nav-link">👥 Manage Users</a>
            <a href="/admin/applications" class="nav-link">📋 View Applications</a>
            <a href="/admin/logout" class="nav-link logout-link">🚪 Logout</a>
        </div>
        
        <div class="success">
            <strong>✅ Success!</strong> Admin login is working perfectly.
        </div>
        
        <div class="card">
            <h2>Quick Access</h2>
            <p><strong>Main Website:</strong> <a href="http://localhost:3002">http://localhost:3002</a></p>
            <p><strong>Admin Portal:</strong> <a href="/admin/login">Admin Login</a></p>
        </div>
    </body>
    </html>
  `);
});

// Admin reports route
app.get('/admin/reports', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error_msg', 'You are not authorized to view that page');
    return res.redirect('/admin/login');
  }
  
  console.log('Admin reports accessed by:', req.session.user.email);
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Generate Reports - Admin Dashboard</title>
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
            .report-card {
                border: 1px solid #dee2e6;
                border-radius: 8px;
                padding: 20px;
                margin: 10px 0;
                transition: transform 0.2s;
            }
            .report-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
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
            .btn-warning { background: #ffc107; color: black; }
            .btn-secondary { background: #6c757d; color: white; }
            .btn:hover { opacity: 0.8; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Generate Reports</h1>
            <p>Welcome, ${req.session.user.name}!</p>
        </div>
        
        <div class="card">
            <a href="http://localhost:3002" class="btn btn-primary">🏠 Go to Home Page</a>
            <a href="/admin/dashboard" class="btn btn-secondary">📊 Admin Dashboard</a>
            <a href="/admin/logout" class="btn btn-secondary" style="background: #dc3545;">🚪 Logout</a>
        </div>
        
        <div class="card">
            <h2>Available Reports</h2>
            
            <div class="report-card">
                <h3>📈 Application Summary Report</h3>
                <p>Complete overview of all loan applications including status, amounts, and trends.</p>
                <button class="btn btn-primary" onclick="generateReport('application-summary')">Generate PDF</button>
                <button class="btn btn-success" onclick="generateReport('application-summary', 'excel')">Export Excel</button>
                <button class="btn btn-info" onclick="viewReport('application-summary')">View Report</button>
            </div>
            
            <div class="report-card">
                <h3>👥 User Demographics Report</h3>
                <p>Detailed analysis of user demographics, locations, and registration patterns.</p>
                <button class="btn btn-primary" onclick="generateReport('user-demographics')">Generate PDF</button>
                <button class="btn btn-success" onclick="generateReport('user-demographics', 'excel')">Export Excel</button>
                <button class="btn btn-info" onclick="viewReport('user-demographics')">View Report</button>
            </div>
            
            <div class="report-card">
                <h3>💰 Financial Analysis Report</h3>
                <p>Comprehensive financial data including loan amounts, repayment status, and revenue analysis.</p>
                <button class="btn btn-primary" onclick="generateReport('financial-analysis')">Generate PDF</button>
                <button class="btn btn-success" onclick="generateReport('financial-analysis', 'excel')">Export Excel</button>
                <button class="btn btn-info" onclick="viewReport('financial-analysis')">View Report</button>
            </div>
            
            <div class="report-card">
                <h3>📊 Performance Metrics Report</h3>
                <p>Key performance indicators, conversion rates, and system performance metrics.</p>
                <button class="btn btn-primary" onclick="generateReport('performance-metrics')">Generate PDF</button>
                <button class="btn btn-success" onclick="generateReport('performance-metrics', 'excel')">Export Excel</button>
                <button class="btn btn-info" onclick="viewReport('performance-metrics')">View Report</button>
            </div>
            
            <div class="report-card">
                <h3>📅 Monthly Reports</h3>
                <p>Month-by-month analysis of applications, approvals, and financial performance.</p>
                <button class="btn btn-primary" onclick="generateReport('monthly')">Generate PDF</button>
                <button class="btn btn-success" onclick="generateReport('monthly', 'excel')">Export Excel</button>
                <button class="btn btn-info" onclick="viewReport('monthly')">View Report</button>
            </div>
            
            <div class="report-card">
                <h3>🗺️ Regional Analysis Report</h3>
                <p>Geographic distribution of applications and users with regional performance metrics.</p>
                <button class="btn btn-primary" onclick="generateReport('regional')">Generate PDF</button>
                <button class="btn btn-success" onclick="generateReport('regional', 'excel')">Export Excel</button>
                <button class="btn btn-info" onclick="viewReport('regional')">View Report</button>
            </div>
        </div>
        
        <script>
            window.generateReport = function(type, format) {
                format = format || 'pdf';
                alert('Generating ' + type + ' report in ' + format.toUpperCase() + ' format...');
            };
            
            window.viewReport = function(type) {
                alert('Viewing ' + type + ' report...');
            };
        </script>
    </body>
    </html>
  `);
});

// Admin users route
app.get('/admin/users', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error_msg', 'You are not authorized to view that page');
    return res.redirect('/admin/login');
  }
  
  console.log('Admin users accessed by:', req.session.user.email);
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Manage Users - Admin Dashboard</title>
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
            .user-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            .user-table th, .user-table td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #dee2e6;
            }
            .user-table th {
                background-color: #f8f9fa;
                font-weight: bold;
            }
            .user-table tr:hover {
                background-color: #f8f9fa;
            }
            .status-badge {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
            }
            .status-active { background: #d4edda; color: #155724; }
            .status-inactive { background: #f8d7da; color: #721c24; }
            .status-pending { background: #fff3cd; color: #856404; }
            .btn {
                display: inline-block;
                padding: 8px 16px;
                text-decoration: none;
                border-radius: 4px;
                margin: 2px;
                cursor: pointer;
                border: none;
                font-size: 12px;
            }
            .btn-primary { background: #007bff; color: white; }
            .btn-success { background: #28a745; color: white; }
            .btn-warning { background: #ffc107; color: black; }
            .btn-danger { background: #dc3545; color: white; }
            .btn:hover { opacity: 0.8; }
            .search-box {
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                width: 300px;
                margin-bottom: 20px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Manage Users</h1>
            <p>Welcome, ${req.session.user.name}!</p>
        </div>
        
        <div class="card">
            <a href="http://localhost:3002" class="btn btn-primary">🏠 Go to Home Page</a>
            <a href="/admin/dashboard" class="btn btn-primary">📊 Admin Dashboard</a>
            <a href="/admin/logout" class="btn btn-danger">🚪 Logout</a>
        </div>
        
        <div class="card">
            <h2>User Management</h2>
            <input type="text" class="search-box" placeholder="Search users by name, email, or ID..." onkeyup="searchUsers(this.value)">
            
            <table class="user-table" id="userTable">
                <thead>
                    <tr>
                        <th>User ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Registered</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>#001</td>
                        <td>John Doe</td>
                        <td>john.doe@email.com</td>
                        <td>+91 9876543210</td>
                        <td>User</td>
                        <td><span class="status-badge status-active">Active</span></td>
                        <td>2024-01-15</td>
                        <td>
                            <button class="btn btn-primary" onclick="viewUser(1)">View</button>
                            <button class="btn btn-warning" onclick="editUser(1)">Edit</button>
                            <button class="btn btn-danger" onclick="suspendUser(1)">Suspend</button>
                        </td>
                    </tr>
                    <tr>
                        <td>#002</td>
                        <td>Jane Smith</td>
                        <td>jane.smith@email.com</td>
                        <td>+91 9876543211</td>
                        <td>User</td>
                        <td><span class="status-badge status-active">Active</span></td>
                        <td>2024-01-20</td>
                        <td>
                            <button class="btn btn-primary" onclick="viewUser(2)">View</button>
                            <button class="btn btn-warning" onclick="editUser(2)">Edit</button>
                            <button class="btn btn-danger" onclick="suspendUser(2)">Suspend</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <script>
            function searchUsers(query) {
                console.log('Searching users:', query);
            }
            function viewUser(userId) {
                alert('Viewing user details for User ID: ' + userId);
            }
            function editUser(userId) {
                alert('Editing user: ' + userId);
            }
            function suspendUser(userId) {
                if(confirm('Suspend user ' + userId + '?')) {
                    alert('User ' + userId + ' suspended.');
                }
            }
        </script>
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
  
  console.log('Admin applications accessed by:', req.session.user.email);
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>View Applications - Admin Dashboard</title>
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
            .app-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            .app-table th, .app-table td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #dee2e6;
            }
            .app-table th {
                background-color: #f8f9fa;
                font-weight: bold;
            }
            .app-table tr:hover {
                background-color: #f8f9fa;
            }
            .status-badge {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
            }
            .status-pending { background: #fff3cd; color: #856404; }
            .status-approved { background: #d4edda; color: #155724; }
            .status-rejected { background: #f8d7da; color: #721c24; }
            .btn {
                display: inline-block;
                padding: 8px 16px;
                text-decoration: none;
                border-radius: 4px;
                margin: 2px;
                cursor: pointer;
                border: none;
                font-size: 12px;
            }
            .btn-primary { background: #007bff; color: white; }
            .btn-success { background: #28a745; color: white; }
            .btn-danger { background: #dc3545; color: white; }
            .btn:hover { opacity: 0.8; }
            .search-box {
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                width: 300px;
                margin-bottom: 20px;
            }
            .amount {
                font-weight: bold;
                color: #28a745;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>View Applications</h1>
            <p>Welcome, ${req.session.user.name}!</p>
        </div>
        
        <div class="card">
            <a href="http://localhost:3002" class="btn btn-primary">🏠 Go to Home Page</a>
            <a href="/admin/dashboard" class="btn btn-primary">📊 Admin Dashboard</a>
            <a href="/admin/logout" class="btn btn-danger">🚪 Logout</a>
        </div>
        
        <div class="card">
            <h2>Loan Applications Management</h2>
            <input type="text" class="search-box" placeholder="Search applications..." onkeyup="searchApplications(this.value)">
            
            <table class="app-table" id="appTable">
                <thead>
                    <tr>
                        <th>App ID</th>
                        <th>Applicant Name</th>
                        <th>Email</th>
                        <th>Business</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>#APP001</td>
                        <td>Ramesh Kumar</td>
                        <td>ramesh.k@email.com</td>
                        <td>Ramesh Textiles</td>
                        <td class="amount">₹5,00,000</td>
                        <td><span class="status-badge status-pending">Pending</span></td>
                        <td>
                            <button class="btn btn-primary" onclick="viewApp('APP001')">View</button>
                            <button class="btn btn-success" onclick="approveApp('APP001')">Approve</button>
                            <button class="btn btn-danger" onclick="rejectApp('APP001')">Reject</button>
                        </td>
                    </tr>
                    <tr>
                        <td>#APP002</td>
                        <td>Sunita Devi</td>
                        <td>sunita.d@email.com</td>
                        <td>Sunita Garments</td>
                        <td class="amount">₹3,50,000</td>
                        <td><span class="status-badge status-approved">Approved</span></td>
                        <td>
                            <button class="btn btn-primary" onclick="viewApp('APP002')">View</button>
                            <button class="btn btn-success" onclick="disburseApp('APP002')">Disburse</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <script>
            function searchApplications(query) {
                console.log('Searching applications:', query);
            }
            function viewApp(appId) {
                alert('Viewing application: ' + appId);
            }
            function approveApp(appId) {
                if(confirm('Approve application ' + appId + '?')) {
                    alert('Application ' + appId + ' approved!');
                }
            }
            function rejectApp(appId) {
                if(confirm('Reject application ' + appId + '?')) {
                    alert('Application ' + appId + ' rejected.');
                }
            }
            function disburseApp(appId) {
                alert('Disbursing funds for: ' + appId);
            }
        </script>
    </body>
    </html>
  `);
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// Home route
app.get('/', (req, res) => {
  res.send(`
    <h1>UdyamKings Admin Portal</h1>
    <p><a href="/admin/login">Go to Admin Login</a></p>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 Admin server running on http://localhost:${PORT}`);
  console.log(`📋 Admin Login: http://localhost:${PORT}/admin/login`);
  console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin/dashboard`);
});
