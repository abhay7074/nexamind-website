const crypto = require('crypto');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const webhookData = JSON.parse(event.body);
    
    // Get Cashfree credentials
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    
    // Verify webhook signature for security
    const receivedSignature = event.headers['x-webhook-signature'];
    const timestamp = event.headers['x-webhook-timestamp'];
    
    if (receivedSignature && timestamp) {
      // Create signature for verification
      const signatureData = timestamp + event.body;
      const computedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(signatureData)
        .digest('base64');
      
      // Verify signature
      if (computedSignature !== receivedSignature) {
        console.error('Invalid webhook signature');
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Invalid signature' })
        };
      }
    }
    
    console.log('Webhook received:', webhookData.type);
    
    // Handle payment success
    if (webhookData.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const paymentData = webhookData.data;
      const orderId = paymentData.order.order_id;
      const orderAmount = paymentData.order.order_amount;
      const paymentStatus = paymentData.payment.payment_status;
      
      console.log('Payment successful:', {
        orderId: orderId,
        amount: orderAmount,
        status: paymentStatus
      });
      
      // Extract customer details
      const customerEmail = paymentData.customer_details?.customer_email;
      const customerPhone = paymentData.customer_details?.customer_phone;
      
      // Send to Facebook Conversion API
      await sendToFacebookCAPI({
        orderId: orderId,
        amount: orderAmount,
        email: customerEmail,
        phone: customerPhone
      });
      
      // Send ebook email automatically
if (customerEmail) {
  try {
    await sendEbookEmail({
      customerEmail: customerEmail,
      customerName: paymentData.customer_details?.customer_name || customerEmail.split('@')[0],
      orderId: orderId
    });
    console.log('Ebook email sent successfully to:', customerEmail);
  } catch (emailError) {
    console.error('Failed to send ebook email:', emailError);
    // Don't fail the webhook if email fails - we still record the payment
  }
}
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true,
          message: 'Webhook processed successfully' 
        })
      };
    }
    
    // Handle payment failure
    if (webhookData.type === 'PAYMENT_FAILED_WEBHOOK') {
      console.log('Payment failed:', webhookData.data.order.order_id);
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true,
          message: 'Payment failure recorded' 
        })
      };
    }
    
    // Other webhook types
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        message: 'Webhook received' 
      })
    };
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Webhook processing failed',
        message: error.message
      })
    };
  }
};

// Function to send purchase event to Facebook CAPI
async function sendToFacebookCAPI(orderData) {
  try {
    const pixelId = process.env.FB_PIXEL_ID;
    const accessToken = process.env.FB_ACCESS_TOKEN;
    
    // Hash email and phone
    const hashData = (data) => {
      return data ? crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex') : null;
    };
    
    const eventData = {
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: 'https://trynexamind.com',
      user_data: {
        em: orderData.email ? [hashData(orderData.email)] : null,
        ph: orderData.phone ? [hashData(orderData.phone)] : null
      },
      custom_data: {
        currency: 'INR',
        value: orderData.amount,
        content_name: 'Advanced Prompt Engineering Mastery',
        content_type: 'product',
        order_id: orderData.orderId
      }
    };
    
    // Use native fetch instead of node-fetch
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [eventData]
        })
      }
    );
    
    const result = await response.json();
    console.log('Facebook CAPI Success:', result);
    
  } catch (error) {
    console.error('Facebook CAPI Error:', error);
  }
}

// Function to send ebook email
async function sendEbookEmail(orderData) {
  try {
    // Call the email function
    const response = await fetch(
      'https://trynexamind.com/.netlify/functions/send-ebook-email',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail: orderData.customerEmail,
          customerName: orderData.customerName,
          orderId: orderData.orderId
        })
      }
    );
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to send email');
    }
    
    console.log('Email sent successfully:', result);
    return result;
    
  } catch (error) {
    console.error('Error calling email function:', error);
    throw error;
  }
}
