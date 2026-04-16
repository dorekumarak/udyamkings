const db = require('./models');
const { User } = db;
const sequelize = require('./config/db');

async function createAdmin() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    
    // Check if admin exists
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    
    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin.email);
      console.log('You can login with:', existingAdmin.email);
    } else {
      // Create admin user
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@udyamkings.com',
        password: 'admin123',
        role: 'admin',
        email_verified: true
      });
      
      console.log('✅ Admin created successfully!');
      console.log('📧 Email: admin@udyamkings.com');
      console.log('🔑 Password: admin123');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
