import { prisma } from '@/db/prisma';
import { revalidatePath } from 'next/cache';

export async function blockIp(ip: string, opts?: { reason?: string; createdByUserId?: string }) {
  if (!ip) throw new Error('IP is required');

  const blocked = await prisma.blockedIp.upsert({
    where: { ip },
    update: {
      active: true,
      reason: opts?.reason,
    },
    create: {
      ip,
      reason: opts?.reason,
      createdBy: opts?.createdByUserId,
    },
  });

  // Revalidate super-admin or settings pages if needed
  revalidatePath('/super-admin');
  revalidatePath('/admin/settings');

  return blocked;
}

export async function unblockIp(ip: string) {
  if (!ip) throw new Error('IP is required');

  const existing = await prisma.blockedIp.findUnique({ where: { ip } });
  if (!existing) return null;

  const updated = await prisma.blockedIp.update({
    where: { ip },
    data: { active: false },
  });

  revalidatePath('/super-admin');
  revalidatePath('/admin/settings');

  return updated;
}

export async function listBlockedIps() {
  return prisma.blockedIp.findMany({
    orderBy: { createdAt: 'desc' },
  });
}
