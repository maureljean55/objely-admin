import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getItemDetail } from "@/lib/queries/items";
import { Badge } from "@/components/Badge";
import { formatDateTime } from "@/lib/format";
import { ModerateItemForm } from "@/components/ModerateItemForm";

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItemDetail(id);
  if (!item) notFound();

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/objets" className="p-2 rounded-lg hover:bg-surface-bg text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-headline-md text-on-surface">{item.title}</h1>
          <p className="text-body-sm text-on-surface-variant">
            {item.categoryLabel} · {item.type === "lost" ? "Objet perdu" : "Objet trouvé"}
          </p>
        </div>
        <div className="ml-auto">
          {item.deletedAt ? <Badge variant="danger">Supprimé</Badge> : <Badge variant="primary">{item.status}</Badge>}
        </div>
      </div>

      {item.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {item.photos.map((url) => (
            <Image key={url} src={url} alt="" width={200} height={200} className="w-full aspect-square object-cover rounded-lg border border-border-subtle" />
          ))}
        </div>
      )}

      <div className="bg-surface-card rounded-xl shadow-card p-5 flex flex-col gap-3">
        <Field label="Description" value={item.description || "—"} />
        <Field label="Marque" value={item.brand || "—"} />
        <Field label="Couleurs" value={item.colors?.join(", ") || "—"} />
        <Field label="Lieu" value={item.location || "—"} />
        <Field label="Propriétaire" value={`${item.ownerName} (${item.ownerEmail ?? "—"})`} />
        <Field label="Déclaré le" value={formatDateTime(item.createdAt)} />
        <Field label="Détail privé de vérification" value={item.hasSecret ? "Oui, enregistré" : "Aucun"} />
        {item.deletedAt && <Field label="Motif de suppression" value={item.deletionReason || "—"} />}
      </div>

      <ModerateItemForm itemId={item.id} isDeleted={Boolean(item.deletedAt)} />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border-subtle pb-2 last:border-0 last:pb-0">
      <span className="text-body-sm text-on-surface-variant shrink-0">{label}</span>
      <span className="text-body-md text-on-surface text-right">{value}</span>
    </div>
  );
}
