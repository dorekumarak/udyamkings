const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Application = sequelize.define('Application', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        applicant_type: {
            type: DataTypes.ENUM('fresh_startup', 'existing_business'),
            allowNull: false
        },
        business_name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        description_short: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        description_long: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        amount_requested: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false
        },
        aadhar_path: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        extra_docs_paths: {
            type: DataTypes.JSON,
            defaultValue: null
        },
        preferred_contact_time: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        annual_revenue: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true
        },
        years_in_operation: {
            type: DataTypes.DECIMAL(5, 1),
            allowNull: true
        },
        payment_status: {
            type: DataTypes.ENUM('pending', 'paid', 'failed'),
            defaultValue: 'pending'
        },
        application_status: {
            type: DataTypes.ENUM('pending', 'under_review', 'accepted', 'rejected'),
            defaultValue: 'pending'
        },
        admin_notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        application_fee: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 999.00,
            comment: 'Application fee in INR'
        },
        razorpay_order_id: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: 'Razorpay order ID'
        },
        razorpay_payment_id: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: 'Razorpay payment ID'
        },
        razorpay_signature: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: 'Razorpay payment signature for verification'
        }
    }, {
        tableName: 'applications',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    Application.associate = (models) => {
        Application.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return Application;
};
