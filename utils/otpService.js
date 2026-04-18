// Simple OTP service used during development.
// Currently logs OTPs to the console instead of sending real emails.
// TODO: Replace console OTP sender with real email sender (Gmail/SendGrid SMTP) once flows are stable.

/**
 * Generate a 6-digit numeric OTP as a string.
 */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * "Send" an OTP to the given email address.
 * For now this just logs to the server console.
 * Later this should be replaced with a real email provider.
 *
 * @param {string} email - Recipient email address
 * @param {string} otp - OTP code to send
 */
function sendOtpToEmail(email, otp) {
  // In development, just log to console so you can copy it during tests
  console.log(`[OTP SERVICE] OTP for ${email}: ${otp}`);
}

module.exports = {
  generateOtp,
  sendOtpToEmail,
};
