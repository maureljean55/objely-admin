import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession, type AdminSession } from "@/lib/auth";

/** Verifies the admin session for a Route Handler. Returns the session, or a ready-to-return 401 response. */
export async function requireApiSession(request: NextRequest): Promise<{ session: AdminSession } | { response: NextResponse }> {
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return { response: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) };
  return { session };
}
