const { Application, Payment, User } = require('../../models');
const asyncHandler = require('../../middleware/async');

// @desc    Get dashboard statistics
// @route   GET /api/v1/admin/dashboard/stats
// @access  Private/Admin
exports.getDashboardStats = asyncHandler(async (req, res) => {
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

    // Get payment statistics
    const payments = await Payment.findAll({
        where: { status: 'captured' },
        attributes: ['amount']
    });
    
    const totalRevenue = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

    // Get recent applications
    const recentApplications = await Application.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [
            {
                model: User,
                attributes: ['name', 'email']
            }
        ]
    });

    // Get monthly application data for chart
    const monthlyData = await Application.findAll({
        attributes: [
            [require('sequelize').fn('MONTH', require('sequelize').col('createdAt')), 'month'],
            [require('sequelize').fn('YEAR', require('sequelize').col('createdAt')), 'year'],
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        where: {
            createdAt: {
                [require('sequelize').Op.gte]: new Date(new Date().getFullYear(), 0, 1)
            }
        },
        group: [
            require('sequelize').fn('MONTH', require('sequelize').col('createdAt')),
            require('sequelize').fn('YEAR', require('sequelize').col('createdAt'))
        ],
        order: [
            [require('sequelize').fn('YEAR', require('sequelize').col('createdAt')), 'ASC'],
            [require('sequelize').fn('MONTH', require('sequelize').col('createdAt')), 'ASC']
        ]
    });

    res.status(200).json({
        success: true,
        data: {
            total_applications: totalApplications,
            pending_applications: pendingApplications,
            accepted_applications: acceptedApplications,
            rejected_applications: rejectedApplications,
            total_revenue: totalRevenue / 100, // Convert from paise to rupees
            recent_applications: recentApplications,
            monthly_data: monthlyData
        }
    });
});

// @desc    Render dashboard page
// @route   GET /admin/dashboard
// @access  Private/Admin
exports.getDashboard = asyncHandler(async (req, res) => {
    // Get basic stats for the dashboard
    const stats = await getDashboardStats();
    
    // Get recent applications
    const recentApplications = await Application.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        include: [
            {
                model: User,
                attributes: ['name', 'email']
            }
        ]
    });

    res.render('admin/dashboard', {
        title: 'Dashboard | UdyamKings Admin',
        page: 'dashboard',
        pageTitle: 'Dashboard',
        stats: {
            total_applications: stats.total_applications,
            pending_applications: stats.pending_applications,
            accepted_applications: stats.accepted_applications,
            rejected_applications: stats.rejected_applications
        },
        recentApplications: recentApplications,
        user: req.user
    });
});

// Helper function to get dashboard stats
const getDashboardStats = async () => {
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

    // Get payment statistics
    const payments = await Payment.findAll({
        where: { status: 'captured' },
        attributes: ['amount']
    });
    
    const totalRevenue = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

    return {
        total_applications: totalApplications,
        pending_applications: pendingApplications,
        accepted_applications: acceptedApplications,
        rejected_applications: rejectedApplications,
        total_revenue: totalRevenue / 100 // Convert from paise to rupees
    };
};
