import nodemailer from 'nodemailer';
import { logger } from '@/lib/services/logger';

// SMTP 설정 (mail.js를 TypeScript로 변환)
const transporter = nodemailer.createTransport({
  host: 'email-smtp.ap-southeast-2.amazonaws.com',
  port: 587,
  secure: false, // STARTTLS 사용
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

/**
 * 이메일 전송 함수
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, text, html } = options;

  if (!process.env.SMTP_FROM) {
    logger.error('SMTP_FROM environment variable is not defined', 'EMAIL');
    throw new Error('SMTP_FROM environment variable is not defined.');
  }
  
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    logger.error('Email send failed', 'EMAIL', error);
    return false;
  }
}
