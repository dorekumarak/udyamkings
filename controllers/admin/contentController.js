const { Content } = require('../../models');
const asyncHandler = require('../../middleware/async');
const { Op } = require('sequelize');

// @desc    Get all content
// @route   GET /api/v1/admin/content
// @access  Private/Admin
exports.getAllContent = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 50,
        category,
        search
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build where clause
    const whereClause = {};
    
    if (category) {
        whereClause.category = category;
    }
    
    if (search) {
        whereClause[Op.or] = [
            { key: { [Op.like]: `%${search}%` } },
            { description: { [Op.like]: `%${search}%` } }
        ];
    }

    const { count, rows: content } = await Content.findAndCountAll({
        where: whereClause,
        order: [['category', 'ASC'], ['key', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
    });

    res.status(200).json({
        success: true,
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        data: content
    });
});

// @desc    Get content by category
// @route   GET /api/v1/admin/content/category/:category
// @access  Private/Admin
exports.getContentByCategory = asyncHandler(async (req, res) => {
    const { category } = req.params;
    
    const content = await Content.findAll({
        where: { category },
        order: [['key', 'ASC']]
    });

    res.status(200).json({
        success: true,
        data: content
    });
});

// @desc    Get single content by ID
// @route   GET /api/v1/admin/content/:id
// @access  Private/Admin
exports.getContentById = asyncHandler(async (req, res) => {
    const content = await Content.findByPk(req.params.id);

    if (!content) {
        return res.status(404).json({
            success: false,
            message: 'Content not found'
        });
    }

    res.status(200).json({
        success: true,
        data: content
    });
});

// @desc    Create new content
// @route   POST /api/v1/admin/content
// @access  Private/Admin
exports.createContent = asyncHandler(async (req, res) => {
    const {
        key,
        value,
        type,
        description,
        category
    } = req.body;

    // Check if key already exists
    const existingContent = await Content.findOne({
        where: { key }
    });

    if (existingContent) {
        return res.status(400).json({
            success: false,
            message: 'Content key already exists'
        });
    }

    // Parse value if it's JSON
    let parsedValue = value;
    if (type === 'json' && typeof value === 'string') {
        try {
            parsedValue = JSON.parse(value);
        } catch (e) {
            return res.status(400).json({
                success: false,
                message: 'Invalid JSON format'
            });
        }
    }

    const content = await Content.create({
        key,
        value: parsedValue,
        type: type || 'text',
        description,
        category: category || 'homepage'
    });

    res.status(201).json({
        success: true,
        message: 'Content created successfully',
        data: content
    });
});

// @desc    Update content
// @route   PUT /api/v1/admin/content/:id
// @access  Private/Admin
exports.updateContent = asyncHandler(async (req, res) => {
    const content = await Content.findByPk(req.params.id);

    if (!content) {
        return res.status(404).json({
            success: false,
            message: 'Content not found'
        });
    }

    const {
        key,
        value,
        type,
        description,
        category,
        is_active
    } = req.body;

    // Check if key already exists (excluding current content)
    if (key && key !== content.key) {
        const existingContent = await Content.findOne({
            where: { 
                key,
                id: { [Op.ne]: req.params.id }
            }
        });

        if (existingContent) {
            return res.status(400).json({
                success: false,
                message: 'Content key already exists'
            });
        }
    }

    // Parse value if it's JSON
    let parsedValue = value;
    if (type === 'json' && typeof value === 'string') {
        try {
            parsedValue = JSON.parse(value);
        } catch (e) {
            return res.status(400).json({
                success: false,
                message: 'Invalid JSON format'
            });
        }
    }

    // Update content
    const updateData = {};
    if (key !== undefined) updateData.key = key;
    if (parsedValue !== undefined) updateData.value = parsedValue;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (is_active !== undefined) updateData.is_active = is_active;

    await content.update(updateData);

    res.status(200).json({
        success: true,
        message: 'Content updated successfully',
        data: content
    });
});

// @desc    Delete content
// @route   DELETE /api/v1/admin/content/:id
// @access  Private/Admin
exports.deleteContent = asyncHandler(async (req, res) => {
    const content = await Content.findByPk(req.params.id);

    if (!content) {
        return res.status(404).json({
            success: false,
            message: 'Content not found'
        });
    }

    await content.destroy();

    res.status(200).json({
        success: true,
        message: 'Content deleted successfully'
    });
});

// @desc    Get public content for frontend
// @route   GET /api/v1/content
// @access  Public
exports.getPublicContent = asyncHandler(async (req, res) => {
    const { category, keys } = req.query;
    
    let whereClause = { is_active: true };
    
    if (category) {
        whereClause.category = category;
    }
    
    if (keys) {
        const keyArray = Array.isArray(keys) ? keys : keys.split(',');
        whereClause.key = { [Op.in]: keyArray };
    }

    const content = await Content.findAll({
        where: whereClause,
        order: [['key', 'ASC']]
    });

    // Format response
    const formattedContent = {};
    content.forEach(item => {
        formattedContent[item.key] = item.type === 'json' 
            ? (typeof item.value === 'string' ? JSON.parse(item.value) : item.value)
            : item.value;
    });

    res.status(200).json({
        success: true,
        data: formattedContent
    });
});

// @desc    Bulk update content
// @route   PUT /api/v1/admin/content/bulk
// @access  Private/Admin
exports.bulkUpdateContent = asyncHandler(async (req, res) => {
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
        return res.status(400).json({
            success: false,
            message: 'Updates must be an array'
        });
    }

    const results = [];
    
    for (const update of updates) {
        const { id, key, value, type, description, category, is_active } = update;
        
        try {
            const content = await Content.findByPk(id);
            
            if (!content) {
                results.push({ id, success: false, message: 'Content not found' });
                continue;
            }

            // Parse value if it's JSON
            let parsedValue = value;
            if (type === 'json' && typeof value === 'string') {
                try {
                    parsedValue = JSON.parse(value);
                } catch (e) {
                    results.push({ id, success: false, message: 'Invalid JSON format' });
                    continue;
                }
            }

            const updateData = {};
            if (key !== undefined) updateData.key = key;
            if (parsedValue !== undefined) updateData.value = parsedValue;
            if (type !== undefined) updateData.type = type;
            if (description !== undefined) updateData.description = description;
            if (category !== undefined) updateData.category = category;
            if (is_active !== undefined) updateData.is_active = is_active;

            await content.update(updateData);
            results.push({ id, success: true, data: content });
            
        } catch (error) {
            results.push({ id, success: false, message: error.message });
        }
    }

    res.status(200).json({
        success: true,
        message: 'Bulk update completed',
        results
    });
});
