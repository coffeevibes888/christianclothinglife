import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { auth } from '@/auth';

export async function POST() {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== 'admin' && role !== 'superAdmin') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  await prisma.analyticsEvent.deleteMany({});

  return NextResponse.json({ success: true, message: 'Analytics statistics cleared' });
}
