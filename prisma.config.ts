import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { DIRECT_DATABASE_URL } from './db/connection';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // The Prisma CLI (migrate/db push) must use the *direct* Supabase connection
    // (port 5432) because migrations don't work through the PgBouncer pooler.
    url: DIRECT_DATABASE_URL,
  },
});
