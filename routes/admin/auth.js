const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const {
    login,
    getMe,
    logout,
    updateDetails,
    updatePassword
} = require('../../controllers/admin/authController');

// Public routes
router.post('/login', login);

// Protected routes
router.use(protect);
router.get('/me', getMe);
router.get('/logout', logout);
router.put('/updatedetails', updateDetails);
router.put('/updatepassword', updatePassword);

module.exports = router;
