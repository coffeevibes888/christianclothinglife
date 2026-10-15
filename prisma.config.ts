import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // The Prisma CLI (migrate/db push) must use the *direct* Supabase connection
    // (port 5432) because migrations don't work through the PgBouncer pooler.
    // Falls back to DATABASE_URL when DIRECT_URL isn't set (e.g. local single-URL dev).
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
