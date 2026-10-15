import type { NextAuthConfig } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';

export const authConfig = {
  providers: [], // Required by NextAuthConfig type
  callbacks: {
    async authorized({ request, auth }) {
      const { pathname } = request.nextUrl;

      // Resolve client IP (works behind proxies like Vercel)
      const forwardedFor = request.headers.get('x-forwarded-for');
      const ip = forwardedFor?.split(',')[0].trim() || (request as any).ip || null;

      if (ip) {
        try {
          const blocked = await prisma.blockedIp.findFirst({
            where: { ip, active: true },
          });

          if (blocked) {
            return new NextResponse('Access blocked by site owner.', { status: 403 });
          }
        } catch (err) {
          // Fail open on DB errors so the site remains accessible
          console.error('Error checking blocked IPs:', err);
        }
      }

      const protectedPaths = [
        /\/shipping-address/,
        /\/place-order/,
        /\/profile/,
        /\/user\/(.*)/,
        /\/admin/,
        /\/super-admin/,
      ];

      if (!auth && protectedPaths.some((p) => p.test(pathname))) return false;

      if (!request.cookies.get('sessionCartId')) {
        const sessionCartId = crypto.randomUUID();

        const response = NextResponse.next({
          request: {
            headers: new Headers(request.headers),
          },
        });

        response.cookies.set('sessionCartId', sessionCartId);

        return response;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
