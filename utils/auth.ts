import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hashes a plain-text password using bcrypt before storing it in PostgreSQL.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifies a plain-text password against the bcrypt hash stored in PostgreSQL.
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  if (!password || !hashedPassword) {
    return false;
  }

  return bcrypt.compare(password, hashedPassword);
}