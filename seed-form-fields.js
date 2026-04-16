const { sequelize, FormConfig } = require('./models');

async function seedFormFields() {
    try {
        console.log('🌱 Seeding form fields data...');

        // Clear existing form fields
        await FormConfig.destroy({ where: {} });

        // Sample form fields for application forms
        const formFields = [
            {
                field_name: 'applicant_name',
                field_label: 'Full Name',
                field_type: 'text',
                is_required: true,
                placeholder: 'Enter your full name',
                display_order: 1,
                applicant_types: ['all']
            },
            {
                field_name: 'email',
                field_label: 'Email Address',
                field_type: 'email',
                is_required: true,
                placeholder: 'Enter your email address',
                display_order: 2,
                applicant_types: ['all']
            },
            {
                field_name: 'phone',
                field_label: 'Phone Number',
                field_type: 'tel',
                is_required: true,
                placeholder: 'Enter your phone number',
                display_order: 3,
                applicant_types: ['all']
            },
            {
                field_name: 'business_name',
                field_label: 'Business Name',
                field_type: 'text',
                is_required: true,
                placeholder: 'Enter your business name',
                display_order: 4,
                applicant_types: ['all']
            },
            {
                field_name: 'business_type',
                field_label: 'Business Type',
                field_type: 'select',
                is_required: true,
                options: ['Startup', 'Small Business', 'E-commerce', 'SaaS', 'Manufacturing', 'Service-based', 'Other'],
                display_order: 5,
                applicant_types: ['all']
            },
            {
                field_name: 'funding_amount',
                field_label: 'Funding Required (₹)',
                field_type: 'number',
                is_required: true,
                placeholder: 'Enter amount in rupees',
                display_order: 6,
                applicant_types: ['all']
            },
            {
                field_name: 'business_description',
                field_label: 'Business Description',
                field_type: 'textarea',
                is_required: true,
                placeholder: 'Describe your business, products/services, target market, etc.',
                display_order: 7,
                applicant_types: ['all']
            },
            {
                field_name: 'years_operation',
                field_label: 'Years in Operation',
                field_type: 'select',
                is_required: false,
                options: ['Just Started', 'Less than 1 year', '1-3 years', '3-5 years', '5+ years'],
                display_order: 8,
                applicant_types: ['all']
            },
            {
                field_name: 'current_revenue',
                field_label: 'Current Annual Revenue (₹)',
                field_type: 'number',
                is_required: false,
                placeholder: 'Enter current revenue',
                display_order: 9,
                applicant_types: ['all']
            },
            {
                field_name: 'team_size',
                field_label: 'Team Size',
                field_type: 'select',
                is_required: false,
                options: ['1 (Solo)', '2-5', '6-10', '11-25', '26-50', '50+'],
                display_order: 10,
                applicant_types: ['all']
            },
            {
                field_name: 'business_plan',
                field_label: 'Business Plan Document',
                field_type: 'file',
                is_required: false,
                display_order: 11,
                file_types: ['pdf', 'doc', 'docx'],
                applicant_types: ['all']
            },
            {
                field_name: 'website_url',
                field_label: 'Website/Social Media',
                field_type: 'text',
                is_required: false,
                placeholder: 'Enter your website or social media links',
                display_order: 12,
                applicant_types: ['all']
            }
        ];

        // Insert all form fields
        await FormConfig.bulkCreate(formFields);

        console.log('✅ Form fields seeded successfully!');
        console.log(`📊 Created ${formFields.length} form fields:`);
        formFields.forEach((field, index) => {
            console.log(`   ${index + 1}. ${field.field_label} (${field.field_type})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding form fields:', error);
        process.exit(1);
    }
}

seedFormFields();
