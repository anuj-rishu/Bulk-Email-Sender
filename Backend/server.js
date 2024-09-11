require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Setup multer for handling attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send individual email with attachments and reply-to functionality
const sendEmail = async (email, name, subject, body, replyTo, attachments) => {
  const emailTemplate = `
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1000px; margin: 0 auto; padding: 20px; background-color: #f4f4f9;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <tr>
          <td style="padding: 20px; text-align: center;">
            <img src="https://res.cloudinary.com/dtberehdy/image/upload/v1726069148/ecell%20logo.jpg" alt="Company Logo" style="max-width:90px; margin-bottom: 5px; border-radius: 50%;">
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; text-align: justify;">
            <h2 style="color: #4a5568; margin-bottom: 1px;">Hello ${name},</h2>
            <div style="background-color: #ffffff; border-radius: 5px; padding: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="margin-bottom: 15px; color: #1a202c;">${body}</h3>
            </div>
            <p style="margin-top: 20px; font-size: 14px; color: #718096;">This is an automated message, please do not reply directly to this email.</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; text-align: center;">
  <table style="margin: 0 auto;">
    <tr>
            <td style="padding: 20px; text-align: center;">
        <table style="margin: 0 auto;">
          <tr>
            <td>
              <div style="display: flex; justify-content: center;">
                <a href="https://facebook.com">
                  <img src="https://res.cloudinary.com/dtberehdy/image/upload/v1726070805/whatsapp-brands-solid-removebg-preview_qjhnpw.png" alt="Facebook" style="width: 15px; height: 16px; margin: 0 10px;">
                </a>
                <a href="https://twitter.com">
                  <img src="https://res.cloudinary.com/dtberehdy/image/upload/v1726070805/linkedin-brands-solid-removebg-preview_a2dnwr.png" alt="Twitter" style="width: 15px; height: 16px; margin: 0 10px;">
                </a>
                <a href="https://linkedin.com">
                  <img src="https://res.cloudinary.com/dtberehdy/image/upload/v1726070804/instagram-brands-solid-removebg-preview_c6xvqz.png" alt="LinkedIn" style="width: 15px; height: 16px; margin: 0 10px;">
                </a>
              </div>
            </td>
          </tr>
        </table>
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
    replyTo: replyTo, // Add Reply-To field
    attachments: attachments.map(file => ({
      filename: file.originalname,
      path: path.join(__dirname, 'uploads', file.filename)
    }))
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email sent to: ${email}`);
  return info;
};

// Batch email sending with attachments and reply-to functionality
const sendBatchEmails = async (users, subject, body, replyTo, attachments, batchSize = 100) => {
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    
    await Promise.all(batch.map(user => sendEmail(user.email, user.name, subject, body, replyTo, attachments)));
    
    console.log(`Batch ${i / batchSize + 1} of emails sent successfully`);
    
    // Optional: delay to avoid overwhelming the server or email provider
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay between batches
  }
};

// API endpoint to receive users, subject, body, replyTo, and attachments
app.post('/api/send-emails', upload.any(), async (req, res) => {
  const users = JSON.parse(req.body.users);
  const { subject, body, replyTo } = req.body;

  if (!users || users.length === 0) {
    return res.status(400).json({ message: 'No users provided.' });
  }

  try {
    await sendBatchEmails(users, subject, body, replyTo, req.files);
    res.status(200).json({ message: 'All emails sent successfully!' });
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({ message: 'Error sending emails' });
  } finally {
    // Clean up uploaded files after sending
    req.files.forEach(file => fs.unlinkSync(path.join(__dirname, 'uploads', file.filename)));
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});