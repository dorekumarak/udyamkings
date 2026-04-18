const { User, Content } = require('../../models');
const asyncHandler = require('../../middleware/async');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// @desc    Get all settings
// @route   GET /api/v1/admin/settings
// @access  Private/Admin
exports.getSettings = asyncHandler(async (req, res) => {
    // Get system settings from database
    const settings = await Content.findAll({
        where: { category: 'settings' },
        order: [['key', 'ASC']]
    });

    // Format settings as key-value pairs
    const formattedSettings = {};
    settings.forEach(setting => {
        formattedSettings[setting.key] = {
            id: setting.id,
            value: setting.type === 'json' 
                ? (typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value)
                : setting.value,
            type: setting.type,
            description: setting.description
        };
    });

    // Add system info
    const systemInfo = {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        totalUsers: await User.count(),
        adminUsers: await User.count({ where: { role: 'admin' } })
    };

    res.status(200).json({
        success: true,
        data: {
            settings: formattedSettings,
            systemInfo
        }
    });
});

// @desc    Update setting
// @route   PUT /api/v1/admin/settings/:key
// @access  Private/Admin
exports.updateSetting = asyncHandler(async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;

    const setting = await Content.findOne({
        where: { key, category: 'settings' }
    });

    if (!setting) {
        return res.status(404).json({
            success: false,
            message: 'Setting not found'
        });
    }

    // Parse value if it's JSON
    let parsedValue = value;
    if (setting.type === 'json' && typeof value === 'string') {
        try {
            parsedValue = JSON.parse(value);
        } catch (e) {
            return res.status(400).json({
                success: false,
                message: 'Invalid JSON format'
            });
        }
    }

    await setting.update({ value: parsedValue });

    res.status(200).json({
        success: true,
        message: 'Setting updated successfully',
        data: setting
    });
});

// @desc    Get admin users
// @route   GET /api/v1/admin/settings/admin-users
// @access  Private/Admin
exports.getAdminUsers = asyncHandler(async (req, res) => {
    const adminUsers = await User.findAll({
        where: { role: 'admin' },
        attributes: ['id', 'name', 'email', 'role', 'createdAt'],
        order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
        success: true,
        data: adminUsers
    });
});

// @desc    Create admin user
// @route   POST /api/v1/admin/settings/admin-users
// @access  Private/Admin
exports.createAdminUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({
        where: { email }
    });

    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'Email already exists'
        });
    }

    const adminUser = await User.create({
        name,
        email,
        password,
        role: 'admin',
        email_verified: true
    });

    res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        data: {
            id: adminUser.id,
            name: adminUser.name,
            email: adminUser.email,
            role: adminUser.role
        }
    });
});

// @desc    Update admin user
// @route   PUT /api/v1/admin/settings/admin-users/:id
// @access  Private/Admin
exports.updateAdminUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email, password } = req.body;

    const adminUser = await User.findByPk(id);

    if (!adminUser) {
        return res.status(404).json({
            success: false,
            message: 'Admin user not found'
        });
    }

    if (adminUser.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'User is not an admin'
        });
    }

    // Check if email already exists (excluding current user)
    if (email && email !== adminUser.email) {
        const existingUser = await User.findOne({
            where: { 
                email,
                id: { [Op.ne]: id }
            }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = password;

    await adminUser.update(updateData);

    res.status(200).json({
        success: true,
        message: 'Admin user updated successfully',
        data: {
            id: adminUser.id,
            name: adminUser.name,
            email: adminUser.email,
            role: adminUser.role
        }
    });
});

// @desc    Delete admin user
// @route   DELETE /api/v1/admin/settings/admin-users/:id
// @access  Private/Admin
exports.deleteAdminUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const adminUser = await User.findByPk(id);

    if (!adminUser) {
        return res.status(404).json({
            success: false,
            message: 'Admin user not found'
        });
    }

    if (adminUser.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'User is not an admin'
        });
    }

    // Prevent deletion of the last admin
    const adminCount = await User.count({
        where: { role: 'admin' }
    });

    if (adminCount <= 1) {
        return res.status(400).json({
            success: false,
            message: 'Cannot delete the last admin user'
        });
    }

    await adminUser.destroy();

    res.status(200).json({
        success: true,
        message: 'Admin user deleted successfully'
    });
});

