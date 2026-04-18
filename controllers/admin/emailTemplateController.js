const { EmailTemplate, User, Application } = require('../../models');
const asyncHandler = require('../../middleware/async');
const { Op } = require('sequelize');

// @desc    Get all email templates
// @route   GET /api/v1/admin/email-templates
// @access  Private/Admin
exports.getAllEmailTemplates = asyncHandler(async (req, res) => {
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
            { name: { [Op.like]: `%${search}%` } },
            { subject: { [Op.like]: `%${search}%` } },
            { description: { [Op.like]: `%${search}%` } }
        ];
    }

    const { count, rows: templates } = await EmailTemplate.findAndCountAll({
        where: whereClause,
        order: [['category', 'ASC'], ['name', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
    });

    res.status(200).json({
        success: true,
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        data: templates
    });
});

// @desc    Get email template by ID
// @route   GET /api/v1/admin/email-templates/:id
// @access  Private/Admin
exports.getEmailTemplateById = asyncHandler(async (req, res) => {
    const template = await EmailTemplate.findByPk(req.params.id);

    if (!template) {
        return res.status(404).json({
            success: false,
            message: 'Email template not found'
        });
    }

    res.status(200).json({
        success: true,
        data: template
    });
});

// @desc    Create new email template
// @route   POST /api/v1/admin/email-templates
// @access  Private/Admin
exports.createEmailTemplate = asyncHandler(async (req, res) => {
    const {
        name,
        subject,
        html_content,
        text_content,
        variables,
        description,
        category
    } = req.body;

    // Check if template name already exists
    const existingTemplate = await EmailTemplate.findOne({
        where: { name }
    });

    if (existingTemplate) {
        return res.status(400).json({
            success: false,
            message: 'Template name already exists'
        });
    }

    // Parse variables if it's a string
    let parsedVariables = variables;
    if (typeof variables === 'string') {
        try {
            parsedVariables = JSON.parse(variables);
        } catch (e) {
            return res.status(400).json({
                success: false,
                message: 'Invalid variables format'
            });
        }
    }

    const template = await EmailTemplate.create({
        name,
        subject,
        html_content,
        text_content,
        variables: parsedVariables || [],
        description,
        category: category || 'application'
    });

    res.status(201).json({
        success: true,
        message: 'Email template created successfully',
        data: template
    });
});

// @desc    Update email template
// @route   PUT /api/v1/admin/email-templates/:id
// @access  Private/Admin
exports.updateEmailTemplate = asyncHandler(async (req, res) => {
    const template = await EmailTemplate.findByPk(req.params.id);

    if (!template) {
        return res.status(404).json({
            success: false,
            message: 'Email template not found'
        });
    }

    const {
        name,
        subject,
        html_content,
        text_content,
        variables,
        description,
        category,
        is_active
    } = req.body;

    // Check if name already exists (excluding current template)
    if (name && name !== template.name) {
        const existingTemplate = await EmailTemplate.findOne({
            where: { 
                name,
                id: { [Op.ne]: req.params.id }
            }
        });

        if (existingTemplate) {
            return res.status(400).json({
                success: false,
                message: 'Template name already exists'
            });
        }
    }

    // Parse variables if it's a string
    let parsedVariables = variables;
    if (variables && typeof variables === 'string') {
        try {
            parsedVariables = JSON.parse(variables);
        } catch (e) {
            return res.status(400).json({
                success: false,
                message: 'Invalid variables format'
            });
        }
    }

    // Update template
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (subject !== undefined) updateData.subject = subject;
    if (html_content !== undefined) updateData.html_content = html_content;
    if (text_content !== undefined) updateData.text_content = text_content;
    if (parsedVariables !== undefined) updateData.variables = parsedVariables;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (is_active !== undefined) updateData.is_active = is_active;

    await template.update(updateData);

    res.status(200).json({
        success: true,
        message: 'Email template updated successfully',
        data: template
    });
});

