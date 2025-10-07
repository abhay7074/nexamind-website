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
    
    const pixelId = process.env.FB_PIXEL_ID;
    const accessToken = process.env.FB_ACCESS_TOKEN;
    
    // Hash email and phone if provided (Facebook requires SHA256)
    const hashData = (data) => {
      return data ? crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex') : null;
    };
    
    // Prepare the event data
    const eventData = {
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: data.event_source_url || 'https://trynexamind.com',
      user_data: {
        client_ip_address: event.headers['x-forwarded-for'] || event.headers['client-ip'],
        client_user_agent: event.headers['user-agent'],
        fbc: data.fbc || null,
        fbp: data.fbp || null,
        em: data.email ? [hashData(data.email)] : null,
        ph: data.phone ? [hashData(data.phone)] : null
      },
      custom_data: {
        currency: 'INR',
        value: 799.00,
        content_name: 'Advanced Prompt Engineering Mastery',
        content_type: 'product'
      }
    };

    // Send to Facebook Conversion API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [eventData],
          test_event_code: data.test_event_code || null
        })
      }
    );

    const result = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        result: result
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to send conversion event',
        details: error.message
      })
    };
  }
};
