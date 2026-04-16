require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const flash = require('connect-flash');
const fs = require('fs');
const https = require('https');
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
const indexRoutes = require('./routes/index');
const { publicRoutes: contentRoutes, adminRoutes: adminContentRoutes } = require('./routes/content');
const formConfigRoutes = require('./routes/formConfigRoutes');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applicationRoutes');
console.log('Routes imported successfully');

// Passport configuration
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Initialize express
const app = express();
const PORT = process.env.PORT || 3003;  // Changed to 3003 to avoid port conflict
console.log('Server __dirname:', __dirname);

// Debug incoming requests
app.use((req, res, next) => {
    console.log("Incoming request:", req.url);
    next();
});

// Static uploads - must be before other middlewares
app.use("/uploads", express.static(path.join(__dirname, "public/uploads/applications")));
console.log('Static uploads path:', path.join(__dirname, 'public/uploads/applications'));

// Connect to Database with retry logic
const testDBConnection = async (maxRetries = 3, retryDelay = 2000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔌 Attempting to connect to database (Attempt ${attempt}/${maxRetries})...`);
      await sequelize.authenticate();
      console.log('✅ Database connected successfully');
      return true;
    } catch (error) {
      lastError = error;
      console.error(`❌ Database connection attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  console.error('❌ All database connection attempts failed');
  console.error('Last error details:', lastError);
  console.error('\nTroubleshooting tips:');
  console.error('1. Check if the database server is running');
  console.error('2. Verify database credentials in your .env file');
  console.error('3. Check if the database file has proper read/write permissions');
  console.error('4. Look for any database connection limits being reached');
  
  return false;
};

// Test the database connection (don't exit on failure, let the startServer function handle it)
const dbConnection = testDBConnection();

// Configure CSP and other security headers
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "https://cdnjs.cloudflare.com",
      "https://cdn.jsdelivr.net",
      "https://code.jquery.com",
      "https://cdn.datatables.net"
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://cdnjs.cloudflare.com",
      "https://cdn.jsdelivr.net",
      "https://cdn.datatables.net"
    ],
    styleSrcElem: [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://cdnjs.cloudflare.com",
      "https://cdn.jsdelivr.net",
      "https://cdn.datatables.net"
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com",
      "https://cdnjs.cloudflare.com",
      "data:",
      "https:",
      "http:",
      "blob:"
    ],
    imgSrc: [
      "'self'",
      "data:",
      "https:",
      "http:",
      "blob:"
    ],
    connectSrc: [
      "'self'",
      "https:",
      "http:",
      "blob:",
      "wss:"
    ],
    frameSrc: [
      "'self'",
      "https:",
      "http:",
      "blob:"
    ],
    mediaSrc: [
      "'self'",
      "data:",
      "blob:",
      "https:",
      "http:"
    ],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'self'"],
    scriptSrcAttr: ["'self'", "'unsafe-inline'"]
  }
};

// Security middleware with CSP configuration
app.use(helmet({
  contentSecurityPolicy: cspConfig,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false
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
app.set('layout', 'layout');

// Static folders
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    // Set proper MIME type for CSS files
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Serve manifest.json with correct MIME type
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.join(__dirname, 'public/manifest.json'));
});

