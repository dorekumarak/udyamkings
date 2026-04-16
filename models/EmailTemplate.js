const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const EmailTemplate = sequelize.define('EmailTemplate', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            comment: 'Template name (e.g., application_accepted, application_rejected)'
        },
        subject: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Email subject template'
        },
        html_content: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: 'HTML email body template'
        },
        text_content: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Plain text email body template'
        },
        variables: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
            comment: 'List of variables used in template'
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Whether this template is currently active'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Description of when this template is used'
        },
        category: {
            type: DataTypes.ENUM('application', 'payment', 'user', 'system'),
            defaultValue: 'application',
            comment: 'Category of email template'
        }
    }, {
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['name']
            },
            {
                fields: ['category']
            }
        ]
    });

    // Instance methods
    EmailTemplate.prototype.render = function(variables = {}) {
        const renderTemplate = (template) => {
            let rendered = template;
            Object.keys(variables).forEach(key => {
                const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
                rendered = rendered.replace(regex, variables[key]);
            });
            return rendered;
        };

        return {
            subject: renderTemplate(this.subject),
            html: renderTemplate(this.html_content),
            text: this.text_content ? renderTemplate(this.text_content) : null
        };
    };

    // Static methods
    EmailTemplate.getByName = async function(name) {
        return await EmailTemplate.findOne({
            where: { name, is_active: true }
        });
    };

    EmailTemplate.getByCategory = async function(category) {
        return await EmailTemplate.findAll({
            where: { category, is_active: true },
            order: [['name', 'ASC']]
        });
    };

    // Create default templates
    EmailTemplate.createDefaults = async function() {
        const defaultTemplates = [
            {
                name: 'application_accepted',
                subject: 'Congratulations! Your Loan Application Has Been Approved',
                html_content: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px;">Congratulations!</h1>
                            <p style="margin: 10px 0; font-size: 16px;">Your loan application has been approved</p>
                        </div>
                        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
                            <h2 style="color: #333; margin-bottom: 20px;">Application Details</h2>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Business Name:</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{business_name}}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Amount Approved:</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">₹{{amount_approved}}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Application ID:</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">#{{application_id}}</td>
                                </tr>
                            </table>
                            <div style="margin-top: 30px; padding: 20px; background: #e8f5e8; border-radius: 8px; border-left: 4px solid #28a745;">
                                <h3 style="color: #155724; margin: 0 0 10px 0;">Next Steps</h3>
                                <p style="margin: 0; color: #155724;">Our team will contact you within 24-48 hours to discuss the disbursement process.</p>
                            </div>
                        </div>
                        <div style="text-align: center; margin-top: 30px; color: #666;">
                            <p style="margin: 0;">Best regards,<br>UdyamKings Team</p>
                        </div>
                    </div>
                `,
                text_content: `
                    Congratulations! Your loan application has been approved.
                    
                    Application Details:
                    Business Name: {{business_name}}
                    Amount Approved: ₹{{amount_approved}}
                    Application ID: #{{application_id}}
                    
                    Next Steps:
                    Our team will contact you within 24-48 hours to discuss the disbursement process.
                    
                    Best regards,
                    UdyamKings Team
                `,
                variables: ['business_name', 'amount_approved', 'application_id'],
                description: 'Sent when a loan application is approved',
                category: 'application'
            },
            {
                name: 'application_rejected',
                subject: 'Update on Your Loan Application',
                html_content: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: #f8d7da; color: #721c24; padding: 30px; border-radius: 10px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px;">Application Update</h1>
                            <p style="margin: 10px 0; font-size: 16px;">We regret to inform you that your loan application could not be approved at this time</p>
                        </div>
                        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
                            <h2 style="color: #333; margin-bottom: 20px;">Application Details</h2>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Business Name:</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{business_name}}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Amount Requested:</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">₹{{amount_requested}}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Application ID:</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">#{{application_id}}</td>
                                </tr>
                            </table>
                            {{#if rejection_reason}}
                            <div style="margin-top: 30px; padding: 20px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                                <h3 style="color: #856404; margin: 0 0 10px 0;">Reason for Rejection</h3>
                                <p style="margin: 0; color: #856404;">{{rejection_reason}}</p>
                            </div>
                            {{/if}}
                        </div>
                        <div style="text-align: center; margin-top: 30px; color: #666;">
                            <p style="margin: 0;">We encourage you to review your application and reapply after addressing any concerns.<br>Best regards,<br>UdyamKings Team</p>
                        </div>
                    </div>
                `,
                text_content: `
                    Update on Your Loan Application
                    
                    We regret to inform you that your loan application could not be approved at this time.
                    
                    Application Details:
                    Business Name: {{business_name}}
                    Amount Requested: ₹{{amount_requested}}
                    Application ID: #{{application_id}}
                    
                    {{#if rejection_reason}}
                    Reason for Rejection:
                    {{rejection_reason}}
                    {{/if}}
                    
                    We encourage you to review your application and reapply after addressing any concerns.
                    
                    Best regards,
                    UdyamKings Team
                `,
                variables: ['business_name', 'amount_requested', 'application_id', 'rejection_reason'],
                description: 'Sent when a loan application is rejected',
                category: 'application'
            },
            {
                name: 'payment_received',
                subject: 'Payment Received - UdyamKings Application',
                html_content: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: #d4edda; color: #155724; padding: 30px; border-radius: 10px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px;">Payment Successful!</h1>
                            <p style="margin: 10px 0; font-size: 16px;">We have received your application fee payment</p>
                        </div>
                        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
                            <h2 style="color: #333; margin-bottom: 20px;">Payment Details</h2>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Payment ID:</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{payment_id}}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Amount:</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">₹{{amount}}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Date:</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{payment_date}}</td>
                                </tr>
                            </table>
                        </div>
                        <div style="text-align: center; margin-top: 30px; color: #666;">
                            <p style="margin: 0;">Thank you for your payment. Your application is now under review.<br>Best regards,<br>UdyamKings Team</p>
                        </div>
                    </div>
                `,
                variables: ['payment_id', 'amount', 'payment_date'],
                description: 'Sent when application fee payment is received',
                category: 'payment'
            }
        ];

        for (const template of defaultTemplates) {
            const existing = await EmailTemplate.findOne({
                where: { name: template.name }
            });
            
            if (!existing) {
                await EmailTemplate.create(template);
            }
        }
    };

    return EmailTemplate;
};
