# How to Fix Gmail Email Authentication Error

The server is currently showing this error:
```
Error sending email to mdarafat1661@gmail.com: Error: Invalid login: 534-5.7.9 Please log in with your web browser and then try again.
```

This is happening because Google no longer allows "less secure apps" to access Gmail accounts with just a password. Here's how to fix it:

## Option 1: Use App Password (Recommended for Development)

1. **Enable 2-Step Verification** for your Google account:
   - Go to your Google Account > Security
   - Enable 2-Step Verification if not already enabled

2. **Generate an App Password**:
   - Go to your Google Account > Security > App Passwords
   - Select "Mail" as the app and give it a name (e.g., "Language Exchange App")
   - Copy the 16-character password that Google generates

3. **Update your .env file** with the new app password:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   ```

## Option 2: Use OAuth2 Authentication (Better for Production)

For a more secure approach in production, use OAuth2:

1. Update the email service configuration in `utils/emailService.js`:

```javascript
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

// Create OAuth2 client
const oauth2Client = new OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

// Set refresh token
oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN
});

const createTransporter = async () => {
  try {
    // Get access token
    const accessToken = await oauth2Client.getAccessToken();
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: accessToken.token
      }
    });
    
    return transporter;
  } catch (error) {
    console.error("Error creating transporter:", error);
    throw error;
  }
};

const sendSubscriptionEmail = async (userEmail, subscriptionType, username = "") => {
  try {
    const transporter = await createTransporter();
    
    // Rest of your email sending code...
    // ...
  } catch (error) {
    console.error("Error sending subscription email:", error);
    throw error;
  }
};

module.exports = {
  sendSubscriptionEmail
};
```

2. Set up OAuth2 credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the Gmail API
   - Create OAuth credentials
   - Get your client ID, client secret, and refresh token

3. Update your .env file:
   ```
   EMAIL_USER=your-email@gmail.com
   GMAIL_CLIENT_ID=your-client-id
   GMAIL_CLIENT_SECRET=your-client-secret
   GMAIL_REFRESH_TOKEN=your-refresh-token
   ```

## Option 3: Use a Different Email Service

Consider using a dedicated email service like SendGrid, Mailgun, or AWS SES which are designed for application email sending.

## Temporary Solution: Disable Email Sending

If you want to continue development without fixing the email issue immediately, you can modify the email service to log emails instead of sending them:

```javascript
const sendSubscriptionEmail = async (userEmail, subscriptionType, username = "") => {
  // Create email content as before...
  
  // Instead of sending, just log it
  console.log("Email would be sent:", {
    to: userEmail,
    subject: subject,
    content: subscriptionType === "premium" ? premiumTemplate : freeTemplate
  });
  
  // Skip actual sending
  return true;
};
```

This will allow your application to continue functioning while you implement a proper email solution.
