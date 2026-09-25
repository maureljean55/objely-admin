import "server-only";
import { createEcoleClient } from "@/lib/supabase/ecole";
import type { OrganizationType } from "@/lib/organizations-shared";

// One establishment's dashboard, as its own staff sees it in objely-ecole-admin (same figures, same rules), read
// with the service role and filtered on its id.

const LIMIT = 2000;
const DAY = 86_400_000;
const ONLINE_MS = 10 * 60_000;

type Category = "telephone" | "sac" | "cles" | "vetement" | "scolaire" | "autre";
export const CATEGORY_LABELS: Record<Category, string> = {
  telephone: "Téléphone",
  sac: "Sac & Dos",
  cles: "Clés / Badge",
  vetement: "Vêtement",
  scolaire: "Scolaire",
  autre: "Autre",
};

export const MEMBER_ROLES: Record<string, string> = { admin: "Administrateur", vie_scolaire: "Vie scolaire", lecture: "Lecture seule" };

type OrgRow = {
  id: string; name: string; type: OrganizationType; city: string | null; address: string | null; phone: string | null; contact_email: string | null;
  retention_days: number; idle_seconds: number; help_desk: string | null; created_at: string; suspended_at?: string | null;
  max_kiosks?: number | null;
};
type ObjectRow = { id: string; name: string; category: Category; description: string; found_at: string | null; deposited_at: string; status: "en_stock" | "restitue" | "a_donner" };
type DeclarationRow = {
  id: string; ref: string; kind: "perdu" | "trouve"; nom: string; prenom: string; classe: string; object_name: string; category: Category;
  description: string; location: string | null; status: "ouverte" | "correspondance" | "cloturee"; created_at: string;
};
type RestitutionRow = { id: string; ref: string; object_name: string; nom: string; prenom: string; classe: string; done_at: string; done_by_name: string };
type MemberRow = { id: string; email: string; full_name: string; role: string; active: boolean; last_seen_at: string | null; created_at: string };
type KioskRow = { id: string; name: string; location: string | null; version: string; paired_at: string | null; last_seen_at: string | null; pairing_expires_at: string | null; created_at: string };
type LogRow = { id: string; created_at: string; actor_name: string; action: string; message: string };

export type DayCount = { key: string; label: string; perdu: number; trouve: number };

export type OrganizationDetail = {
  organization: {
    id: string; name: string; type: OrganizationType; city: string | null; address: string | null; phone: string | null; contactEmail: string | null;
    retentionDays: number; idleSeconds: number; helpDesk: string | null; createdAt: string;
    /** undefined when the database does not have the suspension column yet. */
    suspendedAt: string | null | undefined;
    /** Most bornes it may have: null = no limit, undefined = the database does not have the column yet. */
    maxKiosks: number | null | undefined;
  };
  totals: {
    declarations: number; lost: number; found: number; openDeclarations: number; staleDeclarations: number;
    objects: number; inStock: number; toDonate: number; returnedObjects: number; overdue: number;
    restitutions: number; restitutionsThisMonth: number; restitutionRate: number | null; possibleMatches: number;
    kiosks: number; kiosksOnline: number; kiosksUnpaired: number; members: number; activeMembers: number;
  };
  days: DayCount[];
  categories: { label: string; count: number }[];
  stockAges: { week: number; month: number; mid: number; over: number };
  recentDeclarations: DeclarationRow[];
  recentRestitutions: RestitutionRow[];
  members: MemberRow[];
  kiosks: (KioskRow & { online: boolean })[];
  log: LogRow[];
  lastActivityAt: string | null;
};

// ---------------------------------------------------------------- same matching rule as objely-ecole-admin

const STOP = new Set(["le", "la", "les", "un", "une", "des", "de", "du", "et", "en", "au", "aux", "avec", "sans", "sur", "dans", "pour", "mon", "ma", "mes"]);
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const tokens = (s: string) => new Set(fold(s).split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !STOP.has(t)));

function matchScore(d: DeclarationRow, o: ObjectRow) {
  let score = 0;
  if (d.category === o.category) score += d.category === "autre" ? 20 : 45;
  const b = tokens(`${o.name} ${o.description}`);
  const shared = [...tokens(`${d.object_name} ${d.description}`)].filter((t) => b.has(t)).length;
  if (shared > 0) score += Math.min(45, shared * 15);
  else score = Math.min(score, 40);
  if (d.location && fold(d.location) === fold(o.found_at ?? "") && shared > 0) score += 10;
  return Math.min(95, score);
}

// ---------------------------------------------------------------- query

async function fetchOrganization(ecole: NonNullable<ReturnType<typeof createEcoleClient>>, id: string) {
  const columns = "id, name, type, city, address, phone, contact_email, retention_days, idle_seconds, help_desk, created_at";
  // Newest columns first; 42703 means a migration is not applied yet on the school database, so fall back without it.
  for (const extra of [", suspended_at, max_kiosks", ", suspended_at", ""]) {
    const result = await ecole.from("organizations").select(columns + extra).eq("id", id).maybeSingle<OrgRow>();
    if (result.error?.code !== "42703") return result;
  }
  return ecole.from("organizations").select(columns).eq("id", id).maybeSingle<OrgRow>();
}

