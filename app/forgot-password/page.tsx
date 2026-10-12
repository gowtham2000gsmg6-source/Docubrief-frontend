"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, LoaderCircle, Sparkles } from "lucide-react";

import { getSupabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error: resetError } = await getSupabase().auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        },
      );
      if (resetError) setError(resetError.message);
      else setSent(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not request a password reset.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="mb-7 text-center">
          <span className="brand-mark mx-auto mb-4"><Sparkles size={18} /></span>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">Reset your password</h1>
          <p className="mt-2 text-sm text-muted">We’ll email you a link to choose a new password.</p>
        </div>
        {sent ? (
          <div className="rounded-xl bg-brand-50 p-4 text-sm leading-6 text-brand-700" role="status">
            If an account exists for that email address, a password reset link has been sent.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label htmlFor="email" className="auth-label">Email address</label>
              <input
                id="email"
                className="auth-input"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button-primary w-full" type="submit" disabled={busy}>
              {busy ? <LoaderCircle size={17} className="animate-spin" /> : <>Send reset link <ArrowRight size={16} /></>}
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-muted">
          Remember your password? <Link href="/login" className="font-semibold text-brand-600 hover:underline">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
