import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// API routes handle their own session check and return JSON 401s — a
// redirect response to a fetch() call would just hand the caller an HTML
// login page instead of an error it can act on.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
