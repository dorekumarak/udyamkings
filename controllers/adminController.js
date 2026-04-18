const { Application, User, FormConfig } = require('../models');
const { Op } = require('sequelize');

// Admin Dashboard
const getDashboard = async (req, res) => {
    try {
        // Get application statistics
        const totalApplications = await Application.count();
        const pendingApplications = await Application.count({
            where: { application_status: 'pending' }
        });
        const acceptedApplications = await Application.count({
            where: { application_status: 'accepted' }
        });
        const rejectedApplications = await Application.count({
            where: { application_status: 'rejected' }
        });

        // Get recent applications
        const recentApplications = await Application.findAll({
            where: {
                application_status: {
                    [Op.in]: ['pending', 'under_review', 'accepted', 'rejected']
                }
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email']
            }],
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        // Format data for the dashboard
        const stats = {
            total_applications: totalApplications,
            pending_applications: pendingApplications,
            accepted_applications: acceptedApplications,
            rejected_applications: rejectedApplications
        };

        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            page: 'dashboard',
            stats,
            recentApplications,
            layout: 'admin-layout'
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        req.flash('error_msg', 'Error loading dashboard data');
        res.redirect('/admin');
    }
};

// List all applications
const listApplications = async (req, res) => {
    try {
        const { status } = req.query;
        
        let whereClause = {};
        if (status && status !== 'all') {
            whereClause.application_status = status;
        }

        const applications = await Application.findAll({
            where: whereClause,
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email']
            }],
            order: [['createdAt', 'DESC']]
        });

        res.render('admin/applications', {
            title: 'Manage Applications',
            page: 'applications',
            applications,
            statusFilter: status || 'all',
            layout: 'admin-layout'
        });
    } catch (error) {
        console.error('Error fetching applications:', error);
        req.flash('error_msg', 'Error loading applications');
        res.redirect('/admin');
    }
};

// View application details
const viewApplication = async (req, res) => {
    try {
        const { id } = req.params;
        
        const application = await Application.findOne({
            where: { id },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email', 'mobile', 'city', 'state', 'pincode']
            }]
        });

        if (!application) {
            req.flash('error_msg', 'Application not found');
            return res.redirect('/admin/applications');
        }

        // Parse JSON fields
        if (application.extra_docs_paths) {
            try {
                application.extra_docs_paths = JSON.parse(application.extra_docs_paths);
            } catch (e) {
                console.error('Error parsing extra_docs_paths:', e);
                application.extra_docs_paths = {};
            }
        } else {
            application.extra_docs_paths = {};
        }

        res.json({application: application ? application.toJSON() : null, user: req.user.toJSON()});
    } catch (error) {
        console.error('Error fetching application:', error);
        req.flash('error_msg', 'Error loading application details');
        res.redirect('/admin/applications');
    }
};

// Update application status
const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_notes } = req.body;
        
        const application = await Application.findByPk(id);
        
        if (!application) {
            return res.status(404).json({ success: false, error: 'Application not found' });
        }
        
        // Update application status
        application.application_status = status;
        application.admin_notes = admin_notes || null;
        application.reviewed_at = new Date();
        
        await application.save();
        
        // In a real app, you might want to send email notifications here
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating application status:', error);
        res.status(500).json({ success: false, error: 'Error updating application status' });
    }
};

// Delete application
const deleteApplication = async (req, res) => {
    try {
        const { id } = req.params;
        
        const application = await Application.findByPk(id);
        
        if (!application) {
            req.flash('error_msg', 'Application not found');
            return res.redirect('/admin/applications');
        }
        
        // In a real app, you might want to delete associated files here
        
        await application.destroy();
        
        req.flash('success_msg', 'Application deleted successfully');
        res.redirect('/admin/applications');
    } catch (error) {
        console.error('Error deleting application:', error);
        req.flash('error_msg', 'Error deleting application');
        res.redirect('/admin/applications');
    }
};

// Form Configuration - View
const getFormConfig = async (req, res) => {
    try {
        // Get form configuration from database
        let formConfig = await FormConfig.findOne();
        
        // If no config exists, create a default one
        if (!formConfig) {
            formConfig = await createDefaultFormConfig();
        }
        
        // Parse the fields if it's a string
        if (typeof formConfig.fields === 'string') {
            formConfig.fields = JSON.parse(formConfig.fields);
        }
        
        res.render('admin/form-config', {
            title: 'Form Configuration',
            page: 'settings',
            formConfig,
            layout: 'admin-layout',
            csrfToken: req.csrfToken()
        });
    } catch (error) {
        console.error('Error loading form configuration:', error);
        req.flash('error_msg', 'Error loading form configuration');
        res.redirect('/admin');
    }
};

