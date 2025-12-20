const nodemailer = require("nodemailer");

// Create a transporter with error handling
let transporter;
try {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  console.log('Email service initialized');
} catch (error) {
  console.error('Error initializing email service:', error);
  // Create a dummy transporter that just logs emails instead of sending them
  transporter = {
    sendMail: (mailOptions) => {
      console.log('Email would be sent:', mailOptions);
      return Promise.resolve({ response: 'Email logging only (Gmail auth disabled)' });
    }
  };
}

const sendSubscriptionEmail = async (
  userEmail,
  subscriptionType,
  username = ""
) => {
  const subject =
    subscriptionType === "premium"
      ? "Thank You for Joining Us! 🌍💚"
      : "Subscription Update";

  const premiumTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #074C77;">Hi ${username},</h2>
      <p style="font-size: 16px; line-height: 1.5;">Welcome to Enlighten! 🎉</p>
      <p style="font-size: 16px; line-height: 1.5;">Learn languages, connect globally, and help save nature—10% of our income goes to eco-projects!</p>
      <p style="font-size: 16px; line-height: 1.5;">Let's grow together. 🌱💬</p>
    </div>
  `;

  const freeTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #074C77;">Hi ${username},</h2>
      <p style="font-size: 16px; line-height: 1.5;">Welcome to Enlighten! 🎉</p>
      <p style="font-size: 16px; line-height: 1.5;">You currently have access to:</p>
      <ul style="font-size: 16px; line-height: 1.5;">
        <li>Basic language exchange</li>
        <li>Community access</li>
        <li>Basic chat features</li>
        <li>Limited partner search</li>
      </ul>
      <p style="font-size: 16px; line-height: 1.5;">Upgrade to Premium to unlock all features and help us support eco-projects! 🌱</p>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: subject,
    html: subscriptionType === "premium" ? premiumTemplate : freeTemplate,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log("Subscription email sent successfully to", userEmail);
    return result;
  } catch (error) {
    console.error(`Error sending email to ${userEmail}:`, error);
    // Log the error but don't throw it to prevent application crashes
    // Instead, return a status object indicating failure
    return { 
      success: false, 
      error: error.message,
      fallback: 'Email sending failed, but application continues to function'
    };
  }
};

module.exports = {
  sendSubscriptionEmail,
};
