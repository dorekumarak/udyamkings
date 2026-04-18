// API ENDPOINT FOR REAL REPORT GENERATION
app.post('/api/admin/reports/generate', async (req, res) => {
  try {
    const { type, format } = req.body;
    console.log('GENERATING REAL REPORT:', type, 'Format:', format);
    
    let reportData = {};
    
    switch(type) {
      case 'summary':
        reportData = await getApplicationSummaryReport();
        break;
      case 'demographics':
        reportData = await getUserDemographicsReport();
        break;
      case 'financial':
        reportData = await getFinancialAnalysisReport();
        break;
      case 'performance':
        reportData = await getPerformanceMetricsReport();
        break;
      case 'monthly':
        reportData = await getMonthlyTrendsReport();
        break;
      case 'regional':
        reportData = await getRegionalAnalysisReport();
        break;
      default:
        reportData = await getApplicationSummaryReport();
    }
    
    return res.status(200).json({
      success: true,
      message: 'Report generated successfully',
      reportData: reportData
    });
    
  } catch (error) {
    console.error('Error generating report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate report: ' + error.message
    });
  }
});

// REAL DATA FUNCTIONS
async function getApplicationSummaryReport() {
  try {
    const applications = await Application.findAll({
      include: [{ model: User, attributes: ['name', 'email'] }]
    });
    
    const totalApps = applications.length;
    const pendingApps = applications.filter(app => app.application_status === 'pending').length;
    const approvedApps = applications.filter(app => app.application_status === 'approved').length;
    const rejectedApps = applications.filter(app => app.application_status === 'rejected').length;
    
    const totalRequested = applications.reduce((sum, app) => sum + (parseFloat(app.amount_requested) || 0), 0);
    const totalApproved = applications
      .filter(app => app.application_status === 'approved')
      .reduce((sum, app) => sum + (parseFloat(app.amount_requested) || 0), 0);
    
    const avgProcessingTime = applications.length > 0 ? 
      applications.reduce((sum, app) => {
        const created = new Date(app.createdAt);
        const updated = new Date(app.updatedAt);
        const days = Math.ceil((updated - created) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0) / applications.length : 0;
    
    return {
      title: 'Application Summary Report',
      data: [
        { metric: 'Total Applications', value: totalApps.toString(), change: 'N/A' },
        { metric: 'Pending Review', value: pendingApps.toString(), change: 'N/A' },
        { metric: 'Approved', value: approvedApps.toString(), change: 'N/A' },
        { metric: 'Rejected', value: rejectedApps.toString(), change: 'N/A' },
        { metric: 'Total Funding Requested', value: '₹' + totalRequested.toLocaleString('en-IN'), change: 'N/A' },
        { metric: 'Total Approved Amount', value: '₹' + totalApproved.toLocaleString('en-IN'), change: 'N/A' },
        { metric: 'Average Processing Time', value: avgProcessingTime.toFixed(1) + ' days', change: 'N/A' },
        { metric: 'Approval Rate', value: totalApps > 0 ? ((approvedApps / totalApps) * 100).toFixed(1) + '%' : '0%', change: 'N/A' }
      ]
    };
  } catch (error) {
    console.error('Error in application summary report:', error);
    return {
      title: 'Application Summary Report',
      data: [
        { metric: 'Error', value: 'Failed to load data', change: 'N/A' }
      ]
    };
  }
}

async function getUserDemographicsReport() {
  try {
    const users = await User.findAll();
    const totalUsers = users.length;
    
    const activeUsers = await Application.count({
      distinct: true,
      col: 'user_id'
    });
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const newUsersThisMonth = users.filter(user => {
      const userDate = new Date(user.createdAt);
      return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear;
    }).length;
    
    const applications = await Application.findAll({
      include: [{ model: User, attributes: ['address', 'city', 'state'] }]
    });
    
    const locations = {};
    applications.forEach(app => {
      const location = app.User?.city || app.User?.address || 'Unknown';
      locations[location] = (locations[location] || 0) + 1;
    });
    
    const topLocation = Object.keys(locations).reduce((a, b) => 
      locations[a] > locations[b] ? a : b, 'Unknown'
    );
    
    return {
      title: 'User Demographics Report',
      data: [
        { metric: 'Total Users', value: totalUsers.toString(), change: 'N/A' },
        { metric: 'Active Users', value: activeUsers.toString(), change: 'N/A' },
        { metric: 'New Users (This Month)', value: newUsersThisMonth.toString(), change: 'N/A' },
        { metric: 'Top Location', value: topLocation, change: 'N/A' },
        { metric: 'User Activity Rate', value: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) + '%' : '0%', change: 'N/A' }
      ]
    };
  } catch (error) {
    console.error('Error in demographics report:', error);
    return {
      title: 'User Demographics Report',
      data: [
        { metric: 'Error', value: 'Failed to load user data', change: 'N/A' }
      ]
    };
  }
}

async function getFinancialAnalysisReport() {
  try {
    const applications = await Application.findAll();
    
    const totalRequested = applications.reduce((sum, app) => sum + (parseFloat(app.amount_requested) || 0), 0);
    const approvedApps = applications.filter(app => app.application_status === 'approved');
    const totalApproved = approvedApps.reduce((sum, app) => sum + (parseFloat(app.amount_requested) || 0), 0);
    
    const approvalRate = applications.length > 0 ? (approvedApps.length / applications.length) * 100 : 0;
    const avgLoanAmount = approvedApps.length > 0 ? totalApproved / approvedApps.length : 0;
    
    const pendingApps = applications.filter(app => app.application_status === 'pending');
    const totalPending = pendingApps.reduce((sum, app) => sum + (parseFloat(app.amount_requested) || 0), 0);
    
    return {
      title: 'Financial Analysis Report',
      data: [
        { metric: 'Total Funding Requested', value: '₹' + totalRequested.toLocaleString('en-IN'), change: 'N/A' },
        { metric: 'Total Approved Amount', value: '₹' + totalApproved.toLocaleString('en-IN'), change: 'N/A' },
        { metric: 'Approval Rate', value: approvalRate.toFixed(1) + '%', change: 'N/A' },
        { metric: 'Average Loan Amount', value: '₹' + Math.round(avgLoanAmount).toLocaleString('en-IN'), change: 'N/A' },
        { metric: 'Pending Disbursement', value: '₹' + totalPending.toLocaleString('en-IN'), change: 'N/A' },
        { metric: 'Applications Processed', value: applications.length.toString(), change: 'N/A' }
      ]
    };
  } catch (error) {
    console.error('Error in financial report:', error);
    return {
      title: 'Financial Analysis Report',
      data: [
        { metric: 'Error', value: 'Failed to load financial data', change: 'N/A' }
      ]
    };
  }
}

async function getPerformanceMetricsReport() {
  try {
    const applications = await Application.findAll();
    
    const processingTimes = applications.map(app => {
      const created = new Date(app.createdAt);
      const updated = new Date(app.updatedAt);
      return Math.ceil((updated - created) / (1000 * 60 * 60 * 24));
    });
    
    const avgProcessingTime = processingTimes.length > 0 ? 
      processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length : 0;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentApps = applications.filter(app => new Date(app.createdAt) >= thirtyDaysAgo);
    const appsPerDay = recentApps.length / 30;
    
    return {
      title: 'Performance Metrics Report',
      data: [
        { metric: 'Avg Processing Time', value: avgProcessingTime.toFixed(1) + ' days', change: 'N/A' },
        { metric: 'Applications/Day (30 days)', value: appsPerDay.toFixed(1), change: 'N/A' },
        { metric: 'Total Processed', value: applications.length.toString(), change: 'N/A' },
        { metric: 'Fast Processing (<1 day)', value: processingTimes.filter(t => t <= 1).length.toString(), change: 'N/A' }
      ]
    };
  } catch (error) {
    console.error('Error in performance report:', error);
    return {
      title: 'Performance Metrics Report',
      data: [
        { metric: 'Error', value: 'Failed to load performance data', change: 'N/A' }
      ]
    };
  }
}

async function getMonthlyTrendsReport() {
  try {
    const applications = await Application.findAll();
    
    const monthlyData = {};
    const currentYear = new Date().getFullYear();
    
    applications.forEach(app => {
      const date = new Date(app.createdAt);
      if (date.getFullYear() === currentYear) {
        const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
      }
    });
    
    const monthlyArray = Object.entries(monthlyData).map(([month, count]) => ({ month, count }));
    monthlyArray.sort((a, b) => new Date(a.month) - new Date(b.month));
    
    const data = monthlyArray.map(item => ({
      metric: item.month + ' Applications',
      value: item.count.toString(),
      change: 'N/A'
    }));
    
    return {
      title: 'Monthly Trends Report',
      data: data.length > 0 ? data : [
        { metric: 'No Data Available', value: 'No applications this year', change: 'N/A' }
      ]
    };
  } catch (error) {
    console.error('Error in monthly trends report:', error);
    return {
      title: 'Monthly Trends Report',
      data: [
        { metric: 'Error', value: 'Failed to load monthly data', change: 'N/A' }
      ]
    };
  }
}

async function getRegionalAnalysisReport() {
  try {
    const applications = await Application.findAll({
      include: [{ model: User, attributes: ['city', 'state', 'address'] }]
    });
    
    const locationData = {};
    
    applications.forEach(app => {
      const location = app.User?.city || app.User?.state || app.User?.address || 'Unknown';
      locationData[location] = (locationData[location] || 0) + 1;
    });
    
    const locationArray = Object.entries(locationData)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const data = locationArray.map(item => ({
      metric: item.location + ' Applications',
      value: item.count.toString(),
      change: 'N/A'
    }));
    
    data.push({
      metric: 'Total Locations',
      value: Object.keys(locationData).length.toString(),
      change: 'N/A'  
    });
    
    return {
      title: 'Regional Analysis Report',
      data: data.length > 0 ? data : [
        { metric: 'No Location Data', value: 'No location information available', change: 'N/A' }
      ]
    };
  } catch (error) {
    console.error('Error in regional analysis report:', error);
    return {
      title: 'Regional Analysis Report',
      data: [
        { metric: 'Error', value: 'Failed to load regional data', change: 'N/A' }
      ]
    };
  }
}
