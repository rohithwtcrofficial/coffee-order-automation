import nodemailer from 'nodemailer';
import { defineSecret } from 'firebase-functions/params';

/**
 * Secrets (Cloud Functions v2)
 */
const EMAIL_USER = defineSecret('EMAIL_USER');
const EMAIL_PASSWORD = defineSecret('EMAIL_PASSWORD');
const EMAIL_FROM_NAME = defineSecret('EMAIL_FROM_NAME');

let transporter: nodemailer.Transporter | null = null;

/**
 * Create & reuse transporter
 */
function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER.value(),
      pass: EMAIL_PASSWORD.value(),
    },
  });

  return transporter;
}

/**
 * Send email
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    const transport = getTransporter();

    const info = await transport.sendMail({
      from: `"${EMAIL_FROM_NAME.value()}" <${EMAIL_USER.value()}>`,
      to,
      subject,
      html,
    });

    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
