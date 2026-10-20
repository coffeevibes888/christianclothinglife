import nodemailer from 'nodemailer';
import { render } from '@react-email/components';
import * as openpgp from 'openpgp';
import { SENDER_EMAIL, APP_NAME } from '@/lib/constants';
import { Order } from '@/types';

import PurchaseReceiptEmail from './purchase-receipt';
import NewOrderAlertEmail from './new-order-alert';
import VerifyEmail from './verify-email';
import ResetPassword from './reset-password';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
  throw new Error('SMTP configuration is not set in environment variables');
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

const pgpEnabled = process.env.PGP_ENABLE === 'true';
const pgpRecipientPublicKey = process.env.PGP_RECIPIENT_PUBLIC_KEY;

async function encryptIfNeeded(content: string) {
  if (!pgpEnabled || !pgpRecipientPublicKey) {
    return content;
  }

  const publicKey = await openpgp.readKey({ armoredKey: pgpRecipientPublicKey });
  const message = await openpgp.createMessage({ text: content });
  const encrypted = await openpgp.encrypt({ message, encryptionKeys: publicKey });
  return encrypted as string;
}

export const sendPurchaseReceipt = async ({ order }: { order: Order }) => {
  try {
    const html = await render(<PurchaseReceiptEmail order={order} />);
    const body = await encryptIfNeeded(html);

    const info = await transporter.sendMail({
      from: `${APP_NAME} <${SENDER_EMAIL}>`,
      to: order.user.email,
      subject: `Order Confirmation ${order.id}`,
      text: body,
    });

    console.log('✓ Purchase Receipt Email Sent:', info.messageId);
  } catch (err) {
    console.error('❌ Error sending Purchase Receipt email:', err);
  }
};

export const sendNewOrderAlert = async ({
  order,
  to,
}: {
  order: Order;
  to: string | string[];
}) => {
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (!recipients.length) return;

  try {
    const html = await render(<NewOrderAlertEmail order={order} />);
    const body = await encryptIfNeeded(html);

    const info = await transporter.sendMail({
      from: `${APP_NAME} <${SENDER_EMAIL}>`,
      to: recipients,
      subject: `🛒 New order ${order.id} — ${new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(Number(order.totalPrice))}`,
      html: body,
    });

    console.log('✓ New Order Alert Email Sent:', info.messageId);
  } catch (err) {
    console.error('❌ Error sending new order alert email:', err);
  }
};

export const sendOrderDeliveredEmail = async ({
  order,
}: {
  order: { id: string; user: { name?: string | null; email: string } };
}) => {
  if (!order.user?.email) return;

  try {
    const html = `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
        <h2 style="margin:0 0 12px">Your order was delivered 🎉</h2>
        <p style="margin:0 0 8px">Hi ${order.user.name || 'there'},</p>
        <p style="margin:0 0 8px">Your ${APP_NAME} order <strong>${order.id}</strong> has been marked as delivered.</p>
        <p style="margin:0 0 8px">We hope you love it. If anything isn't right, just reply to this email.</p>
        <p style="margin:16px 0 0">Thanks for supporting ${APP_NAME}.</p>
      </div>`;
    const body = await encryptIfNeeded(html);

    const info = await transporter.sendMail({
      from: `${APP_NAME} <${SENDER_EMAIL}>`,
      to: order.user.email,
      subject: `Your order ${order.id} was delivered`,
      html: body,
    });

    console.log('✓ Order Delivered Email Sent:', info.messageId);
  } catch (err) {
    console.error('❌ Error sending order delivered email:', err);
  }
};

export const sendVerificationEmail = async ({
  email,
  verificationLink,
}: {
  email: string;
  verificationLink: string;
}) => {
  try {
    const html = await render(<VerifyEmail email={email} verificationLink={verificationLink} />);
    const body = await encryptIfNeeded(html);

    const info = await transporter.sendMail({
      from: `${APP_NAME} <${SENDER_EMAIL}>`,
      to: email,
      subject: 'Verify your email address',
      text: body,
    });

    console.log('✓ Verification Email Sent:', info.messageId);
  } catch (err) {
    console.error('❌ Error sending verification email:', err);
  }
};

export const sendPasswordResetEmail = async ({
  email,
  resetLink,
}: {
  email: string;
  resetLink: string;
}) => {
  try {
    const html = await render(<ResetPassword email={email} resetLink={resetLink} />);
    const body = await encryptIfNeeded(html);

    const info = await transporter.sendMail({
      from: `${APP_NAME} <${SENDER_EMAIL}>`,
      to: email,
      subject: 'Reset your password',
      text: body,
    });

    console.log('✓ Password Reset Email Sent:', info.messageId);
  } catch (err) {
    console.error('❌ Error sending password reset email:', err);
  }
};