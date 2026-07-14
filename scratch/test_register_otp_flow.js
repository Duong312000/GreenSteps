// test_register_otp_flow.js
// Script to test registration OTP email sending
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createAndSendPendingRegistrationOtp, resendPendingRegistrationOtp } = require('../src/services/otp.service');

(async () => {
  try {
    console.log('Sending registration OTP...');
    const result = await createAndSendPendingRegistrationOtp({
      username: 'testuser_' + Date.now(),
      email: 'your_test_email@example.com', // replace with a real email you can check
      passwordHash: '$2b$10$dummyhashdummyhashdummyhashdummyhashdummyhashdummyhashdummyhash',
    });
    console.log('Result:', result);
    // Wait a bit then try resend
    setTimeout(async () => {
      try {
        console.log('Resending OTP...');
        const resendResult = await resendPendingRegistrationOtp('your_test_email@example.com');
        console.log('Resend result:', resendResult);
      } catch (e) {
        console.error('Resend error:', e);
      }
    }, 5000);
  } catch (err) {
    console.error('Error:', err);
  }
})();
