import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "objely_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type AdminRole = "admin" | "super_admin";

export type AdminSession = {
  sub: string;
  email: string;
  fullName: string;
  role: AdminRole;
};

function getSecretKey() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set.");
  return new TextEncoder().encode(secret);
}

export async function signSession(session: AdminSession): Promise<string> {
  return new SignJWT({ email: session.email, fullName: session.fullName, role: session.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

/** Edge-compatible: safe to call from middleware. Returns null on any invalid/expired/missing token. */
export async function verifySession(token: string | undefined): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub || typeof payload.email !== "string" || typeof payload.fullName !== "string" || typeof payload.role !== "string") {
      return null;
    }
    return { sub: payload.sub, email: payload.email, fullName: payload.fullName, role: payload.role as AdminRole };
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SESSION_DURATION_SECONDS;