// @desc    Backup database
// @route   POST /api/v1/admin/settings/backup
// @access  Private/Admin
exports.backupDatabase = asyncHandler(async (req, res) => {
    const { includeFiles = false } = req.body;

    try {
        // This is a simplified backup implementation
        // In production, you'd want to use proper database backup tools
        const backupData = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            data: {
                users: await User.findAll({
                    attributes: { exclude: ['password'] }
                }),
                content: await Content.findAll()
            }
        };

        const backupFileName = `backup-${Date.now()}.json`;
        const backupPath = path.join(__dirname, '../../../backups', backupFileName);

        // Ensure backups directory exists
        const backupsDir = path.dirname(backupPath);
        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir, { recursive: true });
        }

        // Write backup file
        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

        res.status(200).json({
            success: true,
            message: 'Database backup created successfully',
            data: {
                fileName: backupFileName,
                path: backupPath,
                size: fs.statSync(backupPath).size
            }
        });
    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create backup',
            error: error.message
        });
    }
});

// @desc    Get backup files
// @route   GET /api/v1/admin/settings/backups
// @access  Private/Admin
exports.getBackups = asyncHandler(async (req, res) => {
    const backupsDir = path.join(__dirname, '../../../backups');
    
    try {
        const files = fs.existsSync(backupsDir) 
            ? fs.readdirSync(backupsDir)
                .filter(file => file.endsWith('.json'))
                .map(file => {
                    const filePath = path.join(backupsDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        name: file,
                        path: filePath,
                        size: stats.size,
                        created: stats.birthtime.toISOString()
                    };
                })
                .sort((a, b) => new Date(b.created) - new Date(a.created))
            : [];

        res.status(200).json({
            success: true,
            data: files
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get backup files',
            error: error.message
        });
    }
});

// @desc    Download backup
// @route   GET /api/v1/admin/settings/backups/:filename
// @access  Private/Admin
exports.downloadBackup = asyncHandler(async (req, res) => {
    const { filename } = req.params;
    const backupPath = path.join(__dirname, '../../../backups', filename);

    // Security check - ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({
            success: false,
            message: 'Invalid filename'
        });
    }

    if (!fs.existsSync(backupPath)) {
        return res.status(404).json({
            success: false,
            message: 'Backup file not found'
        });
    }

    res.download(backupPath, filename);
});

// @desc    Delete backup
// @route   DELETE /api/v1/admin/settings/backups/:filename
// @access  Private/Admin
exports.deleteBackup = asyncHandler(async (req, res) => {
    const { filename } = req.params;
    const backupPath = path.join(__dirname, '../../../backups', filename);

    // Security check
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({
            success: false,
            message: 'Invalid filename'
        });
    }

    if (!fs.existsSync(backupPath)) {
        return res.status(404).json({
            success: false,
            message: 'Backup file not found'
        });
    }

    fs.unlinkSync(backupPath);

    res.status(200).json({
        success: true,
        message: 'Backup deleted successfully'
    });
});

// @desc    Change current admin password
// @route   POST /api/v1/admin/settings/change-password
// @access  Private/Admin
exports.changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Get current admin user
    const adminUser = await User.findByPk(req.user.id);

    if (!adminUser) {
        return res.status(404).json({
            success: false,
            message: 'Admin user not found'
        });
    }

    // Verify current password
    const isCurrentPasswordValid = await adminUser.validPassword(currentPassword);
    if (!isCurrentPasswordValid) {
        return res.status(400).json({
            success: false,
            message: 'Current password is incorrect'
        });
    }

    // Update password
    adminUser.password = newPassword;
    await adminUser.save();

    res.status(200).json({
        success: true,
        message: 'Password changed successfully'
    });
});
