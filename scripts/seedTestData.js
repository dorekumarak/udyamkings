const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const bcrypt = require('bcryptjs');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'),
  logging: false
});

// Define User model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  reset_password_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  reset_password_expires: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Define Application model
const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users', // Note: This is the table name
      key: 'id'
    }
  },
  applicant_type: {
    type: DataTypes.ENUM('fresh_startup', 'existing_business'),
    allowNull: false
  },
  business_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description_short: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description_long: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  amount_requested: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  aadhar_path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  extra_docs_paths: {
    type: DataTypes.JSON,
    allowNull: true
  },
  preferred_contact_time: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  annual_revenue: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  years_in_operation: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed'),
    defaultValue: 'pending'
  },
  application_status: {
    type: DataTypes.ENUM('pending', 'under_review', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  admin_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'applications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Set up associations
User.hasMany(Application, { foreignKey: 'user_id' });
Application.belongsTo(User, { foreignKey: 'user_id' });

const testUsers = [
    {
        email: 'admin@example.com',
        password: 'admin123',
        first_name: 'Admin',
        last_name: 'User',
        phone: '9876543210',
        is_verified: true,
        role: 'admin'
    },
    {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
        phone: '1234567890',
        is_verified: true,
        role: 'user'
    }
];

const testApplications = [
    {
        user_id: 2, // Will be set after user creation
        applicant_type: 'existing_business',
        business_name: 'Test Business Solutions',
        description_short: 'A growing business looking to expand operations',
        description_long: 'Detailed business plan for expansion including market analysis, financial projections, and growth strategies.',
        amount_requested: 1500000.00,
        aadhar_path: '/uploads/aadhar/test-aadhar.pdf',
        extra_docs_paths: {
            gst_certificate: '/uploads/documents/gst-cert.pdf',
            business_registration: '/uploads/documents/registration.pdf',
            financial_documents: [
                '/uploads/documents/financial-2022.pdf',
                '/uploads/documents/financial-2023.pdf'
            ]
        },
        preferred_contact_time: '2:00 PM - 5:00 PM',
        annual_revenue: 5000000.00,
        years_in_operation: 4.5,
        payment_status: 'pending',
        application_status: 'pending'
    },
    {
        user_id: 2, // Will be set after user creation
        applicant_type: 'fresh_startup',
        business_name: 'New Tech Innovations',
        description_short: 'Innovative tech startup with a unique product',
        description_long: 'Comprehensive business plan for a new technology startup including product details, market analysis, and financial projections.',
        amount_requested: 750000.00,
        aadhar_path: '/uploads/aadhar/test-aadhar-2.pdf',
        extra_docs_paths: null,
        preferred_contact_time: '10:00 AM - 1:00 PM',
        annual_revenue: 0,
        years_in_operation: 0.5,
        payment_status: 'pending',
        application_status: 'pending'
    }
];

async function seed() {
  try {
    // Test the connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync all models
    console.log('🔄 Syncing database...');
    await sequelize.sync({ force: true });
    console.log('✅ Database synced successfully');

    // Create users
    console.log('👥 Creating test users...');
    const createdUsers = [];
    for (const user of testUsers) {
      const createdUser = await User.create(user);
      console.log(`✅ Created user: ${createdUser.email} (${createdUser.role})`);
      createdUsers.push(createdUser);
    }

    // Create applications with the correct user_id references
    console.log('📝 Creating test applications...');
    for (const app of testApplications) {
      const user = createdUsers.find(u => u.role === 'user');
      const application = await Application.create({
        ...app,
        user_id: user.id
      });
      console.log(`✅ Created application for: ${application.business_name}`);
    }

    console.log('🎉 Test data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔒 Database connection closed.');
  }
}

seed();
