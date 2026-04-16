const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ErrorResponse = require('../utils/errorResponse');

// Protect routes - requires authentication (API)
const protect = async (req, res, next) => {
    let token;

    // Get token from header or cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    // Check if token exists
    if (!token) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Get user from the token and add to request object
        req.user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password'] }
        });
        
        // Check if user exists
        if (!req.user) {
            return next(new ErrorResponse('User not found', 404));
        }
        
        next();
    } catch (err) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }
};

// Grant access to specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ErrorResponse('User not authenticated', 401));
        }
        
        if (!roles.includes(req.user.role)) {
            return next(
                new ErrorResponse(`User role ${req.user.role} is not authorized to access this route`, 403)
            );
        }
        next();
    };
};

// Check if user is authenticated (API)
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ 
        success: false, 
        error: 'Not authenticated. Please log in.' 
    });
};

// Check if user is admin (API)
const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
    }
    res.status(403).json({ 
        success: false, 
        error: 'Not authorized. Admin access required.' 
    });
};

// Ensure user is authenticated (Web)
const ensureAuthenticated = (req, res, next) => {
    const user = req.isAuthenticated();
    if (user && user.id) {
        req.user = user; // set req.user
        return next();
    }
    
    // Store the original URL to redirect after login
    req.session.returnTo = req.originalUrl;
    
    req.flash('error_msg', 'Please log in to view this resource');
    res.redirect('/login');
};

// Forward authenticated users to dashboard (Web)
const forwardAuthenticated = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next();
    }
    
    // Redirect to the original URL or dashboard
    const returnTo = req.session.returnTo || '/dashboard';
    delete req.session.returnTo;
    
    res.redirect(returnTo);
};

module.exports = {
    protect,
    authorize,
    isAuthenticated,
    isAdmin,
    ensureAuthenticated,
    forwardAuthenticated
};
