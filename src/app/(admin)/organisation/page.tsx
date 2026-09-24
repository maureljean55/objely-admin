import { CreateOrganization } from "@/components/CreateOrganization";
import { OrganizationRow } from "@/components/OrganizationRow";
import { listOrganizations } from "@/lib/queries/organizations";

export default async function OrganisationPage() {
  const { organizations, missingTable, error } = await listOrganizations();

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <div>
        <h1 className="text-headline-md text-on-surface">Organisation</h1>
        <p className="text-body-sm text-on-surface-variant">
          Établissements inscrits sur Objely École{organizations.length > 0 && ` · ${organizations.length} au total`}
        </p>
      </div>

      {missingTable ? (
        <div role="alert" className="bg-warning-container border border-warning-amber/30 rounded-xl p-4 flex flex-col gap-1">
          <p className="text-body-md text-on-surface font-medium">La table des organisations n&apos;existe pas encore.</p>
          <p className="text-body-sm text-on-surface-variant">
            Exécutez une fois le script <code className="font-mono">sql/2026-09-24_organizations.sql</code> dans l&apos;éditeur SQL de
            Supabase, puis rechargez cette page.
          </p>
        </div>
      ) : (
        <>
          <CreateOrganization />

          {error && (
            <p role="alert" className="text-sm text-danger-crimson">
              Impossible de charger la liste : {error}
            </p>
          )}

          {organizations.length === 0 && !error ? (
            <div className="bg-surface-card rounded-xl shadow-card p-8 flex flex-col items-center text-center gap-3">
              <span className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">school</span>
              </span>
              <h2 className="text-label-md text-on-surface font-semibold">Aucun établissement inscrit</h2>
              <p className="text-body-sm text-on-surface-variant max-w-md">
                Inscrivez un lycée, une université ou une école avec le bouton ci-dessus : il apparaîtra ici avec sa date d&apos;inscription.
              </p>
            </div>
          ) : (
            organizations.length > 0 && (
              <div className="bg-surface-card rounded-xl shadow-card overflow-hidden divide-y divide-border-subtle">
                {organizations.map((organization) => (
                  <OrganizationRow key={organization.id} organization={organization} />
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
