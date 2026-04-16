// Test script to verify our setup
require('dotenv').config();

console.log('Testing environment variables...');
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'Set' : 'Not set');
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'Not set');
console.log('RAZORPAY_WEBHOOK_SECRET:', process.env.RAZORPAY_WEBHOOK_SECRET ? 'Set' : 'Not set');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set' : 'Not set');

// Test logger
const logger = require('../utils/logger');
logger.info('Test setup completed successfully');

// Test rate limiter
const { apiLimiter, paymentLimiter } = require('../middleware/rateLimiter');
console.log('Rate limiter loaded successfully');

console.log('\nSetup test completed!');
