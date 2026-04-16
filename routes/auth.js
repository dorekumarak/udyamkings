const express = require('express');
const { check } = require('express-validator');
const { validationResult } = require('express-validator');
const { User } = require('../models');

const router = express.Router();

// Public routes
router.post(
    '/register',
    [
        check('name', 'Please add name').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array().map(e => e.msg).join('. ')
            });
        }

        const { name, email, password, mobile, city } = req.body;

        try {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already registered'
                });
            }

            await User.create({
                name: name.trim(),
                email,
                password,
                mobile: mobile || null,
                city: city || null,
                email_verified: true
            });

            return res.json({
                success: true,
                message: 'Account created successfully'
            });
        } catch (err) {
            console.error('API register error:', err);
            return res.status(500).json({
                success: false,
                message: 'Error registering user'
            });
        }
    }
);

router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array().map(e => e.msg).join('. ')
            });
        }

        const { email, password } = req.body;

        try {
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Create session for the web app
            req.session.user = {
                id: user.id,
                email: user.email,
                role: user.role
            };

            return res.json({
                success: true
            });
        } catch (err) {
            console.error('API login error:', err);
            return res.status(500).json({
                success: false,
                message: 'Login failed'
            });
        }
    }
);

module.exports = router;
