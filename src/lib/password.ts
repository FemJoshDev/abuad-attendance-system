import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  const trimmed = password.trim();

  if (!trimmed || trimmed.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(trimmed, salt);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  if (!password || !passwordHash) {
    return false;
  }

  return bcrypt.compare(password, passwordHash);
}

export function validatePassword(password: string): string | null {
  if (!password || password.trim().length < 8) {
    return "Password must be at least 8 characters long.";
  }

  return null;
}
