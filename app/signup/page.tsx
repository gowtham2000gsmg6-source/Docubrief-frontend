"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, LoaderCircle, Sparkles } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { getSupabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!authLoading && session) router.replace("/dashboard");
  }, [authLoading, router, session]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const { data, error: authError } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setBusy(false);
    if (authError) setError(authError.message);
    else if (data.session) router.replace("/dashboard");
    else setSent(true);
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="mb-7 text-center">
          <span className="brand-mark mx-auto mb-4"><Sparkles size={18} /></span>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">Create your account</h1>
          <p className="mt-2 text-sm text-muted">Your documents, made easier to understand.</p>
        </div>
        {sent ? (
          <div className="rounded-xl bg-brand-50 p-4 text-sm leading-6 text-brand-700">
            Check your email for a confirmation link to finish setting up your account.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label htmlFor="email" className="auth-label">Email address</label>
              <input id="email" className="auth-input" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div>
              <label htmlFor="password" className="auth-label">Password</label>
              <input id="password" className="auth-input" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} />
              <p className="mt-2 text-xs text-muted">Use at least 8 characters.</p>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button-primary w-full" type="submit" disabled={busy}>
              {busy ? <LoaderCircle size={17} className="animate-spin" /> : <>Create account <ArrowRight size={16} /></>}
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-muted">
          Already have an account? <Link href="/login" className="font-semibold text-brand-600 hover:underline">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
