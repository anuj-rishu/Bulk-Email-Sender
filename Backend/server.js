require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: 'Gmail', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send individual email
const sendEmail = async (email, name, subject, body) => {

  const emailTemplate = `
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; border-radius: 5px;">
      <tr>
        <td style="padding: 20px;">
          <h1 style="color: #4a5568; margin-bottom: 20px;">Hello ${name},</h1>
          <div style="background-color: #ffffff; border-radius: 5px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2d3748; margin-bottom: 15px;">${subject}</h2>
            <p style="margin-bottom: 15px;">${body}</p>
          </div>
          <p style="margin-top: 20px; font-size: 14px; color: #718096;">This is an automated message, please do not reply directly to this email.</p>
        </td>
      </tr>
    </table>
  </body>
`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: emailTemplate,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email sent to: ${email}`);
  return info;
};

// Batch email sending
const sendBatchEmails = async (users, subject, body, batchSize = 100) => {
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    
    await Promise.all(batch.map(user => sendEmail(user.email, user.name, subject, body)));
    
    console.log(`Batch ${i / batchSize + 1} of emails sent successfully`);
    
    // Optional: delay to avoid overwhelming the server or email provider
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay between batches
  }
};

// API endpoint to receive users, subject, and email body
app.post('/api/send-emails', async (req, res) => {
  const { users, subject, body } = req.body;

  if (!users || users.length === 0) {
    return res.status(400).json({ message: 'No users provided.' });
  }

  try {
    await sendBatchEmails(users, subject, body);
    res.status(200).json({ message: 'All emails sent successfully!' });
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({ message: 'Error sending emails' });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});