"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, Sparkles } from "lucide-react";

import { getSupabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function checkRecoverySession() {
      try {
        const { data, error: sessionError } = await getSupabase().auth.getSession();
        if (!active) return;
        if (sessionError) setError(sessionError.message);
        setHasRecoverySession(Boolean(data.session));
      } catch (sessionError: unknown) {
        if (active) {
          setError(
            sessionError instanceof Error
              ? sessionError.message
              : "Could not verify the password reset link.",
          );
        }
      } finally {
        if (active) setCheckingSession(false);
      }
    }

    void checkRecoverySession();

    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const { error: updateError } = await getSupabase().auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      router.replace("/dashboard");
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not update your password.",
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
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">Choose a new password</h1>
          <p className="mt-2 text-sm text-muted">Use at least 8 characters for your new password.</p>
        </div>
        {checkingSession ? (
          <p className="flex items-center justify-center gap-2 text-sm text-muted">
            <LoaderCircle size={16} className="animate-spin" /> Verifying your reset link…
          </p>
        ) : hasRecoverySession ? (
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label htmlFor="password" className="auth-label">New password</label>
              <input
                id="password"
                className="auth-input"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="auth-label">Confirm new password</label>
              <input
                id="confirm-password"
                className="auth-input"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button-primary w-full" type="submit" disabled={busy}>
              {busy ? <LoaderCircle size={17} className="animate-spin" /> : <>Update password <ArrowRight size={16} /></>}
            </button>
          </form>
        ) : (
          <div>
            <p className="form-error" role="alert">
              {error ?? "This password reset link is invalid or has expired. Request a new one to continue."}
            </p>
            <Link href="/forgot-password" className="button-primary mt-6 w-full">
              Request another reset link <ArrowRight size={16} />
            </Link>
          </div>
        )}
        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/login" className="font-semibold text-brand-600 hover:underline">Back to sign in</Link>
        </p>
      </section>
    </main>
  );
}
