"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, LoaderCircle, Sparkles } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { getSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && session) router.replace("/dashboard");
  }, [authLoading, router, session]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const { error: authError } = await getSupabase().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (authError) setError(authError.message);
    else router.replace("/dashboard");
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="mb-7 text-center">
          <span className="brand-mark mx-auto mb-4"><Sparkles size={18} /></span>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-muted">Sign in to pick up where you left off.</p>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label htmlFor="email" className="auth-label">Email address</label>
            <input id="email" className="auth-input" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div>
            <label htmlFor="password" className="auth-label">Password</label>
            <input id="password" className="auth-input" type="password" autoComplete="current-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button-primary w-full" type="submit" disabled={busy}>
            {busy ? <LoaderCircle size={17} className="animate-spin" /> : <>Sign in <ArrowRight size={16} /></>}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          New to DocuBrief? <Link href="/signup" className="font-semibold text-brand-600 hover:underline">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
