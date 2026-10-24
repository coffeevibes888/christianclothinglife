import { prisma } from '@/db/prisma';

/**
 * User ids whose activity is excluded from the super-admin analytics dashboard.
 * This is every admin / superAdmin account, so the owner's (and staff's) own
 * browsing, clicks, product views, cart events, and searches don't skew the
 * numbers. Falls back to an empty list on error (i.e. no exclusion).
 */
export async function getExcludedAnalyticsUserIds(): Promise<string[]> {
  try {
    const staff = await prisma.user.findMany({
      where: { role: { in: ['admin', 'superAdmin'] } },
      select: { id: true },
    });
    return staff.map((s) => s.id);
  } catch {
    return [];
  }
}

/**
 * Build a Prisma where-fragment that excludes events owned by the given user
 * ids while KEEPING anonymous (null userId) visitor events. Spread it into an
 * existing where clause, e.g. `where: { createdAt: {...}, ...excludeUsersWhere(ids) }`.
 *
 * The explicit `OR: [{ userId: null }, ...]` is required: a bare
 * `userId: { notIn: ids }` would also drop rows where userId is null, which
 * would wipe out all anonymous visitor traffic.
 */
export function excludeUsersWhere(userIds: string[]): Record<string, unknown> {
  if (!userIds.length) return {};
  return { OR: [{ userId: null }, { userId: { notIn: userIds } }] };
}
