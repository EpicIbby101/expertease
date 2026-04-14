import path from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

/** Must match drizzle.config.ts → migrations */
const MIGRATIONS_SCHEMA = 'public';
const MIGRATIONS_TABLE = '__drizzle_migrations';

async function main() {
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL environment variable is not set');
  }

  const migrationsFolder = path.resolve(process.cwd(), 'drizzle');
  console.log('Applying migrations from:', migrationsFolder);
  console.log(`Tracking table: ${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE}`);

  const pool = new pg.Pool({
    connectionString: process.env.DIRECT_URL,
    max: 1,
  });

  const db = drizzle(pool);

  try {
    await migrate(db, {
      migrationsFolder,
      migrationsSchema: MIGRATIONS_SCHEMA,
      migrationsTable: MIGRATIONS_TABLE,
    });
  } finally {
    await pool.end();
  }

  console.log('Migrations completed successfully');
}

function logPgError(err: unknown) {
  console.error('Migration failed');
  if (err && typeof err === 'object' && 'message' in err) {
    console.error((err as Error).message);
  }
  if (err && typeof err === 'object' && 'code' in err) {
    console.error('code:', (err as { code: string }).code);
  }
  if (err && typeof err === 'object' && 'detail' in err) {
    const d = (err as { detail?: string }).detail;
    if (d) console.error('detail:', d);
  }
  console.error(err);
}

main().catch((err) => {
  logPgError(err);
  process.exit(1);
});
