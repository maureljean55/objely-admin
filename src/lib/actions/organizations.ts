"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit";
import { ORGANIZATION_TYPES, type OrganizationType } from "@/lib/queries/organizations-shared";

export type OrganizationInput = {
  name: string;
  type: OrganizationType;
  city: string;
  contactEmail: string;
};

export type OrganizationResult = { error?: string };

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié.");
  return session;
}

// Server-side validation: the form is only a convenience, never the source of truth.
function clean(input: OrganizationInput): { error: string } | { value: { name: string; type: OrganizationType; city: string | null; contact_email: string | null } } {
  const name = input.name.trim();
  const city = input.city.trim();
  const email = input.contactEmail.trim().toLowerCase();

  if (!name) return { error: "Le nom de l'établissement est requis." };
  if (name.length > 120) return { error: "Le nom est trop long (120 caractères maximum)." };
  if (!(input.type in ORGANIZATION_TYPES)) return { error: "Type d'établissement invalide." };
  if (city.length > 80) return { error: "La ville est trop longue (80 caractères maximum)." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "L'e-mail de contact n'est pas valide." };
  if (email.length > 160) return { error: "L'e-mail de contact est trop long." };

  return { value: { name, type: input.type, city: city || null, contact_email: email || null } };
}

function describe(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "Cet établissement est déjà inscrit (même nom et même ville).";
  if (error.code === "PGRST205" || error.code === "42P01") return "La table des organisations n'existe pas encore : exécutez le script SQL fourni.";
  return error.message;
}

export async function createOrganization(input: OrganizationInput): Promise<OrganizationResult> {
  const session = await requireSession();
  const parsed = clean(input);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("organizations").insert(parsed.value).select("id").single();
  if (error) return { error: describe(error) };

  await logAdminAction(session, "organization.create", "organization", data.id, { name: parsed.value.name, type: parsed.value.type });
  revalidatePath("/organisation");
  return {};
}

export async function updateOrganization(id: string, input: OrganizationInput): Promise<OrganizationResult> {
  const session = await requireSession();
  const parsed = clean(input);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("organizations")
    .update({ ...parsed.value, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return { error: describe(error) };
  if (!data) return { error: "Cet établissement n'existe plus." };

  await logAdminAction(session, "organization.update", "organization", id, { name: parsed.value.name, type: parsed.value.type });
  revalidatePath("/organisation");
  return {};
}

export async function deleteOrganization(id: string): Promise<OrganizationResult> {
  const session = await requireSession();

  const supabase = createAdminClient();
  const { data: target } = await supabase.from("organizations").select("name").eq("id", id).maybeSingle<{ name: string }>();
  if (!target) return { error: "Cet établissement n'existe plus." };

  const { error } = await supabase.from("organizations").delete().eq("id", id);
  if (error) return { error: describe(error) };

  await logAdminAction(session, "organization.delete", "organization", id, { name: target.name });
  revalidatePath("/organisation");
  return {};
}
