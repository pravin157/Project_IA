// Server-only PostgreSQL connection and schema bootstrap.
import { Pool } from 'pg';

function getCleanHost(host: string | undefined): string {
  if (!host) return 'localhost';
  let clean = host.replace(/^(jdbc:)?postgresql:\/\//i, '');
  clean = clean.split('/')[0].split(':')[0];
  return clean;
}

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: getCleanHost(process.env.DB_HOST),
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'postgres',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });

let dbInitialized = false;

export async function initDb() {
  if (dbInitialized) return;
  
  const client = await pool.connect();
  try {
    // Create users table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add role column if it doesn't exist (migration for existing DBs)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'role'
        ) THEN
          ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user';
        END IF;
      END $$;
    `);

    // Create refresh_tokens table for token rotation & revocation
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_jti VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        revoked BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add token_jti column if it doesn't exist (migration for existing DBs)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'refresh_tokens' AND column_name = 'token_jti'
        ) THEN
          ALTER TABLE refresh_tokens ADD COLUMN token_jti VARCHAR(255) UNIQUE;
        END IF;
      END $$;
    `);

    // Add revoked column if it doesn't exist (migration for existing DBs)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'refresh_tokens' AND column_name = 'revoked'
        ) THEN
          ALTER TABLE refresh_tokens ADD COLUMN revoked BOOLEAN NOT NULL DEFAULT FALSE;
        END IF;
      END $$;
    `);

    // Drop NOT NULL constraint on legacy token column if present (migration for existing DBs)
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'refresh_tokens' AND column_name = 'token' AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE refresh_tokens ALTER COLUMN token DROP NOT NULL;
        END IF;
      END $$;
    `);

    // Index for fast lookup on token_jti and cleanup queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_jti ON refresh_tokens(token_jti);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
    `);

    dbInitialized = true;
  } catch (error) {
    console.error('Failed to initialize database tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
