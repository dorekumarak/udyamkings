require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
// const { sequelize } = require('./config/db');

// Initialize express
const app = express();
const PORT = process.env.PORT || 3003;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true }
}));

// Flash messages
app.use(flash());

// Make flash messages available to templates
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Add isAuthenticated method
app.use((req, res, next) => {
  req.isAuthenticated = () => {
    return req.session && req.session.user;
  };
  next();
});

// Simple middleware
const forwardAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to view this resource');
  res.redirect('/login');
};

// Import routes
const indexRoutes = require('./routes/index');

// Mount routers
app.use('/', indexRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
