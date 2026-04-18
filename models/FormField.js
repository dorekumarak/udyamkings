const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const FormField = sequelize.define('FormField', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        field_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        field_label: {
            type: DataTypes.STRING,
            allowNull: false
        },
        field_type: {
            type: DataTypes.ENUM('text', 'textarea', 'number', 'email', 'tel', 'file', 'select', 'radio', 'checkbox', 'date'),
            allowNull: false,
            defaultValue: 'text'
        },
        is_required: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        placeholder: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        options: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'For select/radio/checkbox fields - stores options array'
        },
        validation_rules: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {},
            comment: 'Validation rules like min, max, pattern, etc.'
        },
        conditional_show: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Rules for conditional display based on other field values'
        },
        field_order: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        applicant_type: {
            type: DataTypes.ENUM('individual', 'partnership', 'company', 'all'),
            defaultValue: 'all'
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
        tableName: 'form_fields',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return FormField;
};