// Serve local Font Awesome files
app.use('/webfonts', express.static(path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free/webfonts')));
app.use('/css/fontawesome', express.static(path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free/css')));

// Additional static routes
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'upload-applications');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Session configuration with secure settings
const sessionConfig = {
  // Use environment variable or generate a random secret for development
  secret: process.env.SESSION_SECRET || 'dev-secret-' + require('crypto').randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset the cookie maxAge on every request
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict',
    path: '/',
    // domain: process.env.COOKIE_DOMAIN // Uncomment in production if using subdomains
  },
  // Only use MongoDB store in production if MONGO_URI is set
  store: (process.env.NODE_ENV === 'production' && process.env.MONGO_URI) 
    ? new (require('connect-mongo')(session))({
        mongoUrl: process.env.MONGO_URI,
        ttl: 24 * 60 * 60, // 24 hours in seconds
        autoRemove: 'interval',
        autoRemoveInterval: 10, // Check every 10 minutes
        mongoOptions: {
          useNewUrlParser: true,
          useUnifiedTopology: true
        }
      })
    : null
};

// Log session configuration (don't log the secret in production)
if (process.env.NODE_ENV !== 'production') {
  console.log('Session configuration:', {
    ...sessionConfig,
    secret: '*** (secret hidden) ***',
    store: sessionConfig.store ? 'MongoDB Store' : 'Memory Store (development)'
  });
}

// Initialize session middleware
app.use(session(sessionConfig));

// Flash messages (must be after session middleware)
app.use(flash());

// Passport middleware (must be after session)
app.use(passport.initialize());
app.use(passport.session());

// Simple session-based authentication (for now)
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

// Add isAuthenticated method to request object
app.use((req, res, next) => {
  req.isAuthenticated = () => {
    return req.session && req.session.user;
  };
  next();
});

// Add variables to all responses (must be after session middleware)
app.use((req, res, next) => {
  // Set the full URL for use in templates
  res.locals.fullUrl = `${req.protocol}://${req.get('host')}`;
  
  // Make sure user is always defined in templates
  res.locals.user = req.session.user || null;
  
  // Make flash messages available to all templates
  res.locals.messages = req.flash();
  
  next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Mount routers
// Admin dashboard route (must be registered BEFORE indexRoutes, since indexRoutes has a catch-all 404)
app.get('/admin', (req, res) => {
  return res.redirect('/admin/dashboard');
});

app.get('/admin/dashboard', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error', 'Please log in as admin');
    return res.redirect('/admin/login');
  }

  (async () => {
    try {
      const { Application, User } = require('./models');

      const recentApplications = await Application.findAll({
        include: [{ model: User, as: 'user' }],
        order: [['created_at', 'DESC']],
        limit: 10
      });

      const [total_applications, accepted_applications, pending_applications, rejected_applications] = await Promise.all([
        Application.count(),
        Application.count({ where: { application_status: 'accepted' } }),
        Application.count({ where: { application_status: 'pending' } }),
        Application.count({ where: { application_status: 'rejected' } })
      ]);

      return res.render('admin/dashboard', {
        layout: 'layouts/admin-layout',
        title: 'Admin Dashboard | UdyamKings',
        page: 'dashboard',
        pageTitle: 'Dashboard',
        stats: {
          total_applications,
          accepted_applications,
          pending_applications,
          rejected_applications
        },
        recentApplications,
        scripts: [
          'https://cdn.jsdelivr.net/npm/chart.js@3.7.0/dist/chart.min.js',
          '/js/admin-dashboard.js'
        ]
      });
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
      return res.status(500).render('errors/error', {
        title: 'Error | UdyamKings',
        layout: 'layouts/error',
        message: 'Failed to load dashboard',
        status: 500,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  })();
});

app.get('/admin/applications', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error', 'Please log in as admin');
    return res.redirect('/admin/login');
  }

  try {
    const { Application, User } = require('./models');
    const applications = await Application.findAll({
      include: [
        { model: User, as: 'user', required: false }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.render('admin/applications', {
      layout: 'layouts/admin-layout',
      title: 'Applications | UdyamKings Admin',
      page: 'applications',
      pageTitle: 'Applications',
      applications,
      scripts: [
        'https://cdn.datatables.net/1.11.5/js/jquery.dataTables.min.js',
        'https://cdn.datatables.net/1.11.5/js/dataTables.bootstrap5.min.js',
        '/js/admin-applications.js'
      ]
    });
  } catch (err) {
    console.error('Error loading admin applications:', err);
    return res.status(500).render('errors/error', {
      title: 'Error | UdyamKings',
      layout: 'layouts/error',
      message: 'Failed to load applications',
      status: 500,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

app.get('/admin/applications/:id', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error', 'Please log in as admin');
    return res.redirect('/admin/login');
  }

  try {
    const { Application, User } = require('./models');
    const application = await Application.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', required: false }
      ]
    });

    if (!application) {
      return res.status(404).render('errors/404', {
        title: 'Page Not Found | UdyamKings',
        layout: 'layouts/error',
        message: 'The page you are looking for does not exist.',
        status: 404
      });
    }

    return res.render('admin/application-detail', {
      layout: 'layouts/admin-layout',
      title: `Application #${application.id} | UdyamKings Admin`,
      page: 'applications',
      pageTitle: `Application #${application.id}`,
      application,
      scripts: ['/js/admin-application-detail.js']
    });
  } catch (err) {
    console.error('Error loading admin application detail:', err);
    return res.status(500).render('errors/error', {
      title: 'Error | UdyamKings',
      layout: 'layouts/error',
      message: 'Failed to load application',
      status: 500,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

app.get('/admin/applications/:id/edit', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error', 'Please log in as admin');
    return res.redirect('/admin/login');
  }

  try {
    const models = require('./models');
    const application = await models.Application.findByPk(req.params.id, {
      include: [{ model: models.User, as: 'user' }]
    });
    
    if (!application) {
      req.flash('error_msg', 'Application not found');
      return res.redirect('/admin/applications');
    }

    return res.render('admin/application-edit', {
      layout: 'layouts/admin-layout',
      title: `Edit Application #${application.id} | UdyamKings Admin`,
      page: 'applications',
      pageTitle: `Edit Application #${application.id}`,
      application
    });
  } catch (err) {
    console.error('Error loading edit application:', err);
    return res.status(500).render('errors/error', {
      title: 'Error | UdyamKings',
      layout: 'layouts/error',
      message: 'Failed to load application for editing.'
    });
  }
});

app.post('/admin/applications/:id/update', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error', 'Please log in as admin');
    return res.redirect('/admin/login');
  }

  try {
    const models = require('./models');
    const application = await models.Application.findByPk(req.params.id);
    
    if (!application) {
      req.flash('error_msg', 'Application not found');
      return res.redirect('/admin/applications');
    }

    // Update application fields
    const {
      application_status,
      payment_status,
      business_name,
      applicant_type,
      amount_requested,
      preferred_contact_time,
      description_short,
      description_long,
      annual_revenue,
      years_in_operation,
      admin_notes
    } = req.body;

    if (application_status) application.application_status = application_status;
    if (payment_status) application.payment_status = payment_status;
    if (business_name) application.business_name = business_name;
    if (applicant_type) application.applicant_type = applicant_type;
    if (amount_requested) application.amount_requested = amount_requested;
    if (preferred_contact_time) application.preferred_contact_time = preferred_contact_time;
    if (description_short) application.description_short = description_short;
    if (description_long) application.description_long = description_long;
    if (annual_revenue) application.annual_revenue = annual_revenue;
    if (years_in_operation) application.years_in_operation = years_in_operation;
    if (admin_notes) application.admin_notes = admin_notes;

    await application.save();

    req.flash('success_msg', 'Application updated successfully');
    return res.redirect(`/admin/applications/${application.id}`);
  } catch (err) {
    console.error('Error updating application:', err);
    req.flash('error_msg', 'Failed to update application');
    return res.redirect(`/admin/applications/${req.params.id}/edit`);
  }
});

app.post('/admin/applications/:id/status', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error', 'Please log in as admin');
    return res.redirect('/admin/login');
  }

  try {
    const { Application } = require('./models');
    const application = await Application.findByPk(req.params.id);
    if (!application) {
      req.flash('error_msg', 'Application not found');
      return res.redirect('/admin/applications');
    }

    const status = req.body.status;
    const notes = req.body.admin_notes;

    if (status) application.application_status = status;
    if (notes) application.admin_notes = notes;
    await application.save();

    req.flash('success_msg', 'Application status updated successfully');
    return res.redirect('/admin/applications');
  } catch (err) {
    console.error('Error updating application status:', err);
    req.flash('error_msg', 'Failed to update application status');
    return res.redirect('/admin/applications');
  }
});

app.post('/admin/applications/:id/delete', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error', 'Please log in as admin');
    return res.redirect('/admin/login');
  }

  try {
    const { Application } = require('./models');
    const application = await Application.findByPk(req.params.id);
    if (!application) {
      req.flash('error_msg', 'Application not found');
      return res.redirect('/admin/applications');
    }

    await application.destroy();
    req.flash('success_msg', 'Application deleted successfully');
    return res.redirect('/admin/applications');
  } catch (err) {
    console.error('Error deleting application:', err);
    req.flash('error_msg', 'Failed to delete application');
    return res.redirect('/admin/applications');
  }
});

app.get('/admin/payments', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error', 'Please log in as admin');
    return res.redirect('/admin/login');
  }

  return res.render('admin/payments', {
    layout: 'layouts/admin-layout',
    title: 'Payments | UdyamKings Admin',
    page: 'payments',
    pageTitle: 'Payments',
    payments: []
  });
});

app.get('/admin/form-fields', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error', 'Please log in as admin');
    return res.redirect('/admin/login');
  }

  return res.render('admin/form-fields', {
    layout: 'layouts/admin-layout',
    title: 'Form Fields | UdyamKings Admin',
    page: 'form-fields',
    pageTitle: 'Form Fields'
  });
});

