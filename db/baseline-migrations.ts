/**
 * Run once when your database already matches migration `0000` but
 * `public.__drizzle_migrations` has no row for it (e.g. schema was applied manually
 * or from an old tool). After this, `pnpm run db:migrate` will only apply later migrations.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL is not set');
  }

  const journalPath = path.resolve(process.cwd(), 'drizzle/meta/_journal.json');
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8')) as {
    entries: { idx: number; when: number; tag: string }[];
  };
  const entry0 = journal.entries.find((e) => e.idx === 0);
  if (!entry0) {
    throw new Error('No idx 0 entry in drizzle/meta/_journal.json');
  }

  const sqlPath = path.resolve(process.cwd(), `drizzle/${entry0.tag}.sql`);
  const sqlBody = fs.readFileSync(sqlPath, 'utf8');
  const hash = crypto.createHash('sha256').update(sqlBody).digest('hex');

  const pool = new pg.Pool({
    connectionString: process.env.DIRECT_URL,
    max: 1,
  });

  try {
    const { rowCount } = await pool.query(
      `SELECT 1 FROM public.__drizzle_migrations WHERE hash = $1 LIMIT 1`,
      [hash],
    );
    if (rowCount && rowCount > 0) {
      console.log('Baseline skipped: migration 0000 is already recorded (hash match).');
      return;
    }

    await pool.query(
      `INSERT INTO public.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`,
      [hash, entry0.when],
    );
    console.log(`Recorded ${entry0.tag} in public.__drizzle_migrations.`);
    console.log('Next: pnpm run db:migrate');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
