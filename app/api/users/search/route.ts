import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ users: [] });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();

    if (!q) {
      return NextResponse.json({ users: [] });
    }

    const currentUserId = session.user.id as string;

    // Search by name only and never return other users' email/phone — this
    // endpoint previously allowed enumerating PII for every account.
    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        name: { contains: q, mode: 'insensitive' },
      },
      orderBy: { name: 'asc' },
      take: 10,
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
