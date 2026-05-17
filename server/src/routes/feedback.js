import express from 'express';
import { Resend } from 'resend';
import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import authenticate from '../middleware/auth.js';

const router = express.Router();

// Resend uses HTTPS (port 443) — works on Render's free tier, unlike SMTP.
const resend = new Resend(process.env.RESEND_API_KEY);
const FEEDBACK_TO   = 'somen1228@gmail.com';
const FEEDBACK_FROM = 'KanDoo Feedback <onboarding@resend.dev>';

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

    const senderLabel = user.display_name || user.email || user.phone || `User #${user.id}`;

    const { error: sendError } = await resend.emails.send({
      from: FEEDBACK_FROM,
      to: FEEDBACK_TO,
      replyTo: user.email || undefined,
      subject: `[KanDoo] ${feedbackTypeLabel} — ${subject} · ${senderLabel}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50; margin: 0 0 4px;">${feedbackTypeLabel}</h2>
          <p style="margin: 0; color: #7f8c8d; font-size: 13px;">${subject}</p>
          <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 16px 0;">

          <table style="font-size: 14px; color: #2c3e50; border-collapse: collapse;">
            <tr><td style="padding: 2px 12px 2px 0; color: #7f8c8d;">Name</td>
                <td style="padding: 2px 0;"><strong>${user.display_name || '—'}</strong></td></tr>
            <tr><td style="padding: 2px 12px 2px 0; color: #7f8c8d;">Email</td>
                <td style="padding: 2px 0;">${user.email
                  ? `<a href="mailto:${user.email}" style="color: #3b82f6;">${user.email}</a>`
                  : '<em style="color:#94a3b8;">none (phone-auth user)</em>'}</td></tr>
            ${user.phone ? `<tr><td style="padding: 2px 12px 2px 0; color: #7f8c8d;">Phone</td>
                <td style="padding: 2px 0;">${user.phone}</td></tr>` : ''}
            <tr><td style="padding: 2px 12px 2px 0; color: #7f8c8d;">User ID</td>
                <td style="padding: 2px 0; font-family: monospace; font-size: 12px;">${user.id}</td></tr>
          </table>

          <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 16px 0;">

          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; font-size: 14px; line-height: 1.5;">
            ${message.replace(/\n/g, '<br>')}
          </div>

          <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 16px 0;">
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">
            Feedback ID: ${feedback.id}<br>
            Submitted: ${new Date().toLocaleString()}
            ${user.email ? '<br>💬 Tip: hitting Reply will email this user directly.' : ''}
          </p>
        </div>
      `,
    });

    if (sendError) {
      console.error('Resend send failed:', sendError);
      // Feedback row was already saved — still return success so the user
      // sees their submission acknowledged; we just lost the email notification.
    }

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
