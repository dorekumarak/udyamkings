const { sequelize, EmailTemplate } = require('./models');

async function seedEmailTemplates() {
    try {
        console.log('🌱 Seeding email templates data...');

        // Create default email templates using the model method
        await EmailTemplate.createDefaults();

        console.log('✅ Email templates seeded successfully!');
        console.log('📧 Default email templates created:');
        console.log('   - application_accepted');
        console.log('   - application_rejected');
        console.log('   - payment_received');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding email templates:', error);
        process.exit(1);
    }
}

seedEmailTemplates();
