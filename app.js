require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const path = require('path');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { sequelize } = require('./models');
const User = require('./models/User')(sequelize);
const routes = require('./routes');
const applicationRoutes = require('./routes/applicationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const paymentPages = require('./routes/paymentPages');
const webhookRoutes = require('./routes/webhookRoutes');
const adminPaymentRoutes = require('./routes/admin/paymentAdminRoutes');
const adminApplicantsRoutes = require('./routes/admin/applicantsRoutes');
const { adminLogin, adminLogout, checkAuth } = require('./controllers/adminAuthController');
const { errorHandler } = require('./middleware/errorHandler');
const csrf = require('csurf');
const { apiLimiter, paymentLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads/applications")));  // Session configuration
const sessionStore = new SequelizeStore({
  db: sequelize,
  table: 'Sessions',
  checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 minutes
  expiration: 24 * 60 * 60 * 1000 // 24 hours
});

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Passport local strategy for username/password authentication
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        return done(null, false, { message: 'Incorrect email or password.' });
      }
      
      const isMatch = await user.matchPassword(password);
      
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect email or password.' });
      }
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Flash messages middleware
app.use(flash());

// CSRF protection
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// Add CSRF token to all responses
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/payments', paymentLimiter);

// Make user data available to all templates
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/', routes);
app.use('/', applicationRoutes);
app.use('/', paymentPages); // Payment pages (success, failure, etc.)
app.use('/admin', adminRoutes);
app.use('/admin', adminPaymentRoutes); // Admin payment management
app.use('/admin/applicants', adminApplicantsRoutes); // Admin applicants management
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', webhookRoutes); // Webhook endpoint (no CSRF protection)

// New Admin API routes
app.use('/api/v1/admin', require('./routes/admin'));

// Admin authentication routes
app.post('/admin/login', adminLogin);
app.post('/admin/logout', adminLogout);
app.get('/admin/auth', checkAuth);

// Admin login page
app.get('/admin/login', (req, res) => {
    if (req.session && req.session.adminId) {
        return res.redirect('/admin/dashboard');
    }
    res.render('admin/login', { 
        title: 'Admin Login',
        csrfToken: req.csrfToken(),
        error: req.flash('error')[0]
    });
});

// Error handling
app.use(errorHandler);

// Comprehensive error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Sync database and start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Sync all models
    await sequelize.query('DROP TABLE IF EXISTS Users_backup;');
    await sequelize.query('DROP TABLE IF EXISTS admins_backup;');
    await sequelize.query('PRAGMA foreign_keys = OFF;');
    await sequelize.sync({ alter: true });
    await sequelize.query('PRAGMA foreign_keys = ON;');
    
    console.log('Database synchronized');
    
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
