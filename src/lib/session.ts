import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, type AdminSession } from "@/lib/auth";

/** Reads and verifies the admin session cookie from a Server Component / Route Handler / Server Action. */
export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  return verifySession(cookieStore.get(SESSION_COOKIE)?.value);
}