app.get('/admin/content', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error', 'Please log in as admin');
    return res.redirect('/admin/login');
  }

  return res.render('admin/content', {
    layout: 'layouts/admin-layout',
    title: 'Content | UdyamKings Admin',
    page: 'content',
    pageTitle: 'Content',
    content: []
  });
});

app.get('/admin/email-templates', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error', 'Please log in as admin');
    return res.redirect('/admin/login');
  }

  return res.render('admin/email-templates', {
    layout: 'layouts/admin-layout',
    title: 'Email Templates | UdyamKings Admin',
    page: 'email-templates',
    pageTitle: 'Email Templates',
    templates: []
  });
});

app.get('/admin/settings', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error', 'Please log in as admin');
    return res.redirect('/admin/login');
  }

  return res.render('admin/settings', {
    layout: 'layouts/admin-layout',
    title: 'Settings | UdyamKings Admin',
    page: 'settings',
    pageTitle: 'System Settings',
    scripts: ['/js/admin-settings.js']
  });
});

app.get('/admin/users', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error', 'Please log in as admin');
    return res.redirect('/admin/login');
  }

  try {
    const { User } = require('./models');
    const users = await User.findAll({ order: [['createdAt', 'DESC']] });

    return res.render('admin/users', {
      layout: 'layouts/admin-layout',
      title: 'Users | UdyamKings Admin',
      page: 'users',
      pageTitle: 'Users',
      users
    });
  } catch (err) {
    console.error('Error loading admin users:', err);
    return res.status(500).render('errors/error', {
      title: 'Error | UdyamKings',
      layout: 'layouts/error',
      message: 'Failed to load users',
      status: 500,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

app.get('/admin/logout', (req, res) => {
  try {
    req.session.destroy(() => {
      res.redirect('/admin/login');
    });
  } catch (e) {
    res.redirect('/admin/login');
  }
});

app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/admin/content', adminContentRoutes);
app.use('/api/form-configs', formConfigRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use(applicationRoutes);
app.use('/', indexRoutes);
console.log('Routes mounted successfully');

// Debug middleware stack
console.log('Middleware stack:', app._router.stack.map(layer => ({ name: layer.name, regexp: layer.regexp?.toString() })));

// Routes
app.get('/', (req, res) => {
    const templateVars = {
      title: 'Home | UdyamKings',
      page: 'home',
      description: 'UdyamKings - Empowering entrepreneurs with funding, mentorship, and resources to build successful businesses.',
      user: req.user || null,
      appUrl: process.env.APP_URL || 'http://localhost:3000'
    };
    res.render('index', templateVars);
});


app.get('/investors', (req, res) => {
  res.render('investors', { 
    title: 'For Investors | UdyamKings',
    page: 'investors',
    description: 'Discover investment opportunities with UdyamKings. Support promising startups and earn competitive returns.',
    appUrl: process.env.APP_URL || 'http://localhost:3000'
  });
});

app.get('/contact', (req, res) => {
  res.render('contact', { 
    title: 'Contact Us | UdyamKings',
    page: 'contact',
    description: 'Get in touch with UdyamKings. We\'d love to hear from you about partnerships, investments, or any questions.',
    appUrl: process.env.APP_URL || 'http://localhost:3000'
  });
});

// Login route with proper error handling
app.get('/login', (req, res, next) => {
  try {
    res.render('auth/login', { 
      title: 'Login | UdyamKings',
      layout: 'layouts/main',
      page: 'login',
      description: 'Login to your UdyamKings account to manage your profile and applications.',
      appUrl: process.env.APP_URL || `http://localhost:${PORT}`,
      messages: {
        error: req.flash('error'),
        success: req.flash('success')
      }
    });
  } catch (err) {
    next(err);
  }
});

app.get('/register', (req, res) => {
  res.render('auth/register', { 
    title: 'Register | UdyamKings',
    layout: 'layouts/main',
    page: 'register',
    description: 'Create a new UdyamKings account to apply for funding or become an investor.',
    appUrl: process.env.APP_URL || 'http://localhost:3000'
  });
});

app.get('/terms', (req, res) => {
  res.render('terms', { 
    title: 'Terms & Conditions | UdyamKings',
    page: 'terms',
    description: 'Review the terms and conditions of using UdyamKings services.',
    appUrl: process.env.APP_URL || 'http://localhost:3000'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', {
    title: '404 - Page Not Found | UdyamKings',
    page: '404'
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).render('errors/404', {
    title: 'Page Not Found | UdyamKings',
    layout: 'layouts/error',
    message: 'The page you are looking for does not exist.',
    status: 404
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).render('errors/error', {
    title: 'Error | UdyamKings',
    layout: 'layouts/error',
    message: err.message || 'Something went wrong!',
    status: statusCode,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Enhanced server startup with better error handling and database connection management
const startServer = async () => {
  try {
    console.log('🔄 Starting server initialization...');
    
    // Test database connection with retry logic
    // const isDbConnected = await testDBConnection();
    
    // if (!isDbConnected) {
    //   console.error('❌ Server cannot start without a database connection');
    //   process.exit(1);
    // }
    
// Start the server
    // const options = {
    //   key: fs.readFileSync('localhost-key.pem'),
    //   cert: fs.readFileSync('localhost.pem')
    // };
    // const server = https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(60));
      console.log(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`🌐 Access the site at: http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log('='.repeat(60) + '\n');
      
      // Emit a custom event when server is ready
      app.emit('server:ready');
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('\n' + '❌'.repeat(10) + ' SERVER ERROR ' + '❌'.repeat(10));
      
      if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use.`);
        console.log('\nTo resolve this, you can:');
        console.log(`1. Stop the process using port ${PORT} by running: taskkill /F /IM node.exe`);
        console.log(`2. Or specify a different port in your .env file: PORT=3001`);
      } else {
        console.error('\n❌ Server error:', error.message);
        console.error('Stack:', error.stack || 'No stack trace available');
      }
      
      console.error('\n' + '❌'.repeat(25) + '\n');
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('\n' + '⚠️'.repeat(10) + ' UNHANDLED REJECTION ' + '⚠️'.repeat(10));
      console.error('Unhandled Rejection at:', promise);
      console.error('Reason:', reason);
      console.error('Stack:', reason.stack || 'No stack trace available');
      console.error('\n' + '⚠️'.repeat(40) + '\n');
      
      // Close server & exit process
      if (server) {
        server.close(() => process.exit(1));
      } else {
        process.exit(1);
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('\n' + '💥'.repeat(10) + ' UNCAUGHT EXCEPTION ' + '💥'.repeat(10));
      console.error('Uncaught Exception:', error.message);
      console.error('Stack:', error.stack || 'No stack trace available');
      console.error('\n' + '💥'.repeat(40) + '\n');
      
      // Attempt a graceful shutdown
      if (server) {
        server.close(() => process.exit(1));
      } else {
        process.exit(1);
      }
    });

    // Handle process termination
    const shutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      console.log('Closing server...');
      
      server.close(() => {
        console.log('Server closed');
        console.log('Exiting process...');
        process.exit(0);
      });
      
      // Force shutdown if server takes too long to close
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    
    // Log when server is closing
    server.on('close', () => {
      console.log('Server closed all connections');
    });

  } catch (error) {
    console.error('\n' + '❌'.repeat(10) + ' FAILED TO START SERVER ' + '❌'.repeat(10));
    console.error('Error:', error.message);
    console.error('Stack:', error.stack || 'No stack trace available');
    console.error('\n' + '❌'.repeat(50) + '\n');
    process.exit(1);
  }
};

// Start the server
startServer();
