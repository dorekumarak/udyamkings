'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if columns exist before adding them
    const tableDescription = await queryInterface.describeTable('applications');
    
    // Add missing columns if they don't exist
    if (!tableDescription.razorpay_order_id) {
      await queryInterface.addColumn('applications', 'razorpay_order_id', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Razorpay order ID'
      });
    }

    if (!tableDescription.razorpay_payment_id) {
      await queryInterface.addColumn('applications', 'razorpay_payment_id', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Razorpay payment ID'
      });
    }

    if (!tableDescription.razorpay_signature) {
      await queryInterface.addColumn('applications', 'razorpay_signature', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Razorpay payment signature for verification'
      });
    }

    // Create application_settings table if it doesn't exist
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('application_settings')) {
      await queryInterface.createTable('application_settings', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        key: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true
        },
        value: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      // Insert default application fee
      await queryInterface.bulkInsert('application_settings', [{
        key: 'application_fee',
        value: '999.00',
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }
  },

  async down (queryInterface, Sequelize) {
    // Remove added columns
    await queryInterface.removeColumn('applications', 'razorpay_order_id');
    await queryInterface.removeColumn('applications', 'razorpay_payment_id');
    await queryInterface.removeColumn('applications', 'razorpay_signature');
    
    // Drop settings table
    await queryInterface.dropTable('application_settings');
  }
};
