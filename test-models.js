require('dotenv').config();
const { User } = require('./models');

console.log('Testing model imports...');
console.log('User model:', typeof User);
console.log('User methods:', Object.getOwnPropertyNames(User).slice(0, 5));

// Test database connection
const sequelize = require('./config/db');

sequelize.authenticate()
  .then(() => {
    console.log('Database connection successful');
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
