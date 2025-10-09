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
    const orderId = data.order_id;
    
    if (!orderId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Order ID is required'
        })
      };
    }
    
    // Cashfree credentials from environment variables
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const environment = process.env.CASHFREE_ENV || 'TEST';
    
    // Determine API endpoint based on environment
    const apiUrl = environment === 'PROD' 
      ? `https://api.cashfree.com/pg/orders/${orderId}`
      : `https://sandbox.cashfree.com/pg/orders/${orderId}`;
    
    console.log('Verifying payment for order:', orderId);
    
    // Call Cashfree API to get order status
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01'
      }
    });
    
    const orderData = await response.json();
    
    console.log('Order status:', orderData.order_status);
    
    if (orderData.order_status) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          order_id: orderId,
          payment_status: orderData.order_status,
          order_amount: orderData.order_amount,
          order_currency: orderData.order_currency
        })
      };
    } else {
      console.error('Failed to get order status:', orderData);
      
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Failed to verify payment status',
          error: orderData
        })
      };
    }
    
  } catch (error) {
    console.error('Error verifying payment:', error);
    
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
