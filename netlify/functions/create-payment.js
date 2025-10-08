// Netlify Function - Create Cashfree Payment Session
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Cashfree credentials - TEST MODE
  const CASHFREE_APP_ID = 'TEST10829674c7101a07ac618d63fff347692801';
  const CASHFREE_SECRET_KEY = 'cfsk_ma_test_3ab5459ac409903b04dc880b64fe81ab_72fdf4c2';
  const CASHFREE_API_URL = 'https://sandbox.cashfree.com/pg/orders';

  try {
    // Generate unique order ID
    const orderId = 'ORDER_' + Date.now();
    const customerId = 'CUST_' + Date.now();

    // Create order payload
    const orderData = {
      order_amount: 799.00,
      order_currency: 'INR',
      order_id: orderId,
      customer_details: {
        customer_id: customerId,
        customer_phone: '9999999999',
        customer_email: 'customer@nexamind.com'
      },
      order_meta: {
        return_url: `${event.headers.origin}/thank-you.html`,
        notify_url: `${event.headers.origin}/.netlify/functions/payment-webhook`
      },
      order_note: 'Advanced Prompt Engineering Mastery - NexaMind'
    };

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

    if (data.payment_session_id) {
      // Success - return session ID
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          sessionId: data.payment_session_id,
          orderId: data.order_id
        })
      };
    } else {
      // Error from Cashfree
      console.error('Cashfree error:', data);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.string
