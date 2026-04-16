const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function testPayment() {
    try {
        const order = await razorpay.orders.create({
            amount: 1000, // 10.00 INR
            currency: 'INR',
            receipt: 'test_receipt_' + Date.now()
        });

        console.log('Test Order Created:');
        console.log(order);

        const payment = {
            order_id: order.id,
            payment_id: 'test_payment_' + Date.now(),
            signature: crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(order.id + '|' + 'test_payment_' + Date.now())
                .digest('hex')
        };

        console.log('\nTest Payment Details:');
        console.log(payment);

    } catch (error) {
        console.error('Test payment error:', error);
    }
}

testPayment();