export async function getOrganizationDetail(id: string): Promise<OrganizationDetail | null> {
  const ecole = createEcoleClient();
  if (!ecole || !/^[0-9a-f-]{36}$/i.test(id)) return null;

  const { data: org, error } = await fetchOrganization(ecole, id);
  if (error) throw new Error(error.message);
  if (!org) return null;

  const [objects, declarations, restitutions, members, kiosks, log] = await Promise.all([
    ecole.from("objects").select("id, name, category, description, found_at, deposited_at, status").eq("organization_id", id).order("deposited_at", { ascending: false }).limit(LIMIT).returns<ObjectRow[]>(),
    ecole.from("declarations").select("id, ref, kind, nom, prenom, classe, object_name, category, description, location, status, created_at").eq("organization_id", id).order("created_at", { ascending: false }).limit(LIMIT).returns<DeclarationRow[]>(),
    ecole.from("restitutions").select("id, ref, object_name, nom, prenom, classe, done_at, done_by_name").eq("organization_id", id).order("done_at", { ascending: false }).limit(LIMIT).returns<RestitutionRow[]>(),
    ecole.from("members").select("id, email, full_name, role, active, last_seen_at, created_at").eq("organization_id", id).order("created_at").returns<MemberRow[]>(),
    ecole.from("kiosks").select("id, name, location, version, paired_at, last_seen_at, pairing_expires_at, created_at").eq("organization_id", id).order("created_at").returns<KioskRow[]>(),
    ecole.from("audit_log").select("id, created_at, actor_name, action, message").eq("organization_id", id).order("created_at", { ascending: false }).limit(12).returns<LogRow[]>(),
  ]);
  for (const r of [objects, declarations, restitutions, members, kiosks, log]) if (r.error) throw new Error(r.error.message);

  const objs = objects.data ?? [];
  const decls = declarations.data ?? [];
  const rests = restitutions.data ?? [];
  const staff = members.data ?? [];
  const bornes = kiosks.data ?? [];
  const now = Date.now();
  const daysSince = (iso: string) => Math.floor((now - new Date(iso).getTime()) / DAY);

  const inStock = objs.filter((o) => o.status === "en_stock");
  const stockAges = { week: 0, month: 0, mid: 0, over: 0 };
  for (const o of inStock) {
    const d = daysSince(o.deposited_at);
    if (d <= 7) stockAges.week++;
    else if (d <= 30) stockAges.month++;
    else if (d <= org.retention_days) stockAges.mid++;
    else stockAges.over++;
  }

  const openLost = decls.filter((d) => d.kind === "perdu" && d.status !== "cloturee");
  const possibleMatches = openLost.reduce((n, d) => n + inStock.filter((o) => matchScore(d, o) >= 60).length, 0);

  // Last 14 days, Paris time, oldest first.
  const dayKey = (t: number) => new Date(t).toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
  const byDay = new Map<string, { perdu: number; trouve: number }>();
  for (const d of decls) {
    const key = dayKey(new Date(d.created_at).getTime());
    const entry = byDay.get(key) ?? { perdu: 0, trouve: 0 };
    entry[d.kind]++;
    byDay.set(key, entry);
  }
  const days: DayCount[] = Array.from({ length: 14 }, (_, i) => {
    const t = now - (13 - i) * DAY;
    const key = dayKey(t);
    return { key, label: new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" }), ...(byDay.get(key) ?? { perdu: 0, trouve: 0 }) };
  });

  const categoryCounts = new Map<string, number>();
  for (const d of decls) categoryCounts.set(d.category, (categoryCounts.get(d.category) ?? 0) + 1);
  const categories = [...categoryCounts]
    .map(([c, count]) => ({ label: CATEGORY_LABELS[c as Category] ?? c, count }))
    .sort((a, b) => b.count - a.count);

  const returnedObjects = objs.filter((o) => o.status === "restitue").length;
  const kiosksWithState = bornes.map((k) => ({ ...k, online: Boolean(k.last_seen_at && now - new Date(k.last_seen_at).getTime() < ONLINE_MS) }));
  const lastActivityAt = [decls[0]?.created_at, rests[0]?.done_at, objs[0]?.deposited_at, log.data?.[0]?.created_at]
    .filter((s): s is string => Boolean(s))
    .sort()
    .at(-1) ?? null;

  return {
    organization: {
      id: org.id, name: org.name, type: org.type, city: org.city, address: org.address, phone: org.phone, contactEmail: org.contact_email,
      retentionDays: org.retention_days, idleSeconds: org.idle_seconds, helpDesk: org.help_desk, createdAt: org.created_at,
      suspendedAt: "suspended_at" in org ? (org.suspended_at ?? null) : undefined,
      maxKiosks: "max_kiosks" in org ? (org.max_kiosks ?? null) : undefined,
    },
    totals: {
      declarations: decls.length,
      lost: decls.filter((d) => d.kind === "perdu").length,
      found: decls.filter((d) => d.kind === "trouve").length,
      openDeclarations: decls.filter((d) => d.status === "ouverte").length,
      staleDeclarations: decls.filter((d) => d.status === "ouverte" && now - new Date(d.created_at).getTime() > DAY).length,
      objects: objs.length,
      inStock: inStock.length,
      toDonate: objs.filter((o) => o.status === "a_donner").length,
      returnedObjects,
      overdue: stockAges.over,
      restitutions: rests.length,
      restitutionsThisMonth: rests.filter((r) => now - new Date(r.done_at).getTime() < 30 * DAY).length,
      restitutionRate: objs.length > 0 ? Math.round((returnedObjects / objs.length) * 100) : null,
      possibleMatches,
      kiosks: bornes.length,
      kiosksOnline: kiosksWithState.filter((k) => k.online).length,
      kiosksUnpaired: bornes.filter((k) => !k.paired_at).length,
      members: staff.length,
      activeMembers: staff.filter((m) => m.active).length,
    },
    days,
    categories,
    stockAges,
    recentDeclarations: decls.slice(0, 8),
    recentRestitutions: rests.slice(0, 5),
    members: staff,
    kiosks: kiosksWithState,
    log: log.data ?? [],
    lastActivityAt,
  };
}
