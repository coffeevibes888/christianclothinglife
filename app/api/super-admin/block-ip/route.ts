import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { blockIp } from '@/lib/actions/blocked-ip.actions';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'superAdmin') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { ip, reason } = await request.json();

    if (!ip || typeof ip !== 'string') {
      return NextResponse.json({ success: false, message: 'IP is required' }, { status: 400 });
    }

    await blockIp(ip, {
      reason: reason || 'Blocked from Super Admin dashboard',
      createdByUserId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error blocking IP from Super Admin API:', err);
    return NextResponse.json({ success: false, message: 'Failed to block IP' }, { status: 500 });
  }
}
