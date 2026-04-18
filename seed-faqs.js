const { Content } = require('./models');

async function seedFAQs() {
    try {
        console.log('🌱 Seeding FAQ data...');

        const faqs = [
            {
                key: 'faq_application_fee',
                value: 'What is the application fee and is it refundable? | The application fee is ₹999, which covers the cost of processing and reviewing your application. This fee is non-refundable as it goes towards the administrative costs associated with evaluating your submission.',
                category: 'faq',
                description: 'Application fee question',
                type: 'text',
                order: 1,
                is_active: true
            },
            {
                key: 'faq_review_process',
                value: 'How long does the review process take? | Our review process typically takes 7-10 working days. During this time, our panel of experts carefully evaluates your business proposal, market potential, and growth prospects.',
                category: 'faq',
                description: 'Review process duration',
                type: 'text',
                order: 2,
                is_active: true
            },
            {
                key: 'faq_business_types',
                value: 'What types of businesses do you fund? | We fund a wide range of businesses including startups, small businesses, expansion plans, and innovative ideas. We look for businesses with strong growth potential, scalable models, and passionate founders.',
                category: 'faq',
                description: 'Types of businesses funded',
                type: 'text',
                order: 3,
                is_active: true
            },
            {
                key: 'faq_credit_score',
                value: 'Is there a minimum credit score required to apply? | While we do consider credit history as part of our evaluation, we don\'t have a strict minimum credit score requirement. We evaluate each application holistically, considering factors like business potential, market opportunity, and your ability to execute the business plan.',
                category: 'faq',
                description: 'Credit score requirements',
                type: 'text',
                order: 4,
                is_active: true
            },
            {
                key: 'faq_qualification',
                value: 'How do I know if my business qualifies for funding? | We fund a wide range of businesses across various industries. The best way to know if you qualify is to submit an application. Our team will review your business model, market potential, and financials to determine if we can support your venture. We\'re particularly interested in businesses with strong growth potential and capable management teams.',
                category: 'faq',
                description: 'Business qualification criteria',
                type: 'text',
                order: 5,
                is_active: true
            }
        ];

        for (const faq of faqs) {
            const existing = await Content.findOne({ where: { key: faq.key } });
            if (!existing) {
                await Content.create(faq);
                console.log(`✅ Created FAQ: ${faq.key}`);
            } else {
                console.log(`⏭️  FAQ already exists: ${faq.key}`);
            }
        }

        console.log('🎉 FAQ seeding completed!');
    } catch (error) {
        console.error('❌ Error seeding FAQs:', error);
    }
}

module.exports = seedFAQs;

// Run if called directly
if (require.main === module) {
    seedFAQs().then(() => process.exit(0));
}