// @desc    Delete email template
// @route   DELETE /api/v1/admin/email-templates/:id
// @access  Private/Admin
exports.deleteEmailTemplate = asyncHandler(async (req, res) => {
    const template = await EmailTemplate.findByPk(req.params.id);

    if (!template) {
        return res.status(404).json({
            success: false,
            message: 'Email template not found'
        });
    }

    await template.destroy();

    res.status(200).json({
        success: true,
        message: 'Email template deleted successfully'
    });
});

// @desc    Send test email
// @route   POST /api/v1/admin/email-templates/:id/test
// @access  Private/Admin
exports.sendTestEmail = asyncHandler(async (req, res) => {
    const { test_email } = req.body;
    const templateId = req.params.id;

    if (!test_email) {
        return res.status(400).json({
            success: false,
            message: 'Test email address is required'
        });
    }

    const template = await EmailTemplate.findByPk(templateId);

    if (!template) {
        return res.status(404).json({
            success: false,
            message: 'Email template not found'
        });
    }

    try {
        // Prepare test variables
        const testVariables = {
            business_name: 'Test Business',
            amount_requested: '50000',
            amount_approved: '45000',
            application_id: 'TEST-001',
            payment_id: 'pay_TEST123',
            amount: '500',
            payment_date: new Date().toLocaleDateString(),
            rejection_reason: 'Test rejection reason'
        };

        // Render template with test variables
        const rendered = template.render(testVariables);

        // TODO: Implement actual email sending
        // This would integrate with your email service (Nodemailer, SendGrid, etc.)
        
        console.log('Test email would be sent:', {
            to: test_email,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text
        });

        res.status(200).json({
            success: true,
            message: 'Test email sent successfully',
            data: {
                to: test_email,
                subject: rendered.subject
            }
        });
    } catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test email',
            error: error.message
        });
    }
});

// @desc    Preview email template
// @route   POST /api/v1/admin/email-templates/:id/preview
// @access  Private/Admin
exports.previewEmailTemplate = asyncHandler(async (req, res) => {
    const templateId = req.params.id;
    const { variables = {} } = req.body;

    const template = await EmailTemplate.findByPk(templateId);

    if (!template) {
        return res.status(404).json({
            success: false,
            message: 'Email template not found'
        });
    }

    try {
        // Render template with provided variables
        const rendered = template.render(variables);

        res.status(200).json({
            success: true,
            data: rendered
        });
    } catch (error) {
        console.error('Error previewing template:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to preview template',
            error: error.message
        });
    }
});

// @desc    Get template variables
// @route   GET /api/v1/admin/email-templates/variables
// @access  Private/Admin
exports.getTemplateVariables = asyncHandler(async (req, res) => {
    const variables = {
        application: [
            { name: 'business_name', description: 'Name of the business' },
            { name: 'amount_requested', description: 'Amount requested by applicant' },
            { name: 'amount_approved', description: 'Amount approved by admin' },
            { name: 'application_id', description: 'Unique application ID' },
            { name: 'rejection_reason', description: 'Reason for rejection' },
            { name: 'applicant_name', description: 'Name of the applicant' },
            { name: 'applicant_email', description: 'Email of the applicant' },
            { name: 'application_date', description: 'Date application was submitted' }
        ],
        payment: [
            { name: 'payment_id', description: 'Payment transaction ID' },
            { name: 'amount', description: 'Payment amount' },
            { name: 'payment_date', description: 'Date payment was made' },
            { name: 'payment_method', description: 'Payment method used' }
        ],
        user: [
            { name: 'user_name', description: 'Full name of the user' },
            { name: 'user_email', description: 'Email address of the user' },
            { name: 'user_phone', description: 'Phone number of the user' }
        ],
        system: [
            { name: 'site_name', description: 'Name of the website' },
            { name: 'admin_email', description: 'Admin contact email' },
            { name: 'current_date', description: 'Current date' },
            { name: 'current_time', description: 'Current time' }
        ]
    };

    res.status(200).json({
        success: true,
        data: variables
    });
});
