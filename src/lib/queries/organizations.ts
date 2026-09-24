import "server-only";
import { createEcoleClient } from "@/lib/supabase/ecole";
import type { OrganizationSummary, OrganizationType } from "@/lib/organizations-shared";

type Row = {
  id: string;
  name: string;
  type: OrganizationType;
  city: string | null;
  address: string | null;
  phone: string | null;
  contact_email: string | null;
  retention_days: number;
  help_desk: string | null;
  created_at: string;
  members: { email: string; full_name: string; role: string; active: boolean; last_seen_at: string | null; created_at: string }[];
};

export async function listOrganizations(): Promise<{ organizations: OrganizationSummary[]; error: string | null }> {
  const ecole = createEcoleClient();
  if (!ecole) return { organizations: [], error: null };

  const { data, error } = await ecole
    .from("organizations")
    .select("id, name, type, city, address, phone, contact_email, retention_days, help_desk, created_at, members(email, full_name, role, active, last_seen_at, created_at)")
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<Row[]>();

  if (error) return { organizations: [], error: error.message };

  return {
    organizations: (data ?? []).map((o) => {
      // The establishment's account is its oldest active administrator.
      const admin = o.members
        .filter((m) => m.role === "admin" && m.active)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
      return {
        id: o.id,
        name: o.name,
        type: o.type,
        city: o.city,
        address: o.address,
        phone: o.phone,
        contactEmail: o.contact_email,
        retentionDays: o.retention_days,
        helpDesk: o.help_desk,
        createdAt: o.created_at,
        admin: admin ? { name: admin.full_name, email: admin.email, lastSeenAt: admin.last_seen_at } : null,
      };
    }),
    error: null,
  };
}
