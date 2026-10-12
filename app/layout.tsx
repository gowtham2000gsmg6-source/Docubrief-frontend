import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";

import { AppHeader } from "@/components/app-header";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "DocuBrief — Understand documents faster",
  description: "Upload, organize, and summarize your documents with AI.",
  icons: { icon: "/docubrief-mark.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${inter.className}`}>
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(122,92,248,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(103,156,255,0.12),transparent_28%)]" />
        <Providers>
          <AppHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
