const { Cashfree, CFEnvironment } = require('cashfree-pg');

// Initialize Cashfree Instance
const cashfree = new Cashfree(
    process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
    process.env.CASHFREE_APP_ID,
    process.env.CASHFREE_SECRET_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, customerName, customerPhone, customerEmail = 'test@example.com' } = req.body;

  if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
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
        return_url: `${process.env.SITE_URL || 'https://www.taxihousebengaluru.com'}/payment-status?order_id={order_id}`
      }
    };

    const response = await cashfree.PGCreateOrder(request);
    console.log('[API] Cashfree Response received');
    res.status(200).json(response.data);
  } catch (err) {
    const errorMsg = err.response?.data || err.message;
    console.error('Error creating Cashfree order:', errorMsg);
    res.status(500).json({ 
      error: 'Failed to create Cashfree order', 
      details: errorMsg 
    });
  }
};
