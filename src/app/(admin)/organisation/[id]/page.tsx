import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Dot } from "@/components/Badge";
import { KioskRevoke, MemberToggle, OrganizationActions } from "@/components/OrganizationActions";
import { StatCard } from "@/components/StatCard";
import { formatDate, formatDateTime, formatNumber, formatRelativeTime } from "@/lib/format";
import { ORGANIZATION_TYPES } from "@/lib/organizations-shared";
import { getOrganizationDetail, MEMBER_ROLES, type DayCount } from "@/lib/queries/organizationDetail";
import { getSession } from "@/lib/session";

const CATEGORY_COLORS = ["#087BEA", "#4FA8FF", "#8D6CF3", "#10B981", "#F59E0B", "#CBD5E1"];
const LOST_COLOR = "#F59E0B";
const FOUND_COLOR = "#4FA8FF";

const DECLARATION_STATUS: Record<string, { label: string; variant: "warning" | "tertiary" | "success" }> = {
  ouverte: { label: "Ouverte", variant: "warning" },
  correspondance: { label: "Correspondance", variant: "tertiary" },
  cloturee: { label: "Clôturée", variant: "success" },
};

export default async function OrganizationDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, detail] = await Promise.all([getSession(), getOrganizationDetail(id)]);
  if (!detail) notFound();

  const { organization: o, totals: t } = detail;
  const isSuperAdmin = session?.role === "super_admin";
  const suspended = Boolean(o.suspendedAt);

  const todo = [
    { count: t.possibleMatches, label: "correspondances possibles à vérifier", icon: "compare_arrows" },
    { count: t.staleDeclarations, label: "déclarations sans réponse depuis plus de 24 h", icon: "edit_note" },
    { count: t.overdue, label: `objets gardés depuis plus de ${o.retentionDays} jours`, icon: "schedule" },
    { count: t.kiosksUnpaired, label: "bornes créées mais jamais appairées", icon: "tablet_android" },
  ].filter((item) => item.count > 0);

  const totalCategories = detail.categories.reduce((sum, c) => sum + c.count, 0);
  const statusSegments = [
    { label: "En stock", value: t.inStock, color: "#087BEA" },
    { label: "À donner", value: t.toDonate, color: "#F59E0B" },
    { label: "Rendus", value: t.returnedObjects, color: "#10B981" },
  ];
  const ageSegments = [
    { label: "Moins de 7 jours", value: detail.stockAges.week, color: "#087BEA" },
    { label: "7 à 30 jours", value: detail.stockAges.month, color: "#4FA8FF" },
    { label: `30 jours au délai (${o.retentionDays} j)`, value: detail.stockAges.mid, color: "#F59E0B" },
    { label: "Délai dépassé", value: detail.stockAges.over, color: "#EF4444" },
  ];

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start gap-3">
          <Link href="/organisation" aria-label="Retour aux établissements" className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-bg">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <span className="material-symbols-outlined text-[24px]">school</span>
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-display-lg text-on-surface tracking-tight">{o.name}</h1>
              <Badge variant="tertiary">{ORGANIZATION_TYPES[o.type]}</Badge>
              {suspended ? <Badge variant="danger">Suspendu</Badge> : <Badge variant="success">Actif</Badge>}
            </div>
            <p className="text-body-md text-on-surface-variant">
              {[o.city, `inscrit le ${formatDate(o.createdAt)}`, detail.lastActivityAt ? `dernière activité ${formatRelativeTime(detail.lastActivityAt).toLowerCase()}` : "aucune activité pour le moment"]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        <OrganizationActions
          id={o.id}
          name={o.name}
          suspended={suspended}
          canSuspend={o.suspendedAt !== undefined}
          isSuperAdmin={isSuperAdmin}
          initial={{
            name: o.name,
            type: o.type,
            city: o.city ?? "",
            address: o.address ?? "",
            phone: o.phone ?? "",
            contactEmail: o.contactEmail ?? "",
            retentionDays: o.retentionDays,
            helpDesk: o.helpDesk ?? "",
          }}
        />

        {suspended && o.suspendedAt && (
          <div role="status" className="flex items-center gap-3 rounded-xl border border-danger-crimson/20 bg-danger-container px-4 py-3 text-body-sm text-danger-crimson">
            <span className="material-symbols-outlined text-[20px]">block</span>
            Établissement suspendu depuis le {formatDateTime(o.suspendedAt)} : son personnel ne peut plus se connecter et ses bornes refusent les déclarations.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Déclarations" value={formatNumber(t.declarations)} icon="edit_note" trend={{ label: `${t.lost} perdus · ${t.found} trouvés` }} />
        <StatCard label="Objets en stock" value={formatNumber(t.inStock)} icon="inventory_2" iconColorClass="text-sky-blue" trend={{ label: `${t.toDonate} à donner` }} />
        <StatCard
          label="Objets rendus"
          value={formatNumber(t.returnedObjects)}
          icon="verified"
          iconColorClass="text-success-emerald"
          trend={t.restitutionRate === null ? undefined : { label: `Taux ${t.restitutionRate} %`, positive: true }}
        />
        <StatCard label="Correspondances" value={formatNumber(t.possibleMatches)} icon="compare_arrows" iconColorClass="text-tertiary" trend={{ label: "possibles à vérifier" }} />
        <StatCard
          label="Bornes en ligne"
          value={`${t.kiosksOnline} / ${t.kiosks}`}
          icon="tablet_android"
          iconColorClass="text-warning-amber"
          trend={{ label: `${t.activeMembers} membre${t.activeMembers > 1 ? "s" : ""} actif${t.activeMembers > 1 ? "s" : ""}` }}
        />
      </div>

      <Panel title="À traiter" subtitle="Ce que la vie scolaire voit en haut de son tableau de bord">
        {todo.length === 0 ? (
          <p className="px-5 pb-5 text-body-sm text-on-surface-variant">Rien à traiter : toutes les déclarations ont une réponse et aucun objet ne dépasse le délai de conservation.</p>
        ) : (
          <ul className="divide-y divide-border-subtle border-t border-border-subtle">
            {todo.map((item) => (
              <li key={item.label} className="flex items-center gap-4 px-5 py-3.5">
                <span className="w-10 text-right text-metric-number text-on-surface">{item.count}</span>
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">{item.icon}</span>
                <span className="text-body-md text-on-surface">{item.label}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Panel className="lg:col-span-8" title="Déclarations des 14 derniers jours" subtitle="Reçues aux bornes et saisies par la vie scolaire">
          <div className="px-5 pb-5">
            <DeclarationsBars days={detail.days} />
          </div>
        </Panel>
        <Panel className="lg:col-span-4" title="État des objets" subtitle={`${formatNumber(t.objects)} objet${t.objects > 1 ? "s" : ""} enregistré${t.objects > 1 ? "s" : ""}`}>
          <div className="px-5 pb-5">
            <Donut segments={statusSegments} total={t.objects} emptyText="Aucun objet enregistré." />
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel title="Par catégorie" subtitle="Toutes les déclarations">
          <div className="px-5 pb-5">
            <Donut
              segments={detail.categories.map((c, i) => ({ label: c.label, value: c.count, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))}
              total={totalCategories}
              emptyText="Aucune déclaration pour le moment."
            />
          </div>
        </Panel>

        <Panel title="Ancienneté du stock" subtitle={`${t.inStock} objet${t.inStock > 1 ? "s" : ""} gardé${t.inStock > 1 ? "s" : ""} à la vie scolaire`}>
          <div className="px-5 pb-5">
            {t.inStock === 0 ? (
              <p className="text-body-sm text-on-surface-variant">Le stock est vide.</p>
            ) : (
              <>
                <div className="flex h-3 overflow-hidden rounded-full bg-surface-bg" role="img" aria-label="Répartition du stock par ancienneté">
                  {ageSegments.map((s) => s.value > 0 && <div key={s.label} style={{ width: `${(s.value / t.inStock) * 100}%`, backgroundColor: s.color }} />)}
                </div>
                <Legend segments={ageSegments} />
              </>
            )}
          </div>
        </Panel>

        <Panel title="Ce mois-ci" subtitle="30 derniers jours">
          <dl className="grid grid-cols-2 gap-4 px-5 pb-5">
            <Metric label="Objets rendus" value={formatNumber(t.restitutionsThisMonth)} />
            <Metric label="Restitutions au total" value={formatNumber(t.restitutions)} />
            <Metric label="Déclarations ouvertes" value={formatNumber(t.openDeclarations)} />
            <Metric label="Personnel" value={`${t.activeMembers} / ${t.members}`} />
          </dl>
          <p className="px-5 pb-5 text-body-sm text-on-surface-variant">
            Dernier objet rendu : {detail.recentRestitutions[0] ? formatDate(detail.recentRestitutions[0].done_at) : "aucun pour le moment"}.
          </p>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Panel className="lg:col-span-7 overflow-hidden" title="Dernières déclarations" subtitle="Les 8 plus récentes">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-bg text-label-sm uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-5 py-3">Objet</th>
                  <th className="px-3 py-3">Déclarant</th>
                  <th className="px-3 py-3">Quand</th>
                  <th className="px-5 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="text-body-md text-on-surface">
                {detail.recentDeclarations.map((d) => {
                  const status = DECLARATION_STATUS[d.status] ?? { label: d.status, variant: "warning" as const };
                  return (
                    <tr key={d.id} className="border-t border-border-subtle">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Dot variant={d.kind === "perdu" ? "warning" : "primary"} />
                          <div className="min-w-0">
                            <p className="truncate text-label-md font-semibold">{d.object_name}</p>
                            <p className="text-body-sm text-on-surface-variant">{d.kind === "perdu" ? "Perdu" : "Trouvé"} · {d.ref}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-body-sm">
                        {d.prenom} {d.nom}
                        <span className="block text-on-surface-variant">{d.classe}</span>
                      </td>
                      <td className="px-3 py-3 text-body-sm text-on-surface-variant">{formatRelativeTime(d.created_at)}</td>
                      <td className="px-5 py-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
                {detail.recentDeclarations.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-body-sm text-on-surface-variant">Aucune déclaration pour le moment.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel className="lg:col-span-5" title="Journal" subtitle="Dernières actions dans l'établissement">
          {detail.log.length === 0 ? (
            <p className="px-5 pb-5 text-body-sm text-on-surface-variant">Rien pour le moment.</p>
          ) : (
            <ol className="border-t border-border-subtle px-5">
              {detail.log.map((e) => (
                <li key={e.id} className="flex gap-3 border-b border-border-subtle py-3 last:border-0">
                  <span className="w-20 shrink-0 text-right text-body-sm text-muted">{formatRelativeTime(e.created_at)}</span>
                  <div className="min-w-0">
                    <p className="text-body-md text-on-surface">{e.message}</p>
                    <p className="text-body-sm text-muted">{e.actor_name}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Bornes" subtitle={`${t.kiosksOnline} en ligne sur ${t.kiosks}`}>
          {detail.kiosks.length === 0 ? (
            <p className="px-5 pb-5 text-body-sm text-on-surface-variant">Aucune borne créée.</p>
          ) : (
            <ul className="divide-y divide-border-subtle border-t border-border-subtle">
              {detail.kiosks.map((k) => (
                <li key={k.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={`size-2.5 shrink-0 rounded-full ${k.online ? "bg-success-emerald" : "bg-border-subtle"}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-label-md font-semibold text-on-surface">{k.name}</p>
                    <p className="truncate text-body-sm text-on-surface-variant">
                      {[k.location, `v${k.version}`, !k.paired_at ? "jamais appairée" : k.online ? "en ligne" : k.last_seen_at ? `vue ${formatRelativeTime(k.last_seen_at).toLowerCase()}` : "hors ligne"]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {isSuperAdmin && <KioskRevoke organizationId={o.id} kioskId={k.id} name={k.name} />}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Personnel" subtitle={`${t.activeMembers} compte${t.activeMembers > 1 ? "s" : ""} actif${t.activeMembers > 1 ? "s" : ""} sur ${t.members}`}>
          {detail.members.length === 0 ? (
            <p className="px-5 pb-5 text-body-sm text-on-surface-variant">Aucun compte.</p>
          ) : (
            <ul className="divide-y divide-border-subtle border-t border-border-subtle">
              {detail.members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`truncate text-label-md font-semibold ${m.active ? "text-on-surface" : "text-muted line-through"}`}>{m.full_name}</p>
                      <Badge variant={m.role === "admin" ? "primary" : "neutral"}>{MEMBER_ROLES[m.role] ?? m.role}</Badge>
                      {!m.active && <Badge variant="danger">Désactivé</Badge>}
                    </div>
                    <p className="truncate text-body-sm text-on-surface-variant">
                      {m.email} · {m.last_seen_at ? `connecté ${formatRelativeTime(m.last_seen_at).toLowerCase()}` : "jamais connecté"}
                    </p>
                  </div>
                  {isSuperAdmin && <MemberToggle organizationId={o.id} memberId={m.id} active={m.active} name={m.full_name} />}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Informations" subtitle="Coordonnées et réglages de l'établissement">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 px-5 pb-5 sm:grid-cols-2">
          <Info label="Adresse" value={[o.address, o.city].filter(Boolean).join(", ")} />
          <Info label="Téléphone" value={o.phone} />
          <Info label="E-mail de contact" value={o.contactEmail} />
          <Info label="Numéro d'aide (bornes)" value={o.helpDesk} />
          <Info label="Durée de conservation" value={`${o.retentionDays} jours`} />
          <Info label="Mise en veille des bornes" value={`${o.idleSeconds} s sans contact`} />
        </dl>
      </Panel>
    </div>
  );
}

function Panel({ title, subtitle, className = "", children }: { title: string; subtitle?: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={`flex flex-col rounded-xl bg-surface-card shadow-card ${className}`}>
      <div className="px-5 pb-3 pt-5">
        <h2 className="text-headline-sm text-on-surface">{title}</h2>
        {subtitle && <p className="text-body-sm text-on-surface-variant">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-label-sm uppercase text-on-surface-variant">{label}</dt>
      <dd className="text-metric-number text-on-surface">{value}</dd>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border-subtle pb-2">
      <dt className="shrink-0 text-body-sm text-on-surface-variant">{label}</dt>
      <dd className="text-right text-body-md text-on-surface">{value || "—"}</dd>
    </div>
  );
}

type Segment = { label: string; value: number; color: string };

function Legend({ segments, total }: { segments: Segment[]; total?: number }) {
  return (
    <ul className="mt-4 flex flex-col gap-2">
      {segments.map((s) => (
        <li key={s.label} className="flex items-center gap-2 text-body-sm">
          <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
          <span className="flex-1 text-on-surface-variant">{s.label}</span>
          <span className="font-semibold tabular-nums text-on-surface">
            {s.value}
            {total ? <span className="font-normal text-muted"> · {Math.round((s.value / total) * 100)} %</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Donut({ segments, total, emptyText }: { segments: Segment[]; total: number; emptyText: string }) {
  if (total === 0) return <p className="text-body-sm text-on-surface-variant">{emptyText}</p>;
  const visible = segments.filter((s) => s.value > 0);
  const ends = visible.reduce<number[]>((acc, s) => [...acc, (acc.at(-1) ?? 0) + (s.value / total) * 100], []);
  const stops = visible.map((s, i) => `${s.color} ${ends[i - 1] ?? 0}% ${ends[i]}%`).join(", ");
  return (
    <div className="flex flex-col items-center">
      <div className="size-36 rounded-full" style={{ background: `conic-gradient(${stops})` }} role="img" aria-label={segments.map((s) => `${s.label} : ${s.value}`).join(", ")}>
        <div className="flex size-full scale-[0.62] flex-col items-center justify-center rounded-full bg-surface-card">
          <span className="text-label-sm uppercase text-on-surface-variant">Total</span>
          <span className="text-headline-md text-on-surface">{formatNumber(total)}</span>
        </div>
      </div>
      <div className="w-full">
        <Legend segments={segments} total={total} />
      </div>
    </div>
  );
}

function DeclarationsBars({ days }: { days: DayCount[] }) {
  const max = Math.max(1, ...days.map((d) => d.perdu + d.trouve));
  const total = days.reduce((n, d) => n + d.perdu + d.trouve, 0);
  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-body-sm text-on-surface-variant">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ backgroundColor: LOST_COLOR }} />Perdus</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ backgroundColor: FOUND_COLOR }} />Trouvés</span>
        <span className="ml-auto">{total} sur la période</span>
      </div>
      <div className="flex h-48 items-end gap-1.5 border-b border-border-subtle" role="img" aria-label="Déclarations par jour sur les 14 derniers jours">
        {days.map((d) => (
          <div key={d.key} className="flex h-full flex-1 flex-col justify-end" title={`${d.label} : ${d.perdu} perdu${d.perdu > 1 ? "s" : ""}, ${d.trouve} trouvé${d.trouve > 1 ? "s" : ""}`}>
            {d.trouve > 0 && <div className="rounded-t-sm" style={{ height: `${(d.trouve / max) * 100}%`, backgroundColor: FOUND_COLOR }} />}
            {d.perdu > 0 && <div className={d.trouve > 0 ? "" : "rounded-t-sm"} style={{ height: `${(d.perdu / max) * 100}%`, backgroundColor: LOST_COLOR }} />}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {days.map((d, i) => (
          <span key={d.key} className="flex-1 text-center text-[10px] text-muted">{i % 2 === 1 ? d.label : ""}</span>
        ))}
      </div>
    </div>
  );
}
