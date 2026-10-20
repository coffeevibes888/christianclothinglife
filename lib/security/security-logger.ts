import 'server-only';

import { prisma } from '@/db/prisma';

export type SecurityEventType =
  | 'failed_login'
  | 'login_success'
  | 'suspicious_activity'
  | 'bot_detected';

export type SecurityEventInput = {
  eventType: SecurityEventType;
  ip?: string | null;
  email?: string | null;
  userAgent?: string | null;
  country?: string | null;
  details?: Record<string, unknown> | null;
};

/**
 * Persist a security/login event. Fire-and-forget: never throw into the
 * auth flow — a logging failure must not block (or allow) a sign-in.
 */
export async function logSecurityEvent(input: SecurityEventInput): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        eventType: input.eventType,
        ip: input.ip || 'unknown',
        email: input.email ?? undefined,
        userAgent: input.userAgent ?? undefined,
        country: input.country ?? undefined,
        details: (input.details ?? undefined) as object | undefined,
      },
    });
  } catch (error) {
    console.error('Failed to log security event', error);
  }
}
