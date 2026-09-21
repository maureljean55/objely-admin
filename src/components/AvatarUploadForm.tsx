"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { updateAdminAvatar } from "@/lib/actions/settings";
import { initials } from "@/lib/format";

export function AvatarUploadForm({ fullName, initialAvatarUrl }: { fullName: string; initialAvatarUrl: string | null }) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setMessage(null);
    setFile(selected);
  }

  function handleUpload() {
    if (!file) return;
    setMessage(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);
      const result = await updateAdminAvatar(formData);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else if (result.avatarUrl) {
        setAvatarUrl(result.avatarUrl);
        setFile(null);
        setMessage({ type: "success", text: "Photo de profil mise à jour." });
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  const displayUrl = previewUrl ?? avatarUrl;

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-primary-container text-on-primary-container flex items-center justify-center text-title-md font-semibold shrink-0">
        {displayUrl ? (
          <Image src={displayUrl} alt="" fill sizes="64px" className="object-cover" unoptimized={!!previewUrl} />
        ) : (
          initials(fullName)
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="avatar-file-input" />
          <label
            htmlFor="avatar-file-input"
            className="px-3 py-1.5 rounded-lg bg-surface-bg border border-border-subtle text-label-md text-on-surface cursor-pointer hover:bg-border-subtle/40 transition-colors"
          >
            Choisir une image
          </label>
          {file && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg bg-primary text-white text-label-md font-semibold hover:brightness-105 disabled:opacity-60 transition-colors"
            >
              {isPending ? "Envoi…" : "Enregistrer"}
            </button>
          )}
        </div>
        {message && (
          <p className={`text-label-sm ${message.type === "error" ? "text-danger-crimson" : "text-success-emerald"}`}>{message.text}</p>
        )}
        {!message && <p className="text-label-sm text-on-surface-variant">JPG ou PNG, 5 Mo maximum.</p>}
      </div>
    </div>
  );
}
