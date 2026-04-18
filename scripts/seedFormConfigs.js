const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'),
  logging: false
});

// Define FormConfig model
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
  options: {
    type: DataTypes.JSON,
    allowNull: true
  },
  validation_rules: {
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
    allowNull: true
  }
}, {
  tableName: 'form_configs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const formConfigs = [
    {
        field_name: 'applicantType',
        field_label: 'Applicant Type',
        field_type: 'radio',
        is_required: true,
        options: [
            { value: 'fresh_startup', label: 'Fresh / Startup / New Idea' },
            { value: 'existing_business', label: 'Existing Business Expansion' }
        ],
        validation_rules: { required: 'Please select an applicant type' },
        display_order: 1
    },
    {
        field_name: 'businessName',
        field_label: 'Business/Project Name',
        field_type: 'text',
        is_required: true,
        validation_rules: { 
            required: 'Business name is required',
            maxLength: 255
        },
        display_order: 2
    },
    {
        field_name: 'shortDescription',
        field_label: 'Short Description',
        field_type: 'textarea',
        is_required: true,
        validation_rules: {
            required: 'Short description is required',
            maxLength: 1000
        },
        display_order: 3
    },
    {
        field_name: 'detailedPlan',
        field_label: 'Detailed Business Plan',
        field_type: 'textarea',
        is_required: true,
        validation_rules: {
            required: 'Please provide a detailed business plan'
        },
        display_order: 4
    },
    {
        field_name: 'amountRequested',
        field_label: 'Amount Requested (₹)',
        field_type: 'number',
        is_required: true,
        validation_rules: {
            required: 'Please specify the amount requested',
            min: 0
        },
        display_order: 5
    },
    {
        field_name: 'aadharFile',
        field_label: 'Aadhar Card',
        field_type: 'file',
        is_required: true,
        file_types: ['application/pdf', 'image/jpeg', 'image/png'],
        validation_rules: {
            required: 'Aadhar card is required'
        },
        display_order: 6
    },
    {
        field_name: 'gstCertificate',
        field_label: 'GST Certificate',
        field_type: 'file',
        is_required: false,
        file_types: ['application/pdf', 'image/jpeg', 'image/png'],
        show_condition: { field: 'applicantType', value: 'existing_business' },
        display_order: 7
    },
    {
        field_name: 'businessRegistration',
        field_label: 'Business Registration',
        field_type: 'file',
        is_required: false,
        file_types: ['application/pdf', 'image/jpeg', 'image/png'],
        show_condition: { field: 'applicantType', value: 'existing_business' },
        display_order: 8
    },
    {
        field_name: 'financialDocuments',
        field_label: 'Financial Documents (Last 2 Years P&L or Bank Statements)',
        field_type: 'file',
        is_required: false,
        file_types: ['application/pdf'],
        multiple: true,
        show_condition: { field: 'applicantType', value: 'existing_business' },
        display_order: 9
    },
    {
        field_name: 'preferredContactTime',
        field_label: 'Preferred Contact Time',
        field_type: 'text',
        is_required: true,
        validation_rules: {
            required: 'Please specify your preferred contact time'
        },
        display_order: 10
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

        // Create form configurations
        console.log('🌱 Seeding form configurations...');
        for (const config of formConfigs) {
            await FormConfig.create(config);
            console.log(`✅ Added field: ${config.field_label}`);
        }
        
        console.log('🎉 Form configurations seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding form configurations:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
        console.log('🔒 Database connection closed.');
    }
}

seed();
