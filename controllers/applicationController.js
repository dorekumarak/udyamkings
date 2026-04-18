const express = require('express');
const { Application, User } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Get application form configuration
const getFormConfig = async (req, res) => {
    try {
        // Get all active form configurations, ordered by display_order
        const formConfigs = await FormConfig.findAll({
            where: { is_active: true },
            order: [['display_order', 'ASC']],
            raw: true
        });
        
        // Transform the database records into the expected format
        const fields = formConfigs.map(config => ({
            name: config.field_name,
            label: config.field_label,
            type: config.field_type,
            required: config.is_required,
            options: config.options || undefined,
            validation: config.validation_rules || {},
            file_types: config.file_types || undefined,
            multiple: config.multiple_files || false,
            showIf: config.show_condition || undefined,
            placeholder: config.placeholder || undefined,
            description: config.description || undefined,
            min: config.min_value !== null ? Number(config.min_value) : undefined,
            max: config.max_value !== null ? Number(config.max_value) : undefined,
            step: config.step_value !== null ? Number(config.step_value) : undefined,
            maxLength: config.max_length || undefined
        }));
        
        res.json({ fields });
    } catch (error) {
        console.error('Error fetching form configuration:', error);
        res.status(500).json({ message: 'Error loading form configuration' });
    }
};

// Submit application
const submitApplication = async (req, res) => {
    console.log('Submit application called');
    console.log('Is authenticated:', req.isAuthenticated());
    console.log('User:', req.user);
    
    const currentUser = req.isAuthenticated();
    
    if (!currentUser || !currentUser.id) {
        console.log('Authentication failed');
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    console.log('Authentication passed');
    const transaction = await Application.sequelize.transaction();
    
    try {
        const { 
            applicantType, 
            businessName, 
            shortDescription, 
            detailedPlan, 
            amountRequested, 
            fundUsage,
            annualRevenue,
            yearsInOperation,
            preferredContactTime
        } = req.body;
        
        // Validate required fields
        if (!applicantType || !businessName || !shortDescription || !detailedPlan || 
            !amountRequested || !fundUsage || !preferredContactTime) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        console.log('Applicant type:', applicantType);
        
        // Handle file uploads
        const extraDocs = {};
        
        const aadharPath = req.files?.aadharFile ? path.join('/uploads', req.files.aadharFile[0].filename).replace(/\\/g, '/') : null;
        
        console.log('Stored aadharPath:', aadharPath);
        
        if (req.files?.gstFile) extraDocs.gst = path.join('/uploads', req.files.gstFile[0].filename).replace(/\\/g, '/');
        if (req.files?.registrationFile) extraDocs.registration = path.join('/uploads', req.files.registrationFile[0].filename).replace(/\\/g, '/');
        if (req.files?.financialFile && req.files.financialFile.length > 0) extraDocs.financial = path.join('/uploads', req.files.financialFile[0].filename).replace(/\\/g, '/');
        
        console.log('Extra docs:', extraDocs);
        
        const extra_docs_paths = JSON.stringify(extraDocs);
        
        // Check if user already has a draft application
        const existingDraft = await Application.findOne({
            where: { user_id: currentUser.id, application_status: 'draft' },
            transaction
        });

        let application;
        if (existingDraft) {
            // Update existing draft
            await existingDraft.update({
                applicant_type: applicantType,
                business_name: businessName,
                description_short: shortDescription,
                description_long: detailedPlan,
                amount_requested: parseFloat(amountRequested),
                aadhar_path: aadharPath,
                extra_docs_paths: extra_docs_paths,
                preferred_contact_time: preferredContactTime,
                annual_revenue: annualRevenue ? parseFloat(annualRevenue) : null,
                years_in_operation: yearsInOperation ? parseFloat(yearsInOperation) : null,
                application_fee: applicationFee,
                payment_status: 'pending'
            }, { transaction });
            application = existingDraft;
        } else {
            // Create new application
            application = await Application.create({
                user_id: currentUser.id,
                applicant_type: applicantType,
                business_name: businessName,
                description_short: shortDescription,
                description_long: detailedPlan,
                amount_requested: parseFloat(amountRequested),
                aadhar_path: aadharPath,
                extra_docs_paths: extra_docs_paths,
                preferred_contact_time: preferredContactTime,
                annual_revenue: annualRevenue ? parseFloat(annualRevenue) : null,
                years_in_operation: yearsInOperation ? parseFloat(yearsInOperation) : null,
                application_fee: applicationFee,
                application_status: 'draft', // Keep as draft until payment is complete
                payment_status: 'pending'
            }, { transaction });
        }
        
        await transaction.commit();
        
        return res.json({
            success: true,
            message: 'Application submitted successfully',
            files: req.files,
            applicationId: application.id
        });
        
    } catch (error) {
        await transaction.rollback();
        console.error('Error submitting application:', error);
        res.status(500).json({ 
            error: 'Failed to submit application',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get user's applications
const getUserApplications = async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
        const applications = await Application.findAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']],
            attributes: [
                'id',
                'applicant_type',
                'business_name',
                'amount_requested',
                'application_status',
                'payment_status',
                'created_at'
            ]
        });
        
        res.render('applications', {
            title: 'My Applications | UdyamKings',
            applications: applications,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
};

// Get application details
const getApplicationDetails = async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
        const application = await Application.findOne({
            where: req.user.role === 'admin' ? { id: req.params.id } : { id: req.params.id, user_id: req.user.id },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                }
            ]
        });
        
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        
        // Render the application details view
        res.render('application-details', {
            application: application.toJSON(),
            user: req.user.toJSON(),
            csrfToken: req.csrfToken()
        });
    } catch (error) {
        console.error('Error fetching application details:', error);
        res.status(500).json({ error: 'Failed to fetch application details' });
    }
};

