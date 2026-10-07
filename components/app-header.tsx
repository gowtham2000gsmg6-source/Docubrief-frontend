"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Sparkles } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";

export function AppHeader() {
  const { session, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <header className="app-header">
      <Link href="/dashboard" className="brand">
        <span className="brand-mark"><Sparkles size={17} /></span>
        <span>DocuBrief</span>
      </Link>
      <nav className="header-actions" aria-label="Main navigation">
        {session && (
          <span className="hidden text-sm text-muted sm:inline">
            {session.user.email}
          </span>
        )}
        <ThemeToggle />
        {session && (
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="icon-button"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        )}
      </nav>
    </header>
  );
}
