import { randomBytes } from "crypto";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%";

export function generatePassword(length = 20): string {
  const bytes = randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) password += CHARS[bytes[i] % CHARS.length];
  return password;
}

// Letters and digits that can't be mistaken for one another (no 0/O, 1/I/L): a school administrator has to
// read this over the phone or type it from a printout.
const READABLE = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** e.g. "K7XM-4PQD-9WHT-2BNC": 16 characters, about 78 bits. */
export function generateReadablePassword(groups = 4, size = 4): string {
  const bytes = randomBytes(groups * size);
  const parts: string[] = [];
  for (let g = 0; g < groups; g++) {
    let part = "";
    for (let i = 0; i < size; i++) part += READABLE[bytes[g * size + i] % READABLE.length];
    parts.push(part);
  }
  return parts.join("-");
}
