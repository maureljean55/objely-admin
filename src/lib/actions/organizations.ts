"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { logAdminAction } from "@/lib/audit";
import { generateReadablePassword } from "@/lib/generatePassword";
import { createEcoleClient, ECOLE_ADMIN_URL } from "@/lib/supabase/ecole";
import {
  ORGANIZATION_TYPES,
  type ActionResult,
  type Credentials,
  type OrganizationEdit,
  type OrganizationInput,
} from "@/lib/organizations-shared";

const NOT_CONFIGURED = "La base des écoles n'est pas encore reliée à ce portail (ECOLE_SUPABASE_URL et ECOLE_SUPABASE_SECRET_KEY).";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[0-9 +().-]{6,30}$/;

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié.");
  return session;
}

// Handing out and resetting passwords, and deleting an establishment with all its data, are reserved to super admins.
async function requireSuperAdmin() {
  const session = await requireSession();
  if (session.role !== "super_admin") throw new Error("Réservé aux super admins.");
  return session;
}

// Validated again here: the form is a convenience, never the source of truth.
function validateEdit(input: OrganizationEdit): ActionResult<{ value: ReturnType<typeof normalizeEdit> }> {
  const v = normalizeEdit(input);
  if (!v.name) return { ok: false, field: "name", error: "Le nom de l'établissement est requis." };
  if (v.name.length > 120) return { ok: false, field: "name", error: "Le nom est trop long (120 caractères maximum)." };
  if (!(v.type in ORGANIZATION_TYPES)) return { ok: false, field: "type", error: "Type d'établissement invalide." };
  if ((v.city ?? "").length > 80) return { ok: false, field: "city", error: "La ville est trop longue (80 caractères maximum)." };
  if ((v.address ?? "").length > 200) return { ok: false, field: "address", error: "L'adresse est trop longue (200 caractères maximum)." };
  if (v.phone && !PHONE.test(v.phone)) return { ok: false, field: "phone", error: "Numéro de téléphone invalide (chiffres, espaces, +, points ou tirets)." };
  if (v.contact_email && (!EMAIL.test(v.contact_email) || v.contact_email.length > 160)) return { ok: false, field: "contactEmail", error: "L'e-mail de contact n'est pas valide." };
  if (!Number.isInteger(v.retention_days) || v.retention_days < 1 || v.retention_days > 730) return { ok: false, field: "retentionDays", error: "La durée de conservation doit être un nombre de jours entre 1 et 730." };
  if ((v.help_desk ?? "").length > 60) return { ok: false, field: "helpDesk", error: "Le numéro d'aide est trop long (60 caractères maximum)." };
  return { ok: true, value: v };
}

function normalizeEdit(input: OrganizationEdit) {
  const blank = (s: string) => s.trim() || null;
  return {
    name: input.name.trim(),
    type: input.type,
    city: blank(input.city),
    address: blank(input.address),
    phone: blank(input.phone),
    contact_email: blank(input.contactEmail)?.toLowerCase() ?? null,
    retention_days: Number(input.retentionDays),
    help_desk: blank(input.helpDesk),
  };
}

function describeDbError(error: { code?: string; message: string }): { error: string; field?: keyof OrganizationInput } {
  if (error.code === "23505") return { error: "Cet établissement est déjà inscrit (même nom et même ville).", field: "name" };
  if (error.code === "23514") return { error: "Une des valeurs est hors des limites autorisées.", field: undefined };
  return { error: error.message };
}

export async function createOrganization(input: OrganizationInput): Promise<ActionResult<{ credentials: Credentials }>> {
  const session = await requireSession();
  const ecole = createEcoleClient();
  if (!ecole) return { ok: false, error: NOT_CONFIGURED };

  const edit = validateEdit(input);
  if (!edit.ok) return edit;

  const adminName = input.adminName.trim();
  const adminEmail = input.adminEmail.trim().toLowerCase();
  if (!adminName) return { ok: false, field: "adminName", error: "Le nom du responsable est requis." };
  if (adminName.length > 80) return { ok: false, field: "adminName", error: "Le nom du responsable est trop long (80 caractères maximum)." };
  if (!EMAIL.test(adminEmail) || adminEmail.length > 160) return { ok: false, field: "adminEmail", error: "L'e-mail du responsable n'est pas valide." };

  // 1. The sign-in account, with a password the establishment will use.
  const password = generateReadablePassword();
  const { data: created, error: userError } = await ecole.auth.admin.createUser({
    email: adminEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: adminName, organization: edit.value.name, must_change_password: true },
  });
  if (userError || !created.user) {
    const exists = userError?.code === "email_exists" || /already|registered|exists/i.test(userError?.message ?? "");
    return exists
      ? { ok: false, field: "adminEmail", error: "Cette adresse e-mail a déjà un compte. Utilisez celle d'une autre personne." }
      : { ok: false, error: userError?.message ?? "Le compte n'a pas pu être créé." };
  }

  // 2. The establishment and its administrator membership, in one transaction.
  const v = edit.value;
  const { error: rpcError } = await ecole.rpc("register_organization", {
    p_name: v.name,
    p_type: v.type,
    p_city: v.city,
    p_address: v.address,
    p_phone: v.phone,
    p_contact_email: v.contact_email,
    p_retention_days: v.retention_days,
    p_help_desk: v.help_desk,
    p_admin_name: adminName,
    p_admin_email: adminEmail,
    p_admin_user_id: created.user.id,
  });
  if (rpcError) {
    // Don't leave an orphan account behind.
    await ecole.auth.admin.deleteUser(created.user.id);
    return { ok: false, ...describeDbError(rpcError) };
  }

  await logAdminAction(session, "organization.create", "organization", null, { name: v.name, type: v.type, adminEmail });
  revalidatePath("/organisation");
  return { ok: true, credentials: { organizationName: v.name, email: adminEmail, password, loginUrl: `${ECOLE_ADMIN_URL}/login` } };
}