// Admin: Get all applications
const getAllApplications = async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        
        const where = {};
        if (status) {
            where.application_status = status;
        }
        
        const { count, rows } = await Application.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        res.json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            data: rows
        });
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
};

// Admin: Update application status
const updateApplicationStatus = async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    const transaction = await Application.sequelize.transaction();
    
    try {
        const { status, adminNotes } = req.body;
        
        if (!['pending', 'accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        const application = await Application.findByPk(req.params.id, { transaction });
        
        if (!application) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Application not found' });
        }
        
        application.application_status = status;
        application.admin_notes = adminNotes || null;
        await application.save({ transaction });
        
        await transaction.commit();
        
        // In a real app, you might want to send an email notification here
        
        return res.json({
            success: true,
            message: 'Application status updated successfully',
            files: req.files
        });
        
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating application status:', error);
        res.status(500).json({ error: 'Failed to update application status' });
    }
};

const applicationStatus = async (req, res) => {
    try {
        const currentUser = req.session.user;
        if (!currentUser) {
            return res.redirect('/login');
        }

        const application = await Application.findOne({
            where: { user_id: currentUser.id },
            order: [['created_at', 'DESC']] // Get latest application
        });

        if (!application) {
            // No application, redirect to apply
            return res.redirect('/apply');
        }

        let statusMessage = '';
        let buttonText = '';
        let buttonLink = '';
        let showStatus = false;

        if (application.payment_status === 'pending') {
            statusMessage = 'You have an incomplete application form. Continue from where you stopped.';
            buttonText = 'Continue Application';
            buttonLink = '/apply';
        } else {
            // Paid, show status
            showStatus = true;
            if (application.application_status === 'pending') {
                statusMessage = 'Your application has been submitted and is under review.';
            } else if (application.application_status === 'accepted') {
                statusMessage = 'Congratulations! Your application has been approved.';
            } else if (application.application_status === 'rejected') {
                statusMessage = 'Unfortunately, your application has been rejected.';
            } else if (application.application_status === 'under_review') {
                statusMessage = 'Your application is currently under review.';
            } else {
                statusMessage = 'Your application status is: ' + application.application_status;
            }
        }

        res.render('application-status', {
            application,
            statusMessage,
            buttonText,
            buttonLink,
            showStatus
        });
    } catch (error) {
        console.error('Error fetching application status:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    getFormConfig,
    submitApplication,
    getUserApplications,
    getApplicationDetails,
    getAllApplications,
    updateApplicationStatus
};
