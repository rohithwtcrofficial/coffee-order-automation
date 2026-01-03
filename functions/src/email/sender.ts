// functions/src/email/sender.ts
import * as functions from 'firebase-functions';
import * as nodemailer from 'nodemailer';

export function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: functions.config().email.user,
      pass: functions.config().email.password,
    },
  });
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: `"Coffee Brands" <${functions.config().email.user}>`,
      to,
      subject,
      html,
    });
    
    console.log('Email sent successfully to:', to);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}