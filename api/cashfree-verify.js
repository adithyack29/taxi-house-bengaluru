const { Cashfree, CFEnvironment } = require('cashfree-pg');
const { createClient } = require('@supabase/supabase-js');

// Initialize Cashfree Instance
const cashfree = new Cashfree(
    process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
    process.env.CASHFREE_APP_ID,
    process.env.CASHFREE_SECRET_KEY
);

// Initialize Supabase Client
// Using Service Role Key is preferred for backend updates to bypass RLS
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
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
      console.log(`[Verify] Order ${order_id} verified as PAID. Updating Supabase...`);
      
      // 1. Update Supabase status
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed', 
          payment_status: 'paid',
          cashfree_payment_status: 'PAID'
        })
        .eq('cashfree_order_id', order_id)
        .select();

      if (error) {
        console.error('[Verify] Supabase update error:', error);
        // We still return success if Cashfree is paid, but log the DB error
      }

      return res.status(200).json({ 
        status: 'SUCCESS', 
        payment_id: order.cf_order_id,
        amount: order.order_amount,
        db_updated: !!data && data.length > 0
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
