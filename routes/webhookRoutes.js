const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../controllers/webhookController');

// Razorpay webhook endpoint
router.post('/razorpay', express.json({ verify: (req, res, buf) => {
    req.rawBody = buf.toString();
}}), handleWebhook);

module.exports = router;
