"use client";

import { useState } from "react";
import type { Credentials } from "@/lib/organizations-shared";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard blocked: the value is still selectable on screen.
        }
      }}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-border-subtle bg-white px-3 py-1.5 text-label-sm font-semibold text-on-surface hover:bg-surface-bg"
    >
      <span className="material-symbols-outlined text-[16px]">{copied ? "check" : "content_copy"}</span>
      {copied ? "Copié" : label}
    </button>
  );
}

// Shown once, right after an establishment is registered or its password reset. The password exists nowhere else.
export function CredentialsDialog({ credentials, title, onClose }: { credentials: Credentials; title: string; onClose: () => void }) {
  const sheet = `Objely École · accès à l'administration\nÉtablissement : ${credentials.organizationName}\nAdresse : ${credentials.loginUrl}\nIdentifiant : ${credentials.email}\nMot de passe : ${credentials.password}`;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="credentials-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <div className="w-full max-w-[520px] rounded-xl bg-surface-card p-6 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-success-container text-success-emerald">
            <span className="material-symbols-outlined text-[22px]">check_circle</span>
          </span>
          <div>
            <h2 id="credentials-title" className="text-headline-sm text-on-surface">{title}</h2>
            <p className="text-body-sm text-on-surface-variant">{credentials.organizationName}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <div>
            <p className="mb-1 text-label-sm text-on-surface-variant">Adresse de connexion</p>
            <p className="rounded-lg bg-surface-bg px-3 py-2 font-mono text-body-sm text-on-surface select-all">{credentials.loginUrl}</p>
          </div>
          <div>
            <p className="mb-1 text-label-sm text-on-surface-variant">Identifiant (e-mail)</p>
            <p className="rounded-lg bg-surface-bg px-3 py-2 font-mono text-body-sm text-on-surface select-all">{credentials.email}</p>
          </div>
          <div>
            <p className="mb-1 text-label-sm text-on-surface-variant">Mot de passe généré</p>
            <p className="rounded-lg border-2 border-primary bg-white px-3 py-3 text-center font-mono text-[22px] font-semibold tracking-wider text-on-surface select-all">
              {credentials.password}
            </p>
          </div>
        </div>

        <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg bg-warning-container px-3 py-2.5 text-body-sm text-warning-amber">
          <span className="material-symbols-outlined mt-px text-[18px]">warning</span>
          <span>
            Ce mot de passe ne sera <strong>plus jamais affiché</strong>. Copiez-le ou transmettez-le maintenant. S&apos;il est perdu, vous pourrez en générer un nouveau.
          </span>
        </p>

        <div className="mt-5 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <CopyButton text={credentials.password} label="Copier le mot de passe" />
            <CopyButton text={sheet} label="Copier les identifiants" />
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:brightness-105">
              Terminé
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
