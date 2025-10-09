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
    const environment = process.env.CASHFREE_ENV || 'TEST'; // TEST or PROD
    
    // Determine API endpoint based on environment
    const apiUrl = environment === 'PROD' 
      ? 'https://api.cashfree.com/pg/orders'
      : 'https://sandbox.cashfree.com/pg/orders';
    
    // Generate unique order ID
    const orderId = 'ORDER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const customerId = 'CUST_' + Date.now();
    
    // Get origin from headers
    const origin = event.headers.origin || event.headers.referer || 'https://trynexamind.com';
    const baseUrl = origin.replace(/\/$/, ''); // Remove trailing slash
    
    // Order payload
    const orderPayload = {
      order_id: orderId,
      order_amount: 799.00,
      order_currency: 'INR',
      customer_details: {
        customer_id: customerId,
        customer_phone: data.customer_phone || '9999999999',
        customer_email: data.customer_email || 'customer@example.com',
        customer_name: data.customer_name || 'Customer'
      },
      order_meta: {
        return_url: `${baseUrl}/thank-you.html?order_id=${orderId}`,
        notify_url: `${baseUrl}/.netlify/functions/cashfree-webhook`
      },
      order_note: 'Advanced Prompt Engineering Mastery - NexaMind'
    };
    
    console.log('Creating order:', orderId);
    
    // Call Cashfree API using native fetch
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
