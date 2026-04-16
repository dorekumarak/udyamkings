const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ApplicationSetting = sequelize.define('ApplicationSetting', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        key: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    }, {
        tableName: 'application_settings',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    // Static method to get application fee
    ApplicationSetting.getApplicationFee = async () => {
        const setting = await ApplicationSetting.findOne({
            where: { key: 'application_fee' }
        });
        return setting ? parseFloat(setting.value) : 999.00;
    };

    // Static method to update application fee
    ApplicationSetting.updateApplicationFee = async (fee) => {
        await ApplicationSetting.update(
            { value: fee.toString() },
            { where: { key: 'application_fee' } }
        );
    };

    return ApplicationSetting;
};
