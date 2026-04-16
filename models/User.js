const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Please add a name' }
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: {
                args: true,
                msg: 'Email already in use!'
            },
            validate: {
                isEmail: { msg: 'Please add a valid email' },
                notEmpty: { msg: 'Please add an email' }
            }
        },
        email_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        role: {
            type: DataTypes.ENUM('user', 'admin'),
            defaultValue: 'user',
            allowNull: false
        },
        mobile: {
            type: DataTypes.STRING,
            allowNull: true
        },
        city: {
            type: DataTypes.STRING,
            allowNull: true
        },
        aadhar_path: {
            type: DataTypes.STRING,
            allowNull: true
        },
        gst_path: {
            type: DataTypes.STRING,
            allowNull: true
        },
        registration_path: {
            type: DataTypes.STRING,
            allowNull: true
        },
        financial_path: {
            type: DataTypes.STRING,
            allowNull: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                len: {
                    args: [6],
                    msg: 'Password must be at least 6 characters long'
                }
            }
        },
        resetPasswordToken: DataTypes.STRING,
        resetPasswordExpire: DataTypes.DATE
    }, {
        timestamps: true,
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            }
        }
    });

    // Instance method to check password
    User.prototype.matchPassword = async function(enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
    };

    // Instance method to generate JWT token
    User.prototype.getSignedJwtToken = function() {
        return jwt.sign({ id: this.id }, process.env.JWT_SECRET || 'your-secret-key', {
            expiresIn: process.env.JWT_EXPIRE || '30d'
        });
    };

    // Instance method to generate and hash password token
    User.prototype.getResetPasswordToken = function() {
        // Generate token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash token and set to resetPasswordToken field
        this.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Set expire (10 minutes)
        this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        return resetToken;
    };

    // Instance method to check if user is admin
    User.prototype.isAdmin = function() {
        return this.role === 'admin';
    };

    // Find admin by credentials
    User.findByCredentials = async (email, password) => {
        const user = await User.findOne({
            where: {
                email: email.toLowerCase(),
                role: 'admin'
            }
        });

        if (!user) {
            throw new Error('Invalid login credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid login credentials');
        }

        return user;
    };

    // Generate auth token with role
    User.prototype.getSignedJwtToken = function() {
        return jwt.sign(
            { id: this.id, role: this.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: process.env.JWT_EXPIRE || '30d' }
        );
    };

    // Get admin users
    User.getAdmins = async function() {
        return await User.findAll({
            where: {
                role: 'admin'
            },
            attributes: ['id', 'name', 'email', 'createdAt']
        });
    };

    User.associate = (models) => {
        User.hasMany(models.Application, {
            foreignKey: 'user_id',
            as: 'applications'
        });
    };

    return User;
};
