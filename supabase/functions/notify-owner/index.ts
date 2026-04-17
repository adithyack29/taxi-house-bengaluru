// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// @ts-ignore
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
// @ts-ignore
const OWNER_EMAIL = Deno.env.get('OWNER_EMAIL')

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: any
  old_record: any | null
  schema: string
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const payload: WebhookPayload = await req.json()
    const { table, record, old_record, type } = payload

    let subject = ''
    let htmlContent = ''
    let shouldNotify = false

    if (table === 'bookings') {
      // --- LOGIC: Only notify on Payment Success or Payment Failure (Skip Attempts) ---
      const isSuccess = (type === 'UPDATE' && old_record?.status !== 'confirmed' && record.status === 'confirmed');
      const isFailure = (type === 'UPDATE' && old_record?.status !== 'failed' && record.status === 'failed');

      if (isSuccess || isFailure) {
        shouldNotify = true
        
        // Robust price calculation
        const audit = record.audit_data || {};
        const calculatedFare = (
          Number(audit.totalFare || 0) || 
          Number(audit.total || 0) || 
          (Number(audit.baseFare || 0) + 
           Number(audit.totalDayBata || 0) + 
           Number(audit.totalNightBata || 0))
        );
        
        const displayFare = calculatedFare > 0 
          ? calculatedFare.toLocaleString('en-IN') 
          : (record.total_fare || 'N/A');

        if (isSuccess) {
          subject = `✅ PAID: Booking Confirmed - ${record.user_name}`
          htmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; border-top: 6px solid #10B981;">
              <h2 style="color: #000; margin: 0 0 5px; font-size: 22px;">Success! Trip Paid</h2>
              <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">The customer completed the payment successfully.</p>
              
              <div style="background: #f9fafb; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <p><strong>Customer:</strong> ${record.user_name}</p>
                <p><strong>Vehicle:</strong> ${record.car_type}</p>
                <p><strong>Trip:</strong> ${record.trip_category} (${record.sub_type})</p>
              </div>

              <div style="background: #111827; color: #fff; padding: 15px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #94A3B8;">Revenue Collected</p>
                <p style="margin: 5px 0 0; font-size: 28px; font-weight: 900; color: #EAB308;">₹${displayFare}</p>
              </div>

              <a href="https://www.taxihousebengaluru.com/admin" style="display: block; background: #EAB308; color: #000; text-align: center; padding: 14px; border-radius: 10px; text-decoration: none; font-weight: bold;">Open Dashboard</a>
            </div>
          `
        } else {
          subject = `❌ FAILED: Payment Rejected - ${record.user_name}`
          htmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; border-top: 6px solid #EF4444;">
              <h2 style="color: #EF4444; margin: 0 0 10px; font-size: 20px;">Payment Failed</h2>
              <p>The attempted payment for <strong>${record.user_name}</strong> was rejected or timed out.</p>
              <p><strong>Amount:</strong> ₹${displayFare}</p>
              <a href="tel:${record.phone}" style="display: block; background: #EF4444; color: #fff; text-align: center; padding: 14px; border-radius: 10px; text-decoration: none; font-weight: bold; margin-top: 20px;">Call Customer to Help</a>
            </div>
          `
        }
      }
    } else if (table === 'messages' && type === 'INSERT') {
      shouldNotify = true
      subject = `💬 New Website Inquiry: ${record.name}`
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; border-top: 6px solid #EAB308;">
          <h2 style="color: #000; margin: 0 0 15px; font-size: 20px;">Message Received</h2>
          <p><strong>From:</strong> ${record.name}</p>
          <p><strong>Contact:</strong> ${record.phone} | ${record.email}</p>
          <div style="background: #F9FAFB; padding: 15px; border-radius: 10px; margin: 15px 0; border: 1px solid #f3f4f6;">
            <p style="margin: 0; line-height: 1.6;">${record.message}</p>
          </div>
          <a href="mailto:${record.email}" style="display: block; background: #EAB308; color: #000; text-align: center; padding: 14px; border-radius: 10px; text-decoration: none; font-weight: bold;">Reply via Email</a>
        </div>
      `
    }

    if (!shouldNotify) {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 })
    }

    if (!RESEND_API_KEY || !OWNER_EMAIL) {
      return new Response('Configuration error', { status: 500 })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Taxi Alerts <onboarding@resend.dev>',
        to: [OWNER_EMAIL],
        subject: subject,
        html: htmlContent
      })
    })

    const result = await res.json()
    return new Response(JSON.stringify(result), { status: 200 })

  } catch (err) {
    // @ts-ignore
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