// Form Configuration - Add/Update Field
const saveFormField = async (req, res) => {
    try {
        const { fieldId } = req.params;
        const fieldData = req.body;
        
        // Get current form config
        let formConfig = await FormConfig.findOne();
        if (!formConfig) {
            formConfig = await createDefaultFormConfig();
        }
        
        // Parse fields
        const fields = typeof formConfig.fields === 'string' 
            ? JSON.parse(formConfig.fields) 
            : formConfig.fields;
        
        if (fieldId) {
            // Update existing field
            const fieldIndex = fields.findIndex(f => f.id === fieldId);
            if (fieldIndex !== -1) {
                // Preserve some existing values
                fieldData.id = fieldId;
                if (!fieldData.createdAt) fieldData.createdAt = fields[fieldIndex].createdAt || new Date();
                fieldData.updatedAt = new Date();
                
                fields[fieldIndex] = { ...fields[fieldIndex], ...fieldData };
            }
        } else {
            // Add new field
            const newField = {
                id: `field_${Date.now()}`,
                ...fieldData,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            // Set order to be the last in its section
            const sectionFields = fields.filter(f => f.section === fieldData.section);
            newField.order = sectionFields.length;
            
            fields.push(newField);
        }
        
        // Save updated config
        formConfig.fields = fields;
        await formConfig.save();
        
        res.json({ 
            success: true, 
            message: fieldId ? 'Field updated successfully' : 'Field added successfully'
        });
    } catch (error) {
        console.error('Error saving form field:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error saving form field',
            details: error.message
        });
    }
};

// Form Configuration - Delete Field
const deleteFormField = async (req, res) => {
    try {
        const { fieldId } = req.params;
        
        // Get current form config
        const formConfig = await FormConfig.findOne();
        if (!formConfig) {
            return res.status(404).json({ success: false, error: 'Form configuration not found' });
        }
        
        // Parse fields
        const fields = typeof formConfig.fields === 'string' 
            ? JSON.parse(formConfig.fields) 
            : formConfig.fields;
        
        // Remove the field
        const updatedFields = fields.filter(field => field.id !== fieldId);
        
        // Save updated config
        formConfig.fields = updatedFields;
        await formConfig.save();
        
        res.json({ success: true, message: 'Field deleted successfully' });
    } catch (error) {
        console.error('Error deleting form field:', error);
        res.status(500).json({ success: false, error: 'Error deleting form field' });
    }
};

// Form Configuration - Reorder Fields
const reorderFields = async (req, res) => {
    try {
        const { updates } = req.body;
        
        if (!updates || !Array.isArray(updates)) {
            return res.status(400).json({ success: false, error: 'Invalid update data' });
        }
        
        // Get current form config
        const formConfig = await FormConfig.findOne();
        if (!formConfig) {
            return res.status(404).json({ success: false, error: 'Form configuration not found' });
        }
        
        // Parse fields
        const fields = typeof formConfig.fields === 'string' 
            ? JSON.parse(formConfig.fields) 
            : formConfig.fields;
        
        // Update field orders
        updates.forEach(update => {
            const field = fields.find(f => f.id === update.id);
            if (field) {
                field.section = update.section;
                field.order = update.order;
            }
        });
        
        // Save updated config
        formConfig.fields = fields;
        await formConfig.save();
        
        res.json({ success: true, message: 'Field order updated successfully' });
    } catch (error) {
        console.error('Error reordering fields:', error);
        res.status(500).json({ success: false, error: 'Error reordering fields' });
    }
};

// Form Configuration - Reset to Default
const resetFormConfig = async (req, res) => {
    try {
        await createDefaultFormConfig(true);
        res.json({ success: true, message: 'Form configuration reset to default' });
    } catch (error) {
        console.error('Error resetting form configuration:', error);
        res.status(500).json({ success: false, error: 'Error resetting form configuration' });
    }
};

