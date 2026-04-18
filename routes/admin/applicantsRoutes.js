const express = require('express');
const router = express.Router();
const { 
    getApplicants, 
    getApplicantDetails, 
    updateApplicationStatus, 
    exportApplicants 
} = require('../../controllers/admin/applicantsController');
const { requireAdminAuth, requirePermission } = require('../../controllers/adminAuthController');

// Apply admin authentication to all routes
router.use(requireAdminAuth);

// Get applicants with filtering and pagination
router.get('/', requirePermission('applicants', 'read'), getApplicants);

// Get applicant details
router.get('/:id', requirePermission('applicants', 'read'), getApplicantDetails);

// Update application status (accept/reject)
router.put('/:id/status', requirePermission('applicants', 'write'), updateApplicationStatus);

// Export applicants to CSV
router.get('/export/csv', requirePermission('applicants', 'read'), exportApplicants);

module.exports = router;
