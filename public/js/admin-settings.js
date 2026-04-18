// Admin Settings JavaScript - Wrapped in IIFE to prevent conflicts
(function() {
    'use strict';

    // Global variables
    let adminSettingsData = {};
    let adminUsersData = [];
    let backupData = [];
    let allSettingsData = [];

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        loadSettings();
        loadAdminUsers();
        loadBackups();

        // Tab change handler
        document.querySelectorAll('#settingsTabs a[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', function (e) {
                if (e.target.getAttribute('href') === '#admins') {
                    loadAdminUsers();
                }
                if (e.target.getAttribute('href') === '#backups') {
                    loadBackups();
                }
                if (e.target.getAttribute('href') === '#manage-settings') {
                    loadAllSettings();
                }
            });
        });

        // Save admin user button
        document.getElementById('saveAdminUserBtn')?.addEventListener('click', function() {
            saveAdminUser();
        });

        // Save setting button
        document.getElementById('saveSettingBtn')?.addEventListener('click', function() {
            saveSetting();
        });

        // Create backup button
        document.getElementById('createBackupBtn')?.addEventListener('click', function() {
            createBackup();
        });
    });

    // Load settings (for the form fields)
    function loadSettings() {
        fetch('/api/admin/settings')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                adminSettingsData = data.data.settings;
                populateSettingsFields();
            }
        })
        .catch(error => {
            console.error('Error loading settings:', error);
            showError('Failed to load settings');
        });
    }

    // Load all settings (for the manage settings table)
    function loadAllSettings() {
        fetch('/api/admin/settings')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const settingsArray = Object.keys(data.data.settings).map(key => ({
                    key: key,
                    ...data.data.settings[key]
                }));
                allSettingsData = settingsArray;
                renderAllSettings();
            }
        })
        .catch(error => {
            console.error('Error loading all settings:', error);
            showError('Failed to load settings');
        });
    }

    // Populate settings fields (for the form tabs)
    function populateSettingsFields() {
        Object.keys(adminSettingsData).forEach(key => {
            const setting = adminSettingsData[key];
            const field = document.querySelector(`[data-key="${key}"]`);

            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = setting.value;
                } else {
                    field.value = setting.value;
                }
                field.setAttribute('data-id', setting.id);
            }
        });
    }

    // Render all settings in table
    function renderAllSettings() {
        const tbody = document.getElementById('settingsTableBody');

        if (!tbody) return;

        if (allSettingsData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No settings found</td></tr>';
            return;
        }

        const settingsHtml = allSettingsData.map(setting => `
            <tr>
                <td>${setting.key}</td>
                <td>${formatSettingValue(setting.value)}</td>
                <td><span class="badge bg-secondary">${setting.type}</span></td>
                <td>${setting.description || ''}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="window.adminSettings.editSetting('${setting.key}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="window.adminSettings.deleteSetting('${setting.key}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = settingsHtml;
    }

    // Update setting (for form fields)
    function updateSetting(field) {
        const key = field.getAttribute('data-key');
        const value = field.type === 'checkbox' ? field.checked : field.value;
        const id = field.getAttribute('data-id');

        if (id) {
            fetch(`/api/admin/settings/${key}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ value })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showSuccess('Setting updated successfully');
                    loadSettings(); // Reload settings data
                }
            })
            .catch(error => {
                console.error('Error updating setting:', error);
                showError('Failed to update setting');
            });
        }
    }

    // Save setting (for add/edit modal)
    function saveSetting() {
        const form = document.getElementById('settingForm');
        if (!form || !form.checkValidity()) {
            form?.reportValidity();
            return;
        }

        const settingId = document.getElementById('settingId')?.value;
        const isEdit = settingId !== '';

        const settingData = {
            key: document.getElementById('settingKey')?.value,
            value: document.getElementById('settingValue')?.value,
            type: document.getElementById('settingType')?.value,
            description: document.getElementById('settingDescription')?.value,
            category: 'settings'
        };

        const url = isEdit ? `/api/admin/settings/${settingId}` : '/api/admin/settings';
        const method = isEdit ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settingData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                bootstrap.Modal.getInstance(document.getElementById('settingModal'))?.hide();
                showSuccess(isEdit ? 'Setting updated successfully' : 'Setting created successfully');
                loadAllSettings();
                loadSettings(); // Reload both
                resetSettingForm();
            } else {
                showError(data.message || 'Failed to save setting');
            }
        })
        .catch(error => {
            console.error('Error saving setting:', error);
            showError('Failed to save setting');
        });
    }

    // Edit setting
    function editSetting(key) {
        const setting = allSettingsData.find(s => s.key === key);
        if (!setting) return;

        const settingIdEl = document.getElementById('settingId');
        const settingKeyEl = document.getElementById('settingKey');
        const settingValueEl = document.getElementById('settingValue');
        const settingTypeEl = document.getElementById('settingType');
        const settingDescriptionEl = document.getElementById('settingDescription');
        const settingModalTitleEl = document.getElementById('settingModalTitle');

        if (settingIdEl) settingIdEl.value = setting.id;
        if (settingKeyEl) settingKeyEl.value = setting.key;
        if (settingValueEl) settingValueEl.value = typeof setting.value === 'object' ? JSON.stringify(setting.value, null, 2) : setting.value;
        if (settingTypeEl) settingTypeEl.value = setting.type;
        if (settingDescriptionEl) settingDescriptionEl.value = setting.description || '';
        if (settingModalTitleEl) settingModalTitleEl.textContent = 'Edit Setting';

        new bootstrap.Modal(document.getElementById('settingModal'))?.show();
    }

    // Delete setting
    function deleteSetting(key) {
        if (!confirm('Are you sure you want to delete this setting?')) {
            return;
        }

        fetch(`/api/admin/settings/${key}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccess('Setting deleted successfully');
                loadAllSettings();
                loadSettings(); // Reload both
            } else {
                showError(data.message || 'Failed to delete setting');
            }
        })
        .catch(error => {
            console.error('Error deleting setting:', error);
            showError('Failed to delete setting');
        });
    }

    // Load admin users
    function loadAdminUsers() {
        fetch('/api/admin/settings/admin-users')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                adminUsersData = data.data;
                renderAdminUsers();
            }
        })
        .catch(error => {
            console.error('Error loading admin users:', error);
            showError('Failed to load admin users');
        });
    }

    // Render admin users
    function renderAdminUsers() {
        const tbody = document.getElementById('adminUsersTableBody');

        if (!tbody) return;

        if (adminUsersData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No admin users found</td></tr>';
            return;
        }

        const usersHtml = adminUsersData.map(user => `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="badge bg-primary">${user.role}</span></td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="window.adminSettings.editAdminUser(${user.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="window.adminSettings.deleteAdminUser(${user.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = usersHtml;
    }

    // Save admin user
    function saveAdminUser() {
        const form = document.getElementById('adminUserForm');
        if (!form || !form.checkValidity()) {
            form?.reportValidity();
            return;
        }

        const userId = document.getElementById('adminUserId')?.value;
        const isEdit = userId !== '';

        const userData = {
            name: document.getElementById('adminName')?.value,
            email: document.getElementById('adminEmail')?.value,
            password: document.getElementById('adminPassword')?.value
        };

        const url = isEdit
            ? `/api/admin/settings/admin-users/${userId}`
            : '/api/admin/settings/admin-users';
        const method = isEdit ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                bootstrap.Modal.getInstance(document.getElementById('adminUserModal'))?.hide();
                showSuccess(isEdit ? 'Admin user updated successfully' : 'Admin user created successfully');
                loadAdminUsers();
                resetAdminUserForm();
            } else {
                showError(data.message || 'Failed to save admin user');
            }
        })
        .catch(error => {
            console.error('Error saving admin user:', error);
            showError('Failed to save admin user');
        });
    }

    // Edit admin user
    function editAdminUser(id) {
        const user = adminUsersData.find(u => u.id === id);
        if (!user) return;

        const userIdEl = document.getElementById('adminUserId');
        const nameEl = document.getElementById('adminName');
        const emailEl = document.getElementById('adminEmail');
        const passwordEl = document.getElementById('adminPassword');
        const modalTitleEl = document.getElementById('adminUserModalTitle');

        if (userIdEl) userIdEl.value = id;
        if (nameEl) nameEl.value = user.name;
        if (emailEl) emailEl.value = user.email;
        if (passwordEl) passwordEl.value = '';
        if (modalTitleEl) modalTitleEl.textContent = 'Edit Admin User';

        new bootstrap.Modal(document.getElementById('adminUserModal'))?.show();
    }

    // Delete admin user
    function deleteAdminUser(id) {
        if (!confirm('Are you sure you want to delete this admin user?')) {
            return;
        }

        fetch(`/api/admin/settings/admin-users/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccess('Admin user deleted successfully');
                loadAdminUsers();
            } else {
                showError(data.message || 'Failed to delete admin user');
            }
        })
        .catch(error => {
            console.error('Error deleting admin user:', error);
            showError('Failed to delete admin user');
        });
    }

    // Load backups
    function loadBackups() {
        fetch('/api/admin/settings/backups')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                backupData = data.data;
                renderBackups();
            }
        })
        .catch(error => {
            console.error('Error loading backups:', error);
            showError('Failed to load backups');
        });
    }

    // Render backups
    function renderBackups() {
        const tbody = document.getElementById('backupsTableBody');

        if (!tbody) return;

        if (backupData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No backups found</td></tr>';
            return;
        }

        const backupsHtml = backupData.map(backup => `
            <tr>
                <td>${backup.name}</td>
                <td>${formatFileSize(backup.size)}</td>
                <td>${new Date(backup.created).toLocaleString()}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="window.adminSettings.downloadBackup('${backup.name}')">
                            <i class="fas fa-download"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="window.adminSettings.deleteBackup('${backup.name}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = backupsHtml;
    }

    // Create backup
    function createBackup() {
        const includeFiles = document.getElementById('includeFiles')?.checked;

        fetch('/api/admin/settings/backup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ includeFiles })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                bootstrap.Modal.getInstance(document.getElementById('backupModal'))?.hide();
                showSuccess('Backup created successfully');
                loadBackups();
            } else {
                showError(data.message || 'Failed to create backup');
            }
        })
        .catch(error => {
            console.error('Error creating backup:', error);
            showError('Failed to create backup');
        });
    }

    // Download backup
    function downloadBackup(filename) {
        window.open(`/api/admin/settings/backups/${filename}`, '_blank');
    }

    // Delete backup
    function deleteBackup(filename) {
        if (!confirm('Are you sure you want to delete this backup?')) {
            return;
        }

        fetch(`/api/admin/settings/backups/${filename}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccess('Backup deleted successfully');
                loadBackups();
            } else {
                showError(data.message || 'Failed to delete backup');
            }
        })
        .catch(error => {
            console.error('Error deleting backup:', error);
            showError('Failed to delete backup');
        });
    }

    // Reset admin user form
    function resetAdminUserForm() {
        const form = document.getElementById('adminUserForm');
        if (form) {
            form.reset();
            const userIdEl = document.getElementById('adminUserId');
            const modalTitleEl = document.getElementById('adminUserModalTitle');
            if (userIdEl) userIdEl.value = '';
            if (modalTitleEl) modalTitleEl.textContent = 'Add Admin User';
        }
    }

    // Reset setting form
    function resetSettingForm() {
        const form = document.getElementById('settingForm');
        if (form) {
            form.reset();
            const settingIdEl = document.getElementById('settingId');
            const modalTitleEl = document.getElementById('settingModalTitle');
            if (settingIdEl) settingIdEl.value = '';
            if (modalTitleEl) modalTitleEl.textContent = 'Add Setting';
        }
    }

    // Format setting value for display
    function formatSettingValue(value) {
        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value);
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Show success message
    function showSuccess(message) {
        console.log(message);
        alert(message);
    }

    // Show error message
    function showError(message) {
        console.error(message);
        alert('Error: ' + message);
    }

    // Change current admin password
    function changeAdminPassword() {
        const currentPassword = document.getElementById('currentPassword')?.value;
        const newPassword = document.getElementById('newPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;

        // Validate inputs
        if (!currentPassword || !newPassword || !confirmPassword) {
            showError('All password fields are required');
            return;
        }

        if (newPassword !== confirmPassword) {
            showError('New password and confirmation do not match');
            return;
        }

        if (newPassword.length < 8) {
            showError('New password must be at least 8 characters long');
            return;
        }

        // Basic password strength check
        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasLowerCase = /[a-z]/.test(newPassword);
        const hasNumbers = /\d/.test(newPassword);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

        if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
            showError('Password must include uppercase, lowercase, numbers, and special characters');
            return;
        }

        // Send request to change password
        fetch('/api/admin/settings/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccess('Password changed successfully');
                // Clear form
                const currentPasswordEl = document.getElementById('currentPassword');
                const newPasswordEl = document.getElementById('newPassword');
                const confirmPasswordEl = document.getElementById('confirmPassword');
                if (currentPasswordEl) currentPasswordEl.value = '';
                if (newPasswordEl) newPasswordEl.value = '';
                if (confirmPasswordEl) confirmPasswordEl.value = '';
            } else {
                showError(data.message || 'Failed to change password');
            }
        })
        .catch(error => {
            console.error('Error changing password:', error);
            showError('Failed to change password');
        });
    }

    // Expose functions to window object for onclick handlers
    window.adminSettings = {
        updateSetting,
        saveSetting,
        editSetting,
        deleteSetting,
        saveAdminUser,
        editAdminUser,
        deleteAdminUser,
        createBackup,
        downloadBackup,
        deleteBackup,
        changeAdminPassword
    };

})();
