const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Content = sequelize.define('Content', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        key: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('text', 'html', 'json', 'color'),
            defaultValue: 'text'
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        category: {
            type: DataTypes.ENUM('homepage', 'about', 'contact', 'settings', 'theme', 'faq'),
            defaultValue: 'homepage'
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        order: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: true
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
        tableName: 'content',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Content;
};
