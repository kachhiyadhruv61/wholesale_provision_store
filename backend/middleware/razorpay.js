const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SU9OILjNd5mGst',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'JwAYo6QQvvn0NRDV4vehC52U',
});

module.exports = razorpay;
