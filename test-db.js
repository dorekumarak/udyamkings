const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.sqlite');

// Check if database file exists
const dbExists = fs.existsSync(dbPath);
console.log(`Database file exists: ${dbExists}`);

// Check write permissions
try {
  fs.accessSync(path.dirname(dbPath), fs.constants.W_OK);
  console.log('Directory is writable');
} catch (err) {
  console.error('Directory is not writable:', err.message);
  process.exit(1);
}

// Initialize Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: console.log
});

// Define a test model
const TestModel = sequelize.define('Test', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// Test database connection and model syncing
const testConnection = async () => {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    // Sync all models
    console.log('Syncing database models...');
    await sequelize.sync({ force: true });
    console.log('✅ Database synchronized successfully!');
    
    // Test a simple query
    const [results] = await sequelize.query('SELECT 1+1 as result');
    console.log('✅ Test query successful:', results);
    
    // Test model operations
    const testItem = await TestModel.create({ name: 'test' });
    console.log('✅ Test model created:', testItem.toJSON());
    
    return true;
  } catch (error) {
    console.error('❌ Database operation failed:');
    console.error(error);
    return false;
  } finally {
    await sequelize.close();
  }
};

// Run the test
testConnection().then(success => {
  process.exit(success ? 0 : 1);
});