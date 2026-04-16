const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const FormConfig = sequelize.define('FormConfig', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        field_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        field_label: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        field_type: {
            type: DataTypes.ENUM('text', 'textarea', 'number', 'email', 'tel', 'file', 'select', 'radio', 'checkbox'),
            allowNull: false
        },
        is_required: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        applicant_types: {
            type: DataTypes.JSON,
            allowNull: false
        },
        validation_rules: {
            type: DataTypes.JSON,
            allowNull: true
        },
        options: {
            type: DataTypes.JSON,
            allowNull: true
        },
        file_types: {
            type: DataTypes.JSON,
            allowNull: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        display_order: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        show_condition: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Conditional logic for showing/hiding this field',
            get: function() {
                const rawValue = this.getDataValue('show_condition');
                return rawValue ? JSON.parse(rawValue) : null;
            },
            set: function(value) {
                this.setDataValue('show_condition', value ? JSON.stringify(value) : null);
            }
        }
    }, {
        tableName: 'form_configs',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return FormConfig;
};
