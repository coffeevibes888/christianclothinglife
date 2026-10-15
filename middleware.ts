import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// This middleware queries Postgres (blocked-IP check in auth.config.ts) via the
// `pg` driver, which is Node-only and cannot run on the Edge runtime. Next.js
// 15.5 made the Node.js middleware runtime stable, so we opt into it here.
export const config = {
  runtime: 'nodejs',
};

export const { auth: middleware } = NextAuth(authConfig);
