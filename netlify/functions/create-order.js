// Netlify Function - Create Cashfree Payment Session
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Get credentials from environment variables (SECURE!)
  const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
  const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
  const CASHFREE_ENV = process.env.CASHFREE_ENV || 'TEST';

  // Determine API URL
  const CASHFREE_API_URL = CASHFREE_ENV === 'PROD'
    ? 'https://api.cashfree.com/pg/orders'
    : 'https://sandbox.cashfree.com/pg/orders';

  try {
    // Parse request body (if any)
    let requestData = {};
    if (event.body) {
      try {
        requestData = JSON.parse(event.body);
      } catch (e) {
        console.log('No JSON body provided, using defaults');
      }
    }

    // Generate unique IDs
    const orderId = 'ORDER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const customerId = 'CUST_' + Date.now();

    // Create order payload
    const orderData = {
      order_amount: 799.00,
      order_currency: 'INR',
      order_id: orderId,
      customer_details: {
        customer_id: customerId,
        customer_phone: requestData.customer_phone || '9999999999',
        customer_email: requestData.customer_email || 'customer@trynexamind.com',
        customer_name: requestData.customer_name || 'NexaMind Customer'
      },
      order_meta: {
        return_url: 'https://trynexamind.com/thank-you.html'
      },
      order_note: 'Advanced Prompt Engineering Mastery - NexaMind eBook'
    };

    console.log('Creating Cashfree order:', orderId);

    // Call Cashfree API
    const response = await fetch(CASHFREE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01'
      },
      body: JSON.stringify(orderData)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cashfree API error:', data);
      throw new Error(data.message || 'Cashfree API returned error');
    }

    if (data.payment_session_id) {
      console.log('Payment session created successfully:', data.order_id);
      
      // Success - return session ID
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          payment_session_id: data.payment_session_id,
          order_id: data.order_id
        })
      };
    } else {
      throw new Error('No payment_session_id received from Cashfree');
    }

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to create payment session',
        message: error.message
      })
    };
  }
};