export async function updateOrganization(id: string, input: OrganizationEdit): Promise<ActionResult> {
  const session = await requireSession();
  const ecole = createEcoleClient();
  if (!ecole) return { ok: false, error: NOT_CONFIGURED };

  const edit = validateEdit(input);
  if (!edit.ok) return edit;

  const { data, error } = await ecole.from("organizations").update(edit.value).eq("id", id).select("id").maybeSingle();
  if (error) return { ok: false, ...describeDbError(error) };
  if (!data) return { ok: false, error: "Cet établissement n'existe plus." };

  await logAdminAction(session, "organization.update", "organization", id, { name: edit.value.name });
  revalidatePath("/organisation");
  return { ok: true };
}

/** A new generated password for the establishment's administrator, shown once. The old one stops working. */
export async function resetOrganizationPassword(id: string): Promise<ActionResult<{ credentials: Credentials }>> {
  const session = await requireSuperAdmin();
  const ecole = createEcoleClient();
  if (!ecole) return { ok: false, error: NOT_CONFIGURED };

  const { data: org } = await ecole.from("organizations").select("name").eq("id", id).maybeSingle<{ name: string }>();
  if (!org) return { ok: false, error: "Cet établissement n'existe plus." };

  const { data: member } = await ecole
    .from("members")
    .select("user_id, email")
    .eq("organization_id", id)
    .eq("role", "admin")
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ user_id: string | null; email: string }>();
  if (!member?.user_id) return { ok: false, error: "Cet établissement n'a pas de compte administrateur à réinitialiser." };

  const { data: current } = await ecole.auth.admin.getUserById(member.user_id);
  const password = generateReadablePassword();
  const { error } = await ecole.auth.admin.updateUserById(member.user_id, {
    password,
    user_metadata: { ...(current?.user?.user_metadata ?? {}), must_change_password: true },
  });
  if (error) return { ok: false, error: error.message };

  await logAdminAction(session, "organization.password_reset", "organization", id, { name: org.name, email: member.email });
  return { ok: true, credentials: { organizationName: org.name, email: member.email, password, loginUrl: `${ECOLE_ADMIN_URL}/login` } };
}

/** Removes the establishment and everything attached to it (objects, declarations, restitutions…) plus its accounts. */
export async function deleteOrganization(id: string, confirmName: string): Promise<ActionResult<{ accountsLeft: number }>> {
  const session = await requireSuperAdmin();
  const ecole = createEcoleClient();
  if (!ecole) return { ok: false, error: NOT_CONFIGURED };

  const { data: org } = await ecole.from("organizations").select("name").eq("id", id).maybeSingle<{ name: string }>();
  if (!org) return { ok: false, error: "Cet établissement n'existe plus." };
  // Checked on the server too: typing the name is the safeguard against deleting the wrong one.
  if (confirmName.trim().toLowerCase() !== org.name.trim().toLowerCase()) return { ok: false, error: "Le nom saisi ne correspond pas." };

  const { data: members } = await ecole.from("members").select("user_id").eq("organization_id", id).returns<{ user_id: string | null }[]>();
  const userIds = (members ?? []).map((m) => m.user_id).filter((u): u is string => Boolean(u));

  const { error } = await ecole.from("organizations").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  // The rows are gone; now the sign-in accounts. A failure here leaves a harmless orphan account: report it.
  let accountsLeft = 0;
  for (const userId of userIds) {
    const { error: deleteError } = await ecole.auth.admin.deleteUser(userId);
    if (deleteError) accountsLeft++;
  }

  await logAdminAction(session, "organization.delete", "organization", id, { name: org.name, accountsLeft });
  revalidatePath("/organisation");
  return { ok: true, accountsLeft };
}
