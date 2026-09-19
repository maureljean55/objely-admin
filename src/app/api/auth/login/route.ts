import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

type AdminUserRow = {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: "admin" | "super_admin";
};

// Login attempts always take roughly the same time whether the email exists
// or not — this hash of a bogus password is compared against when it
// doesn't, so a timing difference can't be used to enumerate admin emails.
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8Q6ZtV5AtQe4dhE.KpXjNH6TW7pZ1i";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Adresse e-mail et mot de passe requis." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: admin } = await supabase
    .from("admin_users")
    .select("id, email, password_hash, full_name, role")
    .eq("email", email)
    .maybeSingle<AdminUserRow>();

  const isValid = await bcrypt.compare(password, admin?.password_hash ?? DUMMY_HASH);
  if (!admin || !isValid) {
    return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
  }

  await supabase.from("admin_users").update({ last_login_at: new Date().toISOString() }).eq("id", admin.id);

  const token = await signSession({ sub: admin.id, email: admin.email, fullName: admin.full_name, role: admin.role });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
