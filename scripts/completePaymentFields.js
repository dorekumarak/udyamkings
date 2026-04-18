const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'),
  logging: false
});

async function completePaymentFields() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    
    const queryInterface = sequelize.getQueryInterface();
    
    // Check existing columns
    const tableDescription = await queryInterface.describeTable('applications');
    const tables = await queryInterface.showAllTables();
    
    // Add missing columns if they don't exist
    if (!tableDescription.razorpay_order_id) {
      await queryInterface.addColumn('applications', 'razorpay_order_id', {
        type: DataTypes.STRING(255),
        allowNull: true
      });
      console.log('Added razorpay_order_id column');
    } else {
      console.log('razorpay_order_id column already exists');
    }
    
    if (!tableDescription.razorpay_payment_id) {
      await queryInterface.addColumn('applications', 'razorpay_payment_id', {
        type: DataTypes.STRING(255),
        allowNull: true
      });
      console.log('Added razorpay_payment_id column');
    } else {
      console.log('razorpay_payment_id column already exists');
    }
    
    if (!tableDescription.razorpay_signature) {
      await queryInterface.addColumn('applications', 'razorpay_signature', {
        type: DataTypes.STRING(255),
        allowNull: true
      });
      console.log('Added razorpay_signature column');
    } else {
      console.log('razorpay_signature column already exists');
    }
    
    // Create settings table if it doesn't exist
    if (!tables.includes('application_settings')) {
      await queryInterface.createTable('application_settings', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
        value: { type: DataTypes.TEXT, allowNull: false },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      });
      console.log('Created application_settings table');
      
      // Insert default fee
      await queryInterface.bulkInsert('application_settings', [{
        key: 'application_fee',
        value: '999.00',
        created_at: new Date(),
        updated_at: new Date()
      }]);
      console.log('Inserted default application fee');
    } else {
      console.log('application_settings table already exists');
    }
    
    console.log('Payment fields setup completed successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

completePaymentFields();