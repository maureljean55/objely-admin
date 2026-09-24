// Placeholder: organisations (lycées, universités) are not modelled in the database yet.
// Replace the empty state with a real list once the organisations table exists.
export default function OrganisationPage() {
  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div>
        <h1 className="text-headline-md text-on-surface">Organisation</h1>
        <p className="text-body-sm text-on-surface-variant">Lycées et universités qui utilisent la borne Objely École</p>
      </div>

      <div className="bg-surface-card rounded-xl shadow-card p-8 flex flex-col items-center text-center gap-3">
        <span className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">school</span>
        </span>
        <h2 className="text-label-md text-on-surface font-semibold">Aucun établissement pour le moment</h2>
        <p className="text-body-sm text-on-surface-variant max-w-md">
          Les établissements apparaîtront ici dès qu&apos;ils seront enregistrés : nom, type (lycée ou université) et
          bornes installées.
        </p>
      </div>
    </div>
  );
}
