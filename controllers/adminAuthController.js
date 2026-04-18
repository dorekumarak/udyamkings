const { Admin } = require('../models');
const logger = require('../utils/logger');

// Admin login
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find admin by email
        const admin = await Admin.findOne({ where: { email, is_active: true } });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isMatch = await admin.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        await Admin.update(
            { last_login: new Date() },
            { where: { id: admin.id } }
        );

        // Create session
        req.session.adminId = admin.id;
        req.session.adminRole = admin.role;
        req.session.adminPermissions = admin.permissions;

        res.json({
            success: true,
            message: 'Login successful',
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions
            }
        });
    } catch (error) {
        logger.error('Admin login error:', {
            error: error.message,
            stack: error.stack,
            email: req.body.email
        });
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
};

// Admin logout
const adminLogout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            logger.error('Admin logout error:', err);
            return res.status(500).json({
                success: false,
                message: 'Logout failed'
            });
        }
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    });
};

// Check admin auth status
const checkAuth = (req, res) => {
    if (req.session && req.session.adminId) {
        res.json({
            success: true,
            admin: {
                id: req.session.adminId,
                role: req.session.adminRole,
                permissions: req.session.adminPermissions
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
    }
};

// Middleware to check admin authentication
const requireAdminAuth = (req, res, next) => {
    if (req.session && req.session.adminId) {
        req.admin = {
            id: req.session.adminId,
            role: req.session.adminRole,
            permissions: req.session.adminPermissions
        };
        next();
    } else {
        res.redirect('/admin/login');
    }
};

// Middleware to check permissions
const requirePermission = (module, action) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (req.admin.role === 'super_admin' || 
            (req.admin.permissions[module] && req.admin.permissions[module].includes(action))) {
            next();
        } else {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }
    };
};

module.exports = {
    adminLogin,
    adminLogout,
    checkAuth,
    requireAdminAuth,
    requirePermission
};
