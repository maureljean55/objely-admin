import { CreateOrganization } from "@/components/CreateOrganization";
import { OrganizationRow } from "@/components/OrganizationRow";
import { getSession } from "@/lib/session";
import { listOrganizations } from "@/lib/queries/organizations";
import { isEcoleConfigured } from "@/lib/supabase/ecole";

export default async function OrganisationPage() {
  const session = await getSession();
  const configured = isEcoleConfigured();
  const { organizations, error } = configured ? await listOrganizations() : { organizations: [], error: null };

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <div>
        <h1 className="text-headline-md text-on-surface">Organisation</h1>
        <p className="text-body-sm text-on-surface-variant">
          Établissements inscrits sur Objely École{organizations.length > 0 && ` · ${organizations.length} au total`}
        </p>
      </div>

      {!configured ? (
        <div role="alert" className="flex flex-col gap-2 rounded-xl border border-warning-amber/30 bg-warning-container p-4">
          <p className="text-body-md font-medium text-on-surface">La base des écoles n&apos;est pas encore reliée à ce portail.</p>
          <p className="text-body-sm text-on-surface-variant">
            Ajoutez ces deux variables d&apos;environnement (projet Vercel <span className="font-mono">objely-admi</span>, ou <span className="font-mono">.env.local</span> en local), puis redéployez :
          </p>
          <ul className="list-disc pl-5 text-body-sm text-on-surface-variant">
            <li><span className="font-mono">ECOLE_SUPABASE_URL</span> = <span className="font-mono">https://jmmqgvtucavtvxwukgpw.supabase.co</span></li>
            <li><span className="font-mono">ECOLE_SUPABASE_SECRET_KEY</span> = la clé « secret » du projet objely-ecole (Project Settings, API Keys)</li>
          </ul>
        </div>
      ) : (
        <>
          <CreateOrganization />

          {error && <p role="alert" className="text-sm text-danger-crimson">Impossible de charger la liste : {error}</p>}

          {organizations.length === 0 && !error ? (
            <div className="flex flex-col items-center gap-3 rounded-xl bg-surface-card p-8 text-center shadow-card">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                <span className="material-symbols-outlined text-[24px]">school</span>
              </span>
              <h2 className="text-label-md font-semibold text-on-surface">Aucun établissement inscrit</h2>
              <p className="max-w-md text-body-sm text-on-surface-variant">
                Inscrivez un lycée, une université ou une école : le système génère son mot de passe, et il apparaît ici avec sa date d&apos;inscription.
              </p>
            </div>
          ) : (
            organizations.length > 0 && (
              <div className="divide-y divide-border-subtle overflow-hidden rounded-xl bg-surface-card shadow-card">
                {organizations.map((organization) => (
                  <OrganizationRow key={organization.id} organization={organization} isSuperAdmin={session?.role === "super_admin"} />
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
