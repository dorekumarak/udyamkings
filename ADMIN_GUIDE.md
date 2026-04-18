# UdyamKings Admin Guide

## Table of Contents
1. [Admin Dashboard](#admin-dashboard)
2. [Managing Applications](#managing-applications)
3. [Payment Management](#payment-management)
4. [Form Fields Management](#form-fields-management)
5. [Content Management](#content-management)
6. [Email Templates](#email-templates)
7. [System Settings](#system-settings)
8. [User Management](#user-management)
9. [Troubleshooting](#troubleshooting)

## Admin Dashboard

### Accessing the Admin Panel
1. Go to: `https://yourdomain.com/admin`
2. Log in with your admin credentials

### Dashboard Overview
- View key metrics and statistics
- Quick access to recent applications
- System status and notifications

## Managing Applications

### Viewing Applications
1. Click on "Applications" in the sidebar
2. Use filters to find specific applications
3. Click on any application to view details

### Application Actions
- **View Details**: Click on any application
- **Download Documents**: Click the download icon
- **Change Status**: Use the status dropdown
- **Add Notes**: Click "Add Note" button
- **Export to CSV**: Click "Export" button

### Application Statuses
- **Pending**: New application
- **In Review**: Under review
- **Approved**: Application approved
- **Rejected**: Application rejected
- **Completed**: Process completed

## Payment Management

### Viewing Payments
1. Click on "Payments" in the sidebar
2. Filter by status, date, or amount
3. View payment details by clicking on any payment

### Processing Refunds
1. Find the payment in the list
2. Click "Refund" button
3. Enter refund amount and reason
4. Click "Process Refund"

### Payment Statuses
- **Pending**: Payment initiated
- **Completed**: Payment successful
- **Failed**: Payment failed
- **Refunded**: Payment refunded
- **Partially Refunded**: Partial refund issued

## Form Fields Management

### Editing Form Fields
1. Go to "Form Fields" in the sidebar
2. Click on the field you want to edit
3. Update field properties:
   - Label
   - Type (text, number, select, etc.)
   - Required status
   - Options (for select fields)
4. Click "Save Changes"

### Adding New Fields
1. Click "Add New Field"
2. Fill in field details
3. Set validation rules
4. Click "Create Field"

### Reordering Fields
1. Click and drag the handle (≡) next to each field
2. Fields will automatically save their new order

## Content Management

### Updating Website Content
1. Go to "Content" in the sidebar
2. Select the page/section to edit
3. Make your changes using the editor
4. Click "Save Changes"

### Managing Images
1. Click "Media Library" in the content section
2. Upload new images or select existing ones
3. Add alt text and captions
4. Insert into content using the image button

## Email Templates

### Editing Email Templates
1. Go to "Email Templates" in the sidebar
2. Select the template to edit
3. Use the editor to modify content
4. Use variables (e.g., {{name}}, {{email}})
5. Click "Save Template"

### Available Templates
- **Welcome Email**: Sent on registration
- **Application Received**: When application is submitted
- **Application Approved**: When application is approved
- **Application Rejected**: When application is rejected
- **Payment Confirmation**: After successful payment
- **Password Reset**: For password reset requests

## System Settings

### General Settings
1. Go to "Settings" > "General"
2. Update:
   - Site title and description
   - Contact information
   - Default currency
   - Date format
3. Click "Save Changes"

### Payment Settings
1. Go to "Settings" > "Payments"
2. Configure:
   - Razorpay API keys
   - Payment methods
   - Tax settings
   - Invoice settings
3. Click "Save Changes"

### Email Settings
1. Go to "Settings" > "Email"
2. Configure SMTP settings:
   - SMTP host
   - Port
   - Username/Password
   - From email address
3. Test email configuration
4. Click "Save Changes"

## User Management

### Adding New Admin Users
1. Go to "Users" in the sidebar
2. Click "Add New User"
3. Fill in user details
4. Set role to "Admin"
5. Click "Create User"

### Managing User Permissions
1. Go to "Users"
2. Click on the user
3. Update role and permissions
4. Click "Save Changes"

### Resetting Passwords
1. Go to "Users"
2. Click on the user
3. Click "Reset Password"
4. Enter new password
5. Click "Update Password"

## Troubleshooting

### Common Issues

#### Can't log in to admin
- Check if Caps Lock is on
- Reset password if needed
- Contact system administrator if account is locked

#### Form submissions not working
- Check required fields
- Ensure all fields have valid data
- Check browser console for errors

#### Emails not sending
- Verify SMTP settings
- Check spam folder
- Test email configuration

#### Slow performance
- Clear browser cache
- Check server resources
- Optimize database if needed

### Getting Help
For additional support:
1. Check the documentation
2. Contact support@yourdomain.com
3. Include:
   - Description of the issue
   - Steps to reproduce
   - Screenshots if possible
   - Browser and OS information

## Best Practices

### Security
- Use strong, unique passwords
- Enable 2FA if available
- Regularly update admin credentials
- Limit admin access to trusted users

### Backups
- Regular database backups
- Backup uploads directory
- Test restore process periodically

### Maintenance
- Keep system updated
- Monitor system logs
- Review user activity regularly
- Remove inactive admin accounts
