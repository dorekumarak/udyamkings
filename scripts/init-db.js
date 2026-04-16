require('dotenv').config();
const { sequelize, User } = require('../models');
const bcrypt = require('bcryptjs');

const initDatabase = async () => {
  try {
    // Sync all models
    await sequelize.sync({ force: true });
    console.log('Database synced successfully');

    // Create admin user
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    
    await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@udyamkings.com',
      password: hashedPassword,
      role: 'admin',
      emailVerified: true
    });

    console.log('Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

initDatabase();
