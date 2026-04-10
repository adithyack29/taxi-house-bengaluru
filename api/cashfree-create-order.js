const { Cashfree } = require('cashfree-pg');

Cashfree.XClientId = process.env.CASHFREE_APP_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
Cashfree.XEnvironment = process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION' 
    ? Cashfree.Environment.PRODUCTION 
    : Cashfree.Environment.SANDBOX;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, customerName, customerPhone, customerEmail = 'test@example.com' } = req.body;

  if (!Cashfree.XClientId || !Cashfree.XClientSecret) {
    return res.status(500).json({ error: 'Cashfree API keys are not configured.' });
  }

  try {
    const request = {
      order_amount: parseFloat(amount).toFixed(2),
      order_currency: "INR",
      order_id: "order_" + Date.now(),
      customer_details: {
        customer_id: "cust_" + customerPhone, // Unique ID for customer
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail
      },
      order_meta: {
        // In V3, the SDK handles the response, but we can provide a return_url for redundancy
        return_url: "https://taxihouse.app/payment-status?order_id={order_id}"
      }
    };

    const response = await Cashfree.PGCreateOrder("2023-08-01", request);
    res.status(200).json(response.data);
  } catch (err) {
    console.error('Error creating Cashfree order:', err.response?.data || err.message);
    res.status(500).json({ 
      error: 'Failed to create Cashfree order', 
      details: err.response?.data || err.message 
    });
  }
};
