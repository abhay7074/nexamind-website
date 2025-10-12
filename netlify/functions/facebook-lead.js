// netlify/functions/facebook-lead.js

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
    
    const PIXEL_ID = process.env.FB_PIXEL_ID;
    const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
    
    if (!PIXEL_ID || !ACCESS_TOKEN) {
      console.error('Missing Facebook credentials');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    // Get client IP for better matching
    const clientIp = event.headers['x-forwarded-for'] || 
                     event.headers['client-ip'] || 
                     '';

    // Get user agent
    const userAgent = event.headers['user-agent'] || '';

    // Build event data
    const eventData = {
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: data.event_source_url || '',
      user_data: {
        client_ip_address: clientIp,
        client_user_agent: userAgent,
        fbp: data.fbp || null,
        fbc: data.fbc || null
      }
    };

    console.log('Sending Lead event (90% scroll) to Facebook CAPI');
    console.log('Event data:', JSON.stringify(eventData, null, 2));

    // Send to Facebook Conversions API
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: [eventData]
        })
      }
    );

    const result = await response.json();
    
    console.log('Facebook CAPI response:', result);

    if (result.events_received) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Lead event sent successfully',
          events_received: result.events_received
        })
      };
    } else {
      console.error('Facebook CAPI error:', result);
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: result
        })
      };
    }

  } catch (error) {
    console.error('Error sending Lead event:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
