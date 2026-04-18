const express = require('express');
const router = express.Router();

// Import route files
const authRoutes = require('./auth');
const dashboardController = require('../../controllers/admin/dashboardController');
const applicationRoutes = require('./applicationRoutes');
const formFieldRoutes = require('./formFieldRoutes');
const contentRoutes = require('./contentRoutes');
const settingsRoutes = require('./settingsRoutes');
const emailTemplateRoutes = require('./emailTemplateRoutes');
// const paymentRoutes = require('./paymentRoutes');
// const userRoutes = require('./users');

// Re-route into other resource routers
router.use('/auth', authRoutes);
router.use('/applications', applicationRoutes);
router.use('/form-fields', formFieldRoutes);
router.use('/content', contentRoutes);
router.use('/settings', settingsRoutes);
router.use('/email-templates', emailTemplateRoutes);
// router.use('/payments', paymentRoutes);
// router.use('/users', userRoutes);

module.exports = router;
