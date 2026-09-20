import { getSession } from "@/lib/session";
import { listAdmins } from "@/lib/queries/adminUsers";
import { removeAdmin } from "@/lib/actions/adminUsers";
import { Badge } from "@/components/Badge";
import { formatDateTime, initials } from "@/lib/format";
import { CreateAdminForm } from "@/components/CreateAdminForm";

export default async function AdministrateursPage() {
  const session = await getSession();
  const admins = await listAdmins();
  const isSuperAdmin = session?.role === "super_admin";

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div>
        <h1 className="text-headline-md text-on-surface">Administrateurs</h1>
        <p className="text-body-sm text-on-surface-variant">Comptes ayant accès au portail d&apos;administration Objely</p>
      </div>

      <div className="bg-surface-card rounded-xl shadow-card overflow-hidden divide-y divide-border-subtle">
        {admins.map((admin) => (
          <div key={admin.id} className="flex items-center gap-4 p-4">
            <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-label-md font-semibold shrink-0">
              {initials(admin.fullName)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-label-md text-on-surface font-semibold truncate">{admin.fullName}</span>
                {admin.id === session?.sub && <Badge variant="primary">Vous</Badge>}
              </div>
              <p className="text-body-sm text-on-surface-variant truncate">{admin.email}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0 text-right">
              <Badge variant={admin.role === "super_admin" ? "tertiary" : "neutral"}>{admin.role === "super_admin" ? "Super Admin" : "Admin"}</Badge>
              <span className="text-label-sm text-on-surface-variant">
                {admin.lastLoginAt ? `Connecté ${formatDateTime(admin.lastLoginAt)}` : "Jamais connecté"}
              </span>
            </div>
            {isSuperAdmin && admin.id !== session?.sub && (
              <form
                action={async () => {
                  "use server";
                  await removeAdmin(admin.id);
                }}
              >
                <button type="submit" className="p-2 rounded-lg text-danger-crimson hover:bg-danger-container transition-colors" title="Supprimer">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </form>
            )}
          </div>
        ))}
      </div>

      {isSuperAdmin ? (
        <div className="bg-surface-card rounded-xl shadow-card p-5">
          <h2 className="text-title-md text-on-surface mb-3">Ajouter un administrateur</h2>
          <CreateAdminForm />
        </div>
      ) : (
        <p className="text-body-sm text-on-surface-variant">Seuls les super admins peuvent ajouter ou supprimer des administrateurs.</p>
      )}
    </div>
  );
}
