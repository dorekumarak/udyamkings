const { sequelize, Content } = require('./models');

async function seedContent() {
    try {
        console.log('🌱 Seeding content data...');

        // Clear existing content
        await Content.destroy({ where: {} });

        // Homepage content
        const homepageContent = [
            {
                key: 'hero_title',
                value: 'Welcome to UdyamKings',
                category: 'homepage',
                description: 'Main hero title on homepage',
                type: 'text'
            },
            {
                key: 'hero_subtitle',
                value: 'Empowering entrepreneurs with funding, mentorship, and resources to build successful businesses.',
                category: 'homepage',
                description: 'Hero subtitle text',
                type: 'text'
            },
            {
                key: 'cta_button_text',
                value: 'Apply for Funding',
                category: 'homepage',
                description: 'Call-to-action button text',
                type: 'text'
            },
            {
                key: 'features_title',
                value: 'Why Choose UdyamKings?',
                category: 'homepage',
                description: 'Features section title',
                type: 'text'
            },
            {
                key: 'features_description',
                value: 'We provide comprehensive support to entrepreneurs at every stage of their journey.',
                category: 'homepage',
                description: 'Features section description',
                type: 'text'
            }
        ];

        // About content
        const aboutContent = [
            {
                key: 'about_title',
                value: 'About UdyamKings',
                category: 'about',
                description: 'About page main title',
                type: 'text'
            },
            {
                key: 'about_content',
                value: 'UdyamKings is dedicated to supporting entrepreneurs and startups with funding, mentorship, and resources. Our mission is to empower innovative business ideas and help them grow into successful enterprises.',
                category: 'about',
                description: 'About page main content',
                type: 'html'
            },
            {
                key: 'mission_statement',
                value: 'To create a thriving ecosystem where entrepreneurs can access the funding, guidance, and network they need to turn their visions into reality.',
                category: 'about',
                description: 'Company mission statement',
                type: 'text'
            }
        ];

        // Contact content
        const contactContent = [
            {
                key: 'contact_email',
                value: 'info@udyamkings.com',
                category: 'contact',
                description: 'Primary contact email',
                type: 'text'
            },
            {
                key: 'contact_phone',
                value: '+91-9876543210',
                category: 'contact',
                description: 'Contact phone number',
                type: 'text'
            },
            {
                key: 'contact_address',
                value: '123 Business Hub, Tech Park, Bangalore - 560001, Karnataka, India',
                category: 'contact',
                description: 'Business address',
                type: 'text'
            },
            {
                key: 'working_hours',
                value: 'Monday to Friday: 9:00 AM - 6:00 PM IST',
                category: 'contact',
                description: 'Business working hours',
                type: 'text'
            }
        ];

        // Settings content
        const settingsContent = [
            {
                key: 'application_fee',
                value: '500',
                category: 'settings',
                description: 'Application processing fee in rupees',
                type: 'text'
            },
            {
                key: 'min_loan_amount',
                value: '100000',
                category: 'settings',
                description: 'Minimum loan amount in rupees',
                type: 'text'
            },
            {
                key: 'max_loan_amount',
                value: '5000000',
                category: 'settings',
                description: 'Maximum loan amount in rupees',
                type: 'text'
            },
            {
                key: 'interest_rate',
                value: '12',
                category: 'settings',
                description: 'Annual interest rate percentage',
                type: 'text'
            }
        ];

        // Theme content
        const themeContent = [
            {
                key: 'primary_color',
                value: '#007bff',
                category: 'theme',
                description: 'Primary brand color',
                type: 'color'
            },
            {
                key: 'secondary_color',
                value: '#6c757d',
                category: 'theme',
                description: 'Secondary brand color',
                type: 'color'
            },
            {
                key: 'logo_url',
                value: '/images/logo.png',
                category: 'theme',
                description: 'Company logo URL',
                type: 'text'
            },
            {
                key: 'favicon_url',
                value: '/favicon.ico',
                category: 'theme',
                description: 'Favicon URL',
                type: 'text'
            }
        ];

        // FAQ content
        const faqContent = [
            {
                key: 'faq_1',
                value: 'What is UdyamKings?|UdyamKings is a platform that connects entrepreneurs with investors, mentors, and resources to help build successful businesses.',
                category: 'faq',
                description: 'What is UdyamKings?',
                type: 'text',
                order: 1
            },
            {
                key: 'faq_2',
                value: 'How do I apply for funding?|You can apply for funding by creating an account, filling out our detailed application form, and submitting your business plan.',
                category: 'faq',
                description: 'How to apply for funding',
                type: 'text',
                order: 2
            },
            {
                key: 'faq_3',
                value: 'What are the eligibility criteria?|You should have a viable business idea, minimum 2 years of industry experience, and a clear revenue model.',
                category: 'faq',
                description: 'Eligibility criteria',
                type: 'text',
                order: 3
            },
            {
                key: 'faq_4',
                value: 'How long does the approval process take?|The approval process typically takes 2-4 weeks, depending on the complexity of your application.',
                category: 'faq',
                description: 'Approval timeline',
                type: 'text',
                order: 4
            },
            {
                key: 'faq_5',
                value: 'Do you provide mentorship?|Yes, we provide access to experienced mentors who can guide you through various aspects of business development.',
                category: 'faq',
                description: 'Mentorship availability',
                type: 'text',
                order: 5
            }
        ];

        // Insert all content
        await Content.bulkCreate([
            ...homepageContent,
            ...aboutContent,
            ...contactContent,
            ...settingsContent,
            ...themeContent,
            ...faqContent
        ]);

        console.log('✅ Content seeded successfully!');
        console.log('📊 Created content items:');
        console.log(`   - Homepage: ${homepageContent.length} items`);
        console.log(`   - About: ${aboutContent.length} items`);
        console.log(`   - Contact: ${contactContent.length} items`);
        console.log(`   - Settings: ${settingsContent.length} items`);
        console.log(`   - Theme: ${themeContent.length} items`);
        console.log(`   - FAQ: ${faqContent.length} items`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding content:', error);
        process.exit(1);
    }
}

seedContent();
