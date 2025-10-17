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
    const data = JSON.parse(event.body);
    
    // Cashfree credentials from environment variables
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const environment = process.env.CASHFREE_ENV || 'TEST';
    
    // Determine API endpoint based on environment
    const apiUrl = environment === 'PROD' 
      ? 'https://api.cashfree.com/pg/orders'
      : 'https://sandbox.cashfree.com/pg/orders';
    
    // Generate unique order ID
    const orderId = 'ORDER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const customerId = 'CUST_' + Date.now();
    
    // Order payload
    const orderPayload = {
      order_id: orderId,
      order_amount: 799.00,
      order_currency: 'INR',
      customer_details: {
        customer_id: customerId,
        customer_phone: data.customerPhone || '9999999999',
        customer_email: data.customerEmail || 'customer@example.com',
        customer_name: data.customerName || 'Customer'
      },
      order_meta: {
        return_url: `${event.headers.origin}/payment-verify.html?order_id=${orderId}`,
        notify_url: `${event.headers.origin}/.netlify/functions/cashfree-webhook`
      },
      order_note: 'Advanced Prompt Engineering Mastery - NexaMind'
    };
    
    console.log('Creating order:', orderId);
    console.log('Customer email:', data.customerEmail);
    
    // Call Cashfree API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01'
      },
      body: JSON.stringify(orderPayload)
    });
    
    const result = await response.json();
    
    if (result.payment_session_id) {
      console.log('Order created successfully:', orderId);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          order_id: orderId,
          payment_session_id: result.payment_session_id,
          message: 'Payment session created successfully'
        })
      };
    } else {
      console.error('Cashfree API Error:', result);
      
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: result.message || 'Failed to create payment session',
          error: result
        })
      };
    }
    
  } catch (error) {
    console.error('Error creating order:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};
