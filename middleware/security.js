const { body, validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const helmet = require('helmet');
const hpp = require('hpp');
const path = require('path');
const fs = require('fs');

// Rate limiting for OTP and email endpoints
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: { 
        success: false, 
        message: 'Too many OTP requests from this IP, please try again after 15 minutes' 
    }
});

// File upload validation
const fileUploadOptions = {
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only .png, .jpg, .jpeg, and .pdf files are allowed'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
};

// Input validation rules
const validate = (method) => {
    switch (method) {
        case 'register': {
            return [
                body('name').trim().isLength({ min: 2, max: 50 })
                    .withMessage('Name must be between 2 and 50 characters'),
                body('email').isEmail().normalizeEmail()
                    .withMessage('Please provide a valid email'),
                body('password').isLength({ min: 8 })
                    .withMessage('Password must be at least 8 characters long')
                    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, 'i')
                    .withMessage('Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'),
                body('phone').matches(/^[0-9]{10}$/)
                    .withMessage('Please provide a valid 10-digit phone number')
            ];
        }
        // Add more validation rules as needed
    }
};

// Sanitize input data
const sanitizeInput = (req, res, next) => {
    // Remove any keys that start with $ to prevent NoSQL injection
    req.body = JSON.parse(JSON.stringify(req.body).replace(/\$\w+/g, ''));
    
    // Sanitize all request data
    for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
            req.body[key] = xss(req.body[key].trim());
        }
    }
    
    next();
};

// Check for validation errors
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            errors: errors.array() 
        });
    }
    next();
};

// Secure headers middleware
const secureHeaders = [
    helmet(),
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https://*.razorpay.com"],
            connectSrc: ["'self'", "https://api.razorpay.com"],
            fontSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    }),
    helmet.hsts({
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true
    }),
    helmet.frameguard({ action: 'deny' }),
    helmet.noSniff(),
    helmet.xssFilter(),
    helmet.referrerPolicy({ policy: 'same-origin' }),
    // Prevent HTTP Parameter Pollution
    hpp(),
    // Sanitize data
    mongoSanitize(),
    xss()
];

// File upload validation middleware
const validateFileUpload = (req, res, next) => {
    if (!req.file) {
        return next();
    }
    
    // Check file size (5MB limit)
    if (req.file.size > 5 * 1024 * 1024) {
        // Delete the uploaded file if it's too large
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
            success: false, 
            message: 'File size exceeds the 5MB limit' 
        });
    }
    
    next();
};

module.exports = {
    otpLimiter,
    fileUploadOptions,
    validate,
    sanitizeInput,
    validateRequest,
    secureHeaders,
    validateFileUpload
};
