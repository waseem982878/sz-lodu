import { hash, compare } from 'bcryptjs';

// It's crucial to use a strong hashing algorithm like bcrypt.
// The number of salt rounds (e.g., 12) is a trade-off between security and performance.

export async function hashPassword(password: string): Promise<string> {
  const hashedPassword = await hash(password, 12);
  return hashedPassword;
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const isValid = await compare(password, hashedPassword);
  return isValid;
}
