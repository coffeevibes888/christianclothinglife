import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { auth } from '@/auth';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimit(`contact:${getClientIp(req.headers)}`, 5, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 },
      );
    }

    const body = await req.json();
    const { name, email, subject, projectType, message } = body ?? {};

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    const session = await auth();
    const adminUserId = session?.user?.id ?? null;

    const thread = await prisma.thread.create({
      data: {
        type: 'contact',
        subject: subject || 'New contact message',
        createdByUserId: adminUserId,
        messages: {
          create: {
            senderUserId: null,
            senderName: name,
            senderEmail: email,
            content: [
              projectType ? `Project type: ${projectType}` : null,
              message,
            ]
              .filter(Boolean)
              .join('\n\n'),
            role: 'user',
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        threadId: thread.id,
        message: 'Your message has been received.',
      },
      { status: 201 }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating contact message:', error);
    return NextResponse.json(
      { error: 'Failed to submit message. Please try again later.' },
      { status: 500 }
    );
  }
}
