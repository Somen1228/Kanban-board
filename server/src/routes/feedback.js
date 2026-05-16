import express from 'express';
import nodemailer from 'nodemailer';
import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import authenticate from '../middleware/auth.js';

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { type, subject, message } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!type || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields: type, subject, message' });
    }

    const feedback = await Feedback.create({
      user_id: userId,
      type,
      subject,
      message,
      user_email: user.email,
    });

    const feedbackTypeLabel = {
      bug: '🐛 Bug Report',
      'feature-request': '✨ Feature Request',
      query: '❓ Query',
      feedback: '💬 Feedback',
    }[type] || type;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'somen1228@gmail.com',
      subject: `[KanDoo] ${feedbackTypeLabel} — ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">${feedbackTypeLabel}</h2>
          <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">
          <p><strong>From:</strong> ${user.display_name || user.email}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
            <p>${message.replace(/\n/g, '<br>')}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">
          <p style="color: #7f8c8d; font-size: 12px;">
            Feedback ID: ${feedback.id}<br>
            Submitted: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Thank you for your feedback!',
      feedbackId: feedback.id,
    });
  } catch (err) {
    console.error('Feedback submission failed:', err);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const feedbacks = await Feedback.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(feedbacks);
  } catch (err) {
    console.error('Failed to fetch feedbacks:', err);
    res.status(500).json({ error: 'Failed to fetch feedbacks' });
  }
});

export default router;
