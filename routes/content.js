const express = require('express');
const router = express.Router();
const { Content } = require('../models');

// Middleware to check admin authentication for API routes
const requireAdminAuth = (req, res, next) => {
    // Check if user is logged in as admin via session
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({
            success: false,
            message: 'Admin authentication required'
        });
    }
};

// Get content by category (public route for homepage FAQ loading)
router.get('/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const content = await Content.findAll({
            where: {
                category,
                is_active: true
            },
            order: [['order', 'ASC'], ['created_at', 'ASC']]
        });

        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch content'
        });
    }
});

// Admin routes below require authentication
const adminRouter = express.Router();
adminRouter.use(requireAdminAuth);

// Get all content items (admin)
adminRouter.get('/', async (req, res) => {
    try {
        const content = await Content.findAll({
            order: [['category', 'ASC'], ['order', 'ASC'], ['created_at', 'ASC']]
        });

        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch content'
        });
    }
});

// Get content by category (admin)
adminRouter.get('/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const content = await Content.findAll({
            where: { category },
            order: [['order', 'ASC'], ['created_at', 'ASC']]
        });

        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        console.error('Error fetching content by category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch content'
        });
    }
});

// Create new content
adminRouter.post('/', async (req, res) => {
    try {
        const { key, value, category, description, type, is_active, order } = req.body;

        const content = await Content.create({
            key,
            value,
            category: category || 'homepage',
            description,
            type: type || 'text',
            is_active: is_active !== undefined ? is_active : true,
            order: order || 0
        });

        res.status(201).json({
            success: true,
            data: content,
            message: 'Content created successfully'
        });
    } catch (error) {
        console.error('Error creating content:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create content'
        });
    }
});

// Update content
adminRouter.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { key, value, category, description, type, is_active, order } = req.body;

        const content = await Content.findByPk(id);
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        await content.update({
            key,
            value,
            category,
            description,
            type,
            is_active,
            order
        });

        res.json({
            success: true,
            data: content,
            message: 'Content updated successfully'
        });
    } catch (error) {
        console.error('Error updating content:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update content'
        });
    }
});

// Delete content
adminRouter.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const content = await Content.findByPk(id);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        await content.destroy();

        res.json({
            success: true,
            message: 'Content deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting content:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete content'
        });
    }
});

// Get single content item
adminRouter.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const content = await Content.findByPk(id);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch content'
        });
    }
});

module.exports = { publicRoutes: router, adminRoutes: adminRouter };
