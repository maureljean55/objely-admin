"use client";

import { useState } from "react";
import { OrganizationForm } from "@/components/OrganizationForm";
import { createOrganization } from "@/lib/actions/organizations";

export function CreateOrganization() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:brightness-105"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        Inscrire un établissement
      </button>
    );
  }

  return (
    <div className="bg-surface-card rounded-xl shadow-card p-4 flex flex-col gap-3">
      <h2 className="text-label-md text-on-surface font-semibold">Inscrire un établissement</h2>
      <OrganizationForm
        submitLabel="Inscrire"
        pendingLabel="Inscription…"
        onSubmit={createOrganization}
        onCancel={() => setOpen(false)}
        onDone={() => setOpen(false)}
      />
    </div>
  );
}
