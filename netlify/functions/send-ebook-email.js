const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { customerEmail, customerName, orderId } = JSON.parse(event.body);

    if (!customerEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    // Create transporter using Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email content
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: '🎉 Your NexaMind AI Mastery Guide is Ready!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FF006E 0%, #8338EC 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #FF006E; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .feature-item { margin: 10px 0; padding-left: 25px; position: relative; }
            .feature-item:before { content: "✅"; position: absolute; left: 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to NexaMind!</h1>
              <p style="margin: 10px 0 0; font-size: 16px;">Your AI Mastery Journey Starts Now</p>
            </div>
            
            <div class="content">
              <h2 style="color: #FF006E; margin-top: 0;">Hi ${customerName || 'there'}! 👋</h2>
              
              <p style="font-size: 16px; margin: 20px 0;">
                Thank you for purchasing the <strong>Advanced Prompt Engineering Mastery</strong> guide!
              </p>
              
              <p style="font-size: 16px; margin: 20px 0;">
                Your complete AI mastery system is attached to this email as a PDF. Download it now and start transforming your AI results today!
              </p>
              
              <div class="features">
                <h3 style="margin-top: 0; color: #333;">📚 What's Inside Your Guide:</h3>
                <div class="feature-item">5 Proven Methods to Master AI (PTCF, Act As, Ask Me, Primer, Break It Down)</div>
                <div class="feature-item">64-Page Complete Step-by-Step Guide</div>
                <div class="feature-item">700+ Ready-Made Professional Prompts</div>
                <div class="feature-item">30-Day Mastery Roadmap</div>
                <div class="feature-item">Template Library for Immediate Use</div>
                <div class="feature-item">Troubleshooting Guide</div>
              </div>
              
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <h3 style="margin-top: 0; color: #856404;">🚀 Quick Start (Do This Today!):</h3>
                <ol style="margin: 0; padding-left: 20px;">
                  <li>Download the PDF attachment below</li>
                  <li>Read Chapter 1 - The PTCF Framework (takes 15 minutes)</li>
                  <li>Try your first professional prompt</li>
                  <li>Watch your AI results transform immediately!</li>
                </ol>
              </div>
              
              <p style="font-size: 16px; margin: 20px 0;">
                <strong>Order ID:</strong> ${orderId || 'N/A'}<br>
                <strong>Download:</strong> See PDF attachment below ⬇️
              </p>
              
              <div style="background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="margin: 0; font-size: 14px;">
                  <strong>💡 Pro Tip:</strong> Save this email! You can download the PDF anytime. Forward it to your devices for easy access everywhere.
                </p>
              </div>
              
              <p style="font-size: 16px; margin: 30px 0 10px;">
                Need help or have questions? Simply reply to this email - we're here to help you succeed!
              </p>
              
              <p style="font-size: 16px; margin: 20px 0;">
                To your AI mastery,<br>
                <strong>Team NexaMind</strong><br>
                <em>Think Ahead with AI™</em>
              </p>
            </div>
            
            <div class="footer">
              <p>© 2024 NexaMind. All rights reserved.</p>
              <p>
                <a href="https://trynexamind.com" style="color: #FF006E; text-decoration: none;">Website</a> • 
                <a href="mailto:nexamindai707@gmail.com" style="color: #FF006E; text-decoration: none;">Support</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      // We'll add the PDF attachment in next step - for now, just send without it
     text: `Hi ${customerName || 'there'}!\n\nThank you...Think Ahead with AI™`,
      attachments: [
        {
          filename: 'NexaMind-Complete-Package-with-Bonus.rar',
          path: path.join(__dirname, '../../assets/Complete package with bonus.rar'),
          contentType: 'application/x-rar-compressed'
        }
      ]
    };
    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', info.messageId);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        messageId: info.messageId 
      })
    };

  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to send email',
        details: error.message 
      })
    };
  }
};
