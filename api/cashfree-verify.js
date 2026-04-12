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

  const { order_id } = req.body;

  if (!order_id) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    console.log(`[Verify] Checking status for Order: ${order_id}`);
    const response = await cashfree.PGFetchOrder(order_id);
    const order = response.data;
    
    console.log(`[Verify] Cashfree response for ${order_id}:`, JSON.stringify(order));

    if (order.order_status === 'PAID') {
      console.log(`[Verify] Order ${order_id} verified as PAID`);
      return res.status(200).json({ 
        status: 'SUCCESS', 
        payment_id: order.cf_order_id, // Standard order ID
        amount: order.order_amount
      });
    } else if (order.order_status === 'ACTIVE') {
      console.log(`[Verify] Order ${order_id} is still ACTIVE/PENDING`);
      return res.status(200).json({ 
        status: 'PENDING', 
        message: 'Order is active but payment not yet confirmed.' 
      });
    } else {
      console.log(`[Verify] Order ${order_id} status: ${order.order_status}`);
      return res.status(200).json({ 
        status: 'FAILED', 
        message: `Order status is ${order.order_status}` 
      });
    }
  } catch (err) {
    const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    console.error(`[Verify] Error for Order ${order_id}:`, errorDetails);
    res.status(500).json({ 
      error: 'Failed to verify Cashfree order', 
      details: errorDetails 
    });
  }
};
