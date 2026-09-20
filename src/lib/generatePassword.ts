import { randomBytes } from "crypto";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%";

export function generatePassword(length = 20): string {
  const bytes = randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) password += CHARS[bytes[i] % CHARS.length];
  return password;
}
