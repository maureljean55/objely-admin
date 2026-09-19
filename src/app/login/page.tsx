"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Une erreur est survenue.");
      return;
    }

    router.push(searchParams.get("next") || "/");
    router.refresh();
  }

  return (
    <main className="w-full flex-grow flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[440px] flex flex-col items-center">
        <section className="w-full bg-surface-card rounded-2xl border border-border-subtle shadow-[0_1px_3px_0_rgba(16,38,83,0.04),0_20px_40px_-15px_rgba(8,123,234,0.07)] p-8 md:p-9">
          <header className="flex flex-col items-center text-center mb-7">
            <div className="mb-5">
              <Logo className="h-11 w-auto" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-navy mb-1.5">Administration Objely</h1>
            <p className="text-sm text-muted leading-relaxed">Gérez la plateforme Objely en toute sécurité.</p>
          </header>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-navy tracking-wide" htmlFor="admin-email">
                Adresse e-mail
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@objely.com"
                className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy placeholder:text-slate-400 transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-navy tracking-wide" htmlFor="admin-password">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full rounded-lg border border-slate-200 bg-white px-3 pr-10 py-2.5 text-sm text-navy tracking-widest placeholder:tracking-normal placeholder:text-slate-400 transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
                <button
                  type="button"
                  aria-label="Afficher ou masquer le mot de passe"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-danger-crimson bg-danger-container border border-danger-crimson/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center items-center gap-2 rounded-lg bg-gradient-to-r from-primary via-[#0772D9] to-tertiary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-60 disabled:pointer-events-none"
              >
                <span>{loading ? "Connexion…" : "Accéder au panneau d'administration"}</span>
                {!loading && (
                  <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5">arrow_forward</span>
                )}
              </button>
            </div>
          </form>
        </section>

        <p className="mt-5 text-center text-xs text-muted px-4">Accès réservé aux administrateurs autorisés d&apos;Objely.</p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <div className="h-full min-h-screen bg-surface-bg flex flex-col justify-between">
      <header className="w-full px-6 py-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 border border-slate-200/80 text-xs font-medium text-muted">
          <span className="w-2 h-2 rounded-full bg-success-emerald animate-pulse" />
          <span className="text-slate-700 font-semibold">Instance Production EU-Central</span>
        </span>
      </header>
      <Suspense>
        <LoginForm />
      </Suspense>
      <footer className="w-full py-5 px-6 border-t border-slate-200/60 text-center text-xs text-muted">
        © {new Date().getFullYear()} Objely. Tous droits réservés.
      </footer>
    </div>
  );
}
