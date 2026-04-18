const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Admin = sequelize.define('Admin', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('super_admin', 'admin', 'moderator'),
            defaultValue: 'admin',
            allowNull: false
        },
        permissions: {
            type: DataTypes.JSON,
            defaultValue: {
                applicants: ['read', 'write', 'delete'],
                payments: ['read', 'refund'],
                forms: ['read', 'write'],
                content: ['read', 'write'],
                settings: ['read', 'write']
            }
        },
        last_login: {
            type: DataTypes.DATE,
            allowNull: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'admins',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        hooks: {
            beforeCreate: async (admin) => {
                if (admin.password) {
                    const bcrypt = require('bcryptjs');
                    const saltRounds = 12;
                    admin.password = await bcrypt.hash(admin.password, saltRounds);
                }
            },
            beforeUpdate: async (admin) => {
                if (admin.changed('password')) {
                    const bcrypt = require('bcryptjs');
                    const saltRounds = 12;
                    admin.password = await bcrypt.hash(admin.password, saltRounds);
                }
            }
        }
    });

    // Instance method to check password
    Admin.prototype.matchPassword = async function(password) {
        const bcrypt = require('bcryptjs');
        return await bcrypt.compare(password, this.password);
    };

    // Instance method to check permissions
    Admin.prototype.hasPermission = function(module, action) {
        if (this.role === 'super_admin') return true;
        return this.permissions[module] && this.permissions[module].includes(action);
    };

    return Admin;
};
