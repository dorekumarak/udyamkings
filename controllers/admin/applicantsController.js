const { Application, User } = require('../../models');
const { Op } = require('sequelize');
const logger = require('../../utils/logger');

// Get all applicants with pagination and filtering
const getApplicants = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search = '', 
            type = '', 
            payment_status = '', 
            application_status = '' 
        } = req.query;

        const offset = (page - 1) * limit;
        
        // Build where clause
        const where = {};
        
        if (search) {
            where[Op.or] = [
                { '$user.name$': { [Op.like]: `%${search}%` } },
                { '$user.email$': { [Op.like]: `%${search}%` } },
                { business_name: { [Op.like]: `%${search}%` } }
            ];
        }
        
        if (type) {
            where.applicant_type = type;
        }
        
        if (payment_status) {
            where.payment_status = payment_status;
        }
        
        if (application_status) {
            where.application_status = application_status;
        }

        const { count, rows: applicants } = await Application.findAndCountAll({
            where,
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email', 'phone']
            }],
            attributes: [
                'id', 'applicant_type', 'business_name', 'amount_requested',
                'payment_status', 'application_status', 'created_at', 'updated_at'
            ],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: applicants,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        logger.error('Error fetching applicants:', {
            error: error.message,
            stack: error.stack,
            adminId: req.admin?.id
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applicants'
        });
    }
};

// Get applicant details
const getApplicantDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const applicant = await Application.findByPk(id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email', 'phone']
            }]
        });

        if (!applicant) {
            return res.status(404).json({
                success: false,
                message: 'Applicant not found'
            });
        }

        res.json({
            success: true,
            data: applicant
        });
    } catch (error) {
        logger.error('Error fetching applicant details:', {
            error: error.message,
            stack: error.stack,
            adminId: req.admin?.id,
            applicantId: req.params.id
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applicant details'
        });
    }
};

// Update application status
const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, evaluation_score } = req.body;

        const application = await Application.findByPk(id);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        const updateData = {
            application_status: status,
            updated_at: new Date()
        };

        if (notes) {
            updateData.admin_notes = notes;
        }

        if (evaluation_score !== undefined) {
            updateData.evaluation_score = evaluation_score;
        }

        await Application.update(updateData, { where: { id } });

        // TODO: Send email to applicant based on status

        res.json({
            success: true,
            message: `Application ${status} successfully`
        });
    } catch (error) {
        logger.error('Error updating application status:', {
            error: error.message,
            stack: error.stack,
            adminId: req.admin?.id,
            applicantId: req.params.id
        });
        res.status(500).json({
            success: false,
            message: 'Failed to update application status'
        });
    }
};

// Export applicants to CSV
const exportApplicants = async (req, res) => {
    try {
        const { type, payment_status, application_status } = req.query;
        
        const where = {};
        if (type) where.applicant_type = type;
        if (payment_status) where.payment_status = payment_status;
        if (application_status) where.application_status = application_status;

        const applicants = await Application.findAll({
            where,
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email', 'phone']
            }],
            order: [['created_at', 'DESC']]
        });

        // Convert to CSV format
        const csv = [
            'ID,Name,Email,Phone,Applicant Type,Business Name,Amount Requested,Payment Status,Application Status,Created Date'
        ];

        applicants.forEach(app => {
            csv.push([
                app.id,
                `"${app.user?.name || ''}"`,
                `"${app.user?.email || ''}"`,
                `"${app.user?.phone || ''}"`,
                app.applicant_type,
                `"${app.business_name || ''}"`,
                app.amount_requested || 0,
                app.payment_status,
                app.application_status,
                app.created_at?.toISOString().split('T')[0] || ''
            ].join(','));
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=applicants.csv');
        res.send(csv.join('\n'));
    } catch (error) {
        logger.error('Error exporting applicants:', {
            error: error.message,
            stack: error.stack,
            adminId: req.admin?.id
        });
        res.status(500).json({
            success: false,
            message: 'Failed to export applicants'
        });
    }
};

module.exports = {
    getApplicants,
    getApplicantDetails,
    updateApplicationStatus,
    exportApplicants
};
