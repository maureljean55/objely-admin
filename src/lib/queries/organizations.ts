import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

import type { OrganizationType } from "@/lib/queries/organizations-shared";

export { ORGANIZATION_TYPES, type OrganizationType } from "@/lib/queries/organizations-shared";

export type Organization = {
  id: string;
  name: string;
  type: OrganizationType;
  city: string | null;
  contactEmail: string | null;
  createdAt: string;
};

// PostgREST answers PGRST205 (or Postgres 42P01) while the table hasn't been created yet.
const MISSING_TABLE_CODES = new Set(["PGRST205", "42P01"]);

export async function listOrganizations(): Promise<{ organizations: Organization[]; missingTable: boolean; error: string | null }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, type, city, contact_email, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    if (MISSING_TABLE_CODES.has(error.code)) return { organizations: [], missingTable: true, error: null };
    return { organizations: [], missingTable: false, error: error.message };
  }

  return {
    organizations: (data ?? []).map((o) => ({
      id: o.id,
      name: o.name,
      type: o.type,
      city: o.city,
      contactEmail: o.contact_email,
      createdAt: o.created_at,
    })),
    missingTable: false,
    error: null,
  };
}
