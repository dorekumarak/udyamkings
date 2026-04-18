const { Application, User, Payment } = require('../../models');
const asyncHandler = require('../../middleware/async');
const { Op } = require('sequelize');

// @desc    Get all applications with filters and pagination
// @route   GET /api/v1/admin/applications
// @access  Private/Admin
exports.getApplications = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        status,
        type,
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build where clause
    const whereClause = {};
    
    if (status) {
        whereClause.application_status = status;
    }
    
    if (type) {
        whereClause.applicant_type = type;
    }
    
    if (search) {
        whereClause[Op.or] = [
            { business_name: { [Op.like]: `%${search}%` } },
            { '$User.name$': { [Op.like]: `%${search}%` } },
            { '$User.email$': { [Op.like]: `%${search}%` } },
            { '$User.mobile$': { [Op.like]: `%${search}%` } }
        ];
    }

    const { count, rows: applications } = await Application.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: User,
                attributes: ['id', 'name', 'email', 'mobile']
            },
            {
                model: Payment,
                attributes: ['id', 'amount', 'status', 'razorpay_payment_id', 'createdAt'],
                required: false
            }
        ],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
    });

    res.status(200).json({
        success: true,
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        applications
    });
});

// @desc    Get single application by ID
// @route   GET /api/v1/admin/applications/:id
// @access  Private/Admin
exports.getApplication = asyncHandler(async (req, res) => {
    const application = await Application.findByPk(req.params.id, {
        include: [
            {
                model: User,
                attributes: ['id', 'name', 'email', 'mobile', 'city']
            },
            {
                model: Payment,
                attributes: ['id', 'amount', 'status', 'razorpay_payment_id', 'createdAt', 'refund_amount', 'refund_notes']
            }
        ]
    });

    if (!application) {
        return res.status(404).json({
            success: false,
            message: 'Application not found'
        });
    }

    res.status(200).json({
        success: true,
        data: application
    });
});

// @desc    Update application status
// @route   PUT /api/v1/admin/applications/:id/status
// @access  Private/Admin
exports.updateApplicationStatus = asyncHandler(async (req, res) => {
    const { status, notes, internal_score } = req.body;
    
    const application = await Application.findByPk(req.params.id);
    
    if (!application) {
        return res.status(404).json({
            success: false,
            message: 'Application not found'
        });
    }

    // Update application
    application.application_status = status;
    if (notes) application.admin_notes = notes;
    if (internal_score !== undefined) application.internal_evaluation_score = internal_score;
    
    await application.save();

    // TODO: Send email notification to applicant based on status
    // This would integrate with email templates

    res.status(200).json({
        success: true,
        message: 'Application status updated successfully',
        data: application
    });
});

// @desc    Add admin note to application
// @route   POST /api/v1/admin/applications/:id/notes
// @access  Private/Admin
exports.addNote = asyncHandler(async (req, res) => {
    const { note } = req.body;
    
    const application = await Application.findByPk(req.params.id);
    
    if (!application) {
        return res.status(404).json({
            success: false,
            message: 'Application not found'
        });
    }

    // Initialize notes array if it doesn't exist
    let notes = [];
    if (application.admin_notes) {
        try {
            notes = typeof application.admin_notes === 'string' 
                ? JSON.parse(application.admin_notes) 
                : application.admin_notes;
        } catch (e) {
            notes = [];
        }
    }
    
    // Add new note
    notes.push({
        content: note,
        created_by: req.user.name,
        created_at: new Date()
    });
    
    application.admin_notes = notes;
    await application.save();

    res.status(200).json({
        success: true,
        message: 'Note added successfully',
        data: notes
    });
});

// @desc    Delete application
// @route   DELETE /api/v1/admin/applications/:id
// @access  Private/Admin
exports.deleteApplication = asyncHandler(async (req, res) => {
    const application = await Application.findByPk(req.params.id);
    
    if (!application) {
        return res.status(404).json({
            success: false,
            message: 'Application not found'
        });
    }

    await application.destroy();

    res.status(200).json({
        success: true,
        message: 'Application deleted successfully'
    });
});

// @desc    Export applications to CSV
// @route   GET /api/v1/admin/applications/export
// @access  Private/Admin
exports.exportApplications = asyncHandler(async (req, res) => {
    const { status, type, startDate, endDate } = req.query;
    
    // Build where clause
    const whereClause = {};
    
    if (status) {
        whereClause.application_status = status;
    }
    
    if (type) {
        whereClause.applicant_type = type;
    }
    
    if (startDate && endDate) {
        whereClause.createdAt = {
            [Op.between]: [new Date(startDate), new Date(endDate)]
        };
    }

    const applications = await Application.findAll({
        where: whereClause,
        include: [
            {
                model: User,
                attributes: ['name', 'email', 'mobile', 'city']
            },
            {
                model: Payment,
                attributes: ['amount', 'status', 'razorpay_payment_id']
            }
        ],
        order: [['createdAt', 'DESC']]
    });

    // Convert to CSV
    const csv = convertToCSV(applications);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=applications.csv');
    res.send(csv);
});

// Helper function to convert applications to CSV
function convertToCSV(applications) {
    const headers = [
        'ID',
        'Business Name',
        'Applicant Name',
        'Email',
        'Mobile',
        'City',
        'Applicant Type',
        'Amount Requested',
        'Payment Status',
        'Application Status',
        'Created Date'
    ];
    
    const rows = applications.map(app => [
        app.id,
        app.business_name,
        app.User.name,
        app.User.email,
        app.User.mobile || '',
        app.User.city || '',
        app.applicant_type,
        app.amount_requested,
        app.Payment ? app.Payment.status : 'N/A',
        app.application_status,
        app.createdAt.toISOString().split('T')[0]
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}
