import { Pool } from 'pg';

function getCleanHost(host: string | undefined): string {
  if (!host) return 'localhost';
  // Remove jdbc:postgresql:// or postgresql:// prefix if present
  let clean = host.replace(/^(jdbc:)?postgresql:\/\//i, '');
  // Remove port and database suffix if present, e.g. 34.27.246.185:5432/AEC_USERS -> 34.27.246.185
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
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    dbInitialized = true;
  } catch (error) {
    console.error('Failed to initialize database table:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
