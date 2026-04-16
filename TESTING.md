# UdyamKings Testing Guide

## Test Accounts

### Admin Account
- **Email:** admin@example.com
- **Password:** Admin@1234
- **Role:** Super Admin (Full access)

### Test User Account
- **Email:** test.user@example.com
- **Password:** Test@1234
- **Role:** Regular User

## Test Checklist

### 1. User Registration & Login
- [ ] Register a new user
- [ ] Verify email with OTP
- [ ] Login with new credentials
- [ ] Test forgot password flow
- [ ] Test password reset

### 2. Application Process
- [ ] Start new application
- [ ] Fill out all form fields
- [ ] Upload required documents
- [ ] Submit application
- [ ] Verify email confirmation

### 3. Payment Process
- [ ] Initiate payment
- [ ] Complete payment (test mode)
- [ ] Verify payment confirmation
- [ ] Test payment failure case
- [ ] Test refund process (admin)

### 4. Admin Functions
- [ ] Login as admin
- [ ] View applications list
- [ ] View application details
- [ ] Download documents
- [ ] Update application status
- [ ] Add internal notes
- [ ] Export applications to CSV

### 5. Email Notifications
- [ ] Registration confirmation
- [ ] Application submission
- [ ] Payment confirmation
- [ ] Status updates
- [ ] Password reset

### 6. Security Tests
- [ ] Test XSS protection
- [ ] Test SQL injection protection
- [ ] Test CSRF protection
- [ ] Test rate limiting
- [ ] Test file upload restrictions

### 7. Mobile Responsiveness
- [ ] Test on mobile devices
- [ ] Test form submission
- [ ] Test document upload
- [ ] Test payment flow

## End-to-End Test Scenario

### Test Case: Complete Application Flow
1. **User Registration**
   - Register as a new user
   - Verify email with OTP
   - Complete profile setup

2. **Application Submission**
   - Start new application
   - Fill all required fields
   - Upload test documents
   - Submit application

3. **Payment Process**
   - Select payment method
   - Complete test payment
   - Verify payment confirmation

4. **Admin Review**
   - Admin logs in
   - Reviews application
   - Updates status
   - Adds internal notes

5. **User Notification**
   - Check email for status update
   - Verify all links in email
   - Test response to notification

## Performance Testing
- [ ] Page load times < 3s
- [ ] Form submission < 5s
- [ ] Document upload < 10s (varies by size)
- [ ] Search response < 2s

## Browser Compatibility
Test on latest versions of:
- [ ] Google Chrome
- [ ] Mozilla Firefox
- [ ] Safari
- [ ] Microsoft Edge

## Test Data

### Test Documents
- PDF: `test-document.pdf` (under 5MB)
- Image: `test-image.jpg` (under 2MB)

### Test Payment Details (Test Mode)
- Card Number: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: Any 3 digits
- OTP: 123456

## Reporting Issues
When reporting issues, please include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots if applicable
5. Browser/Device details

## Test Environment
- **URL:** https://test.yourdomain.com
- **Test Mode:** Enabled
- **Test Cards:** Active
- **Test Emails:** Disabled in production