// Helper function to create default form configuration
const createDefaultFormConfig = async (force = false) => {
    const defaultConfig = {
        fields: [
            // Basic Information
            {
                id: 'applicant_type',
                type: 'radio',
                label: 'Applicant Type',
                name: 'applicant_type',
                section: 'basic',
                required: true,
                options: [
                    { label: 'Startup / New Business', value: 'fresh_startup' },
                    { label: 'Existing Business Expansion', value: 'existing_business' }
                ],
                order: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'business_name',
                type: 'text',
                label: 'Business Name',
                name: 'business_name',
                section: 'basic',
                required: true,
                placeholder: 'Enter your business name',
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'description_short',
                type: 'textarea',
                label: 'Short Description',
                name: 'description_short',
                section: 'basic',
                required: true,
                placeholder: 'Briefly describe your business (max 1000 characters)',
                maxlength: 1000,
                order: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'description_long',
                type: 'rich_text',
                label: 'Detailed Business Plan',
                name: 'description_long',
                section: 'basic',
                required: true,
                placeholder: 'Provide a detailed business plan',
                order: 3,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'amount_requested',
                type: 'number',
                label: 'Amount Requested (₹)',
                name: 'amount_requested',
                section: 'basic',
                required: true,
                placeholder: 'Enter the amount you are requesting',
                min: 10000,
                step: 1000,
                order: 4,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'preferred_contact_time',
                type: 'text',
                label: 'Preferred Contact Time',
                name: 'preferred_contact_time',
                section: 'basic',
                required: false,
                placeholder: 'e.g., Weekdays 9 AM - 5 PM',
                order: 5,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            
            // Business Information (for existing businesses)
            {
                id: 'annual_revenue',
                type: 'number',
                label: 'Annual Revenue (₹)',
                name: 'annual_revenue',
                section: 'business',
                required: false,
                placeholder: 'Enter your annual revenue',
                min: 0,
                step: 1000,
                order: 0,
                conditional: {
                    enabled: true,
                    field: 'applicant_type',
                    operator: '===',
                    value: 'existing_business',
                    inverse: false
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'years_in_operation',
                type: 'number',
                label: 'Years in Operation',
                name: 'years_in_operation',
                section: 'business',
                required: false,
                placeholder: 'Enter years in operation',
                min: 0,
                step: 0.5,
                order: 1,
                conditional: {
                    enabled: true,
                    field: 'applicant_type',
                    operator: '===',
                    value: 'existing_business',
                    inverse: false
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            
            // Documents
            {
                id: 'aadhar_card',
                type: 'file',
                label: 'Aadhar Card',
                name: 'aadharFile',
                section: 'documents',
                required: true,
                accept: 'image/*,.pdf',
                multiple: false,
                maxSize: 5, // MB
                order: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'gst_certificate',
                type: 'file',
                label: 'GST Certificate',
                name: 'gstFile',
                section: 'documents',
                required: false,
                accept: '.pdf',
                multiple: false,
                maxSize: 5, // MB
                order: 1,
                conditional: {
                    enabled: true,
                    field: 'applicant_type',
                    operator: '===',
                    value: 'existing_business',
                    inverse: false
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'business_registration',
                type: 'file',
                label: 'Business Registration',
                name: 'registrationFile',
                section: 'documents',
                required: false,
                accept: '.pdf',
                multiple: false,
                maxSize: 5, // MB
                order: 2,
                conditional: {
                    enabled: true,
                    field: 'applicant_type',
                    operator: '===',
                    value: 'existing_business',
                    inverse: false
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'financial_statements',
                type: 'file',
                label: 'Financial Statements',
                name: 'financialFile',
                section: 'documents',
                required: false,
                accept: '.pdf,.doc,.docx,.xls,.xlsx',
                multiple: true,
                maxSize: 10, // MB
                order: 3,
                conditional: {
                    enabled: true,
                    field: 'applicant_type',
                    operator: '===',
                    value: 'existing_business',
                    inverse: false
                },
                helpText: 'Upload last 2 years P&L statements or bank statements',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]
    };
    
    if (force) {
        // Delete existing config if forcing reset
        await FormConfig.destroy({ where: {} });
    }
    
    // Create or update the config
    const [config] = await FormConfig.upsert({
        id: 1, // Assuming single config with ID 1
        fields: JSON.stringify(defaultConfig.fields),
        createdAt: new Date(),
        updatedAt: new Date()
    }, {
        returning: true
    });
    
    return config;
};

module.exports = {
    getDashboard,
    listApplications,
    viewApplication,
    updateApplicationStatus,
    deleteApplication,
    getFormConfig,
    saveFormField,
    deleteFormField,
    reorderFields,
    resetFormConfig
};
