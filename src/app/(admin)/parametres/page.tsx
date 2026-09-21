import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { PasswordForm } from "@/components/PasswordForm";
import { AvatarUploadForm } from "@/components/AvatarUploadForm";
import { getAdminAvatarUrl } from "@/lib/queries/adminUsers";

export default async function ParametresPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const avatarUrl = await getAdminAvatarUrl(session.sub);

  return (
    <div className="flex flex-col gap-5 max-w-xl">
      <div>
        <h1 className="text-headline-md text-on-surface">Paramètres</h1>
        <p className="text-body-sm text-on-surface-variant">Gérez votre compte administrateur</p>
      </div>

      <div className="bg-surface-card rounded-xl shadow-card p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-title-md text-on-surface mb-3">Photo de profil</h2>
          <AvatarUploadForm fullName={session.fullName} initialAvatarUrl={avatarUrl} />
        </div>

        <div className="pt-4 border-t border-border-subtle">
          <h2 className="text-title-md text-on-surface">Profil</h2>
          <div className="mt-3 flex flex-col gap-2 text-body-md">
            <div className="flex justify-between border-b border-border-subtle pb-2">
              <span className="text-on-surface-variant">Nom</span>
              <span className="text-on-surface font-medium">{session.fullName}</span>
            </div>
            <div className="flex justify-between border-b border-border-subtle pb-2">
              <span className="text-on-surface-variant">E-mail</span>
              <span className="text-on-surface font-medium">{session.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Rôle</span>
              <span className="text-on-surface font-medium">{session.role === "super_admin" ? "Super Admin" : "Admin"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-card rounded-xl shadow-card p-5">
        <h2 className="text-title-md text-on-surface mb-3">Changer le mot de passe</h2>
        <PasswordForm />
      </div>
    </div>
  );
}
