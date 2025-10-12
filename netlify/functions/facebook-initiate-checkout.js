// netlify/functions/facebook-initiate-checkout.js

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

    // Hash email and phone if provided
    const hashData = (data) => {
      if (!data) return null;
      return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
    };

    // Build event data
    const eventData = {
      event_name: 'InitiateCheckout',
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: data.event_source_url || '',
      user_data: {
        client_ip_address: clientIp,
        client_user_agent: userAgent,
        fbp: data.fbp || null,
        fbc: data.fbc || null
      },
      custom_data: {
        content_name: 'Advanced Prompt Engineering Mastery',
        content_type: 'product',
        value: 799.00,
        currency: 'INR'
      }
    };

    // Add hashed email and phone if provided
    if (data.email) {
      eventData.user_data.em = hashData(data.email);
    }
    if (data.phone) {
      eventData.user_data.ph = hashData(data.phone);
    }

    console.log('Sending InitiateCheckout event to Facebook CAPI');
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
          message: 'InitiateCheckout event sent successfully',
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
    console.error('Error sending InitiateCheckout event:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
