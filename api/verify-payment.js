const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ error: 'Razorpay Key Secret is not configured.' });
  }

  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    // Verify the signature
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      res.status(200).json({ status: 'success', message: 'Payment verified successfully.' });
    } else {
      res.status(400).json({ status: 'failure', message: 'Invalid payment signature.' });
    }
  } catch (err) {
    console.error('Error verifying Razorpay payment:', err);
    res.status(500).json({ error: 'Verification failed', details: err });
  }
};
