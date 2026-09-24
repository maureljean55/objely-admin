"use client";

import { useState } from "react";
import { CredentialsDialog } from "@/components/CredentialsDialog";
import { OrganizationForm } from "@/components/OrganizationForm";
import { createOrganization } from "@/lib/actions/organizations";
import type { ActionResult, Credentials, OrganizationInput } from "@/lib/organizations-shared";

export function CreateOrganization({ create = createOrganization }: { create?: (input: OrganizationInput) => Promise<ActionResult<{ credentials: Credentials }>> }) {
  const [open, setOpen] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="self-start inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-105"
        >
          <span className="material-symbols-outlined text-[18px]">add_business</span>
          Inscrire un établissement
        </button>
      ) : (
        <div className="flex flex-col gap-4 rounded-xl bg-surface-card p-6 shadow-card">
          <h2 className="text-headline-sm text-on-surface">Inscrire un établissement</h2>
          <OrganizationForm
            mode="create"
            onCancel={() => setOpen(false)}
            onSubmit={async (input) => {
              const result = await create(input);
              if (result.ok) {
                // Close the form only once the password is on screen: it cannot be shown again.
                setCredentials(result.credentials);
                setOpen(false);
              }
              return result;
            }}
          />
        </div>
      )}
      {credentials && <CredentialsDialog title="Établissement inscrit" credentials={credentials} onClose={() => setCredentials(null)} />}
    </>
  );
}
