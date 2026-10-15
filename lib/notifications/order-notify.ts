import { prisma } from '@/db/prisma';
import { sendNewOrderAlert } from '@/email';
import { formatCurrency } from '@/lib/utils';
import { APP_NAME, SERVER_URL } from '@/lib/constants';
import type { Order } from '@/types';

/**
 * Resolve who should receive owner/admin order alerts.
 * Priority: ORDER_ALERT_EMAIL env (comma-separated) → admin/superAdmin users.
 */
async function resolveOwnerEmails(): Promise<string[]> {
  const envList = (process.env.ORDER_ALERT_EMAIL || 'vegaswarrior888@gmail.com')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (envList.length) return envList;

  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['admin', 'superAdmin'] } },
      select: { email: true },
    });
    return admins.map((a) => a.email).filter(Boolean);
  } catch (err) {
    console.error('Failed to resolve owner emails for order alert:', err);
    return [];
  }
}

/**
 * Fire a push notification via a webhook (optional).
 * Set ORDER_PUSH_WEBHOOK_URL to a Discord/Slack incoming webhook (or any
 * endpoint). The payload includes the common keys those services read
 * (`content` for Discord, `text` for Slack) plus `title`/`message` for
 * generic consumers like ntfy, Zapier, or Make.
 */
async function sendOwnerPush(order: Order): Promise<void> {
  const url = process.env.ORDER_PUSH_WEBHOOK_URL;
  if (!url) return;

  const itemCount = order.orderitems.reduce((acc, i) => acc + i.qty, 0);
  const title = `New order • ${formatCurrency(order.totalPrice)}`;
  const message =
    `${APP_NAME}: ${order.user?.name || 'A customer'} just ordered ` +
    `${itemCount} item${itemCount === 1 ? '' : 's'} for ${formatCurrency(order.totalPrice)}.\n` +
    `Order ${order.id}\n` +
    `${SERVER_URL}/order/${order.id}`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Title: title },
      body: JSON.stringify({
        content: `**${title}**\n${message}`, // Discord
        text: `*${title}*\n${message}`, // Slack
        title, // ntfy / generic
        message, // ntfy / generic
      }),
    });
  } catch (err) {
    console.error('Failed to send order push notification:', err);
  }
}

/**
 * Notify the store owner of a new paid order via email + optional push.
 * Safe to call fire-and-forget; it never throws.
 */
export async function notifyOwnerOfOrder(order: Order): Promise<void> {
  try {
    const emails = await resolveOwnerEmails();
    await Promise.all([
      emails.length ? sendNewOrderAlert({ order, to: emails }) : Promise.resolve(),
      sendOwnerPush(order),
    ]);
  } catch (err) {
    console.error('notifyOwnerOfOrder failed:', err);
  }
}
