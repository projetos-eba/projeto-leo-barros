"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { PlatformLogo } from "@/components/branding/platform-logo";
import { usePlatformBranding } from "@/components/branding/use-platform-branding";

type AuthCardShellProps = {
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
  subtitle: string;
  title: string;
};

export function AuthCardShell({
  backHref = "/",
  backLabel = "Voltar",
  children,
  subtitle,
  title,
}: AuthCardShellProps) {
  const branding = usePlatformBranding();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-10 text-foreground">
      <div className="pointer-events-none absolute left-[-120px] top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-[-120px] h-96 w-96 rounded-full bg-primary/5 blur-[150px]" />

      <section className="page-enter relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-3">
            <PlatformLogo className="h-12 w-12 rounded-xl bg-primary/10 text-primary" fallbackClassName="text-base text-primary" showIconFallback />
            <div className="text-left">
              <p className="text-xl font-bold text-foreground">
                {branding.platformName}
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {branding.tagline}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {subtitle}
            </p>
          </div>
          {children}
        </div>

        <div className="mt-5 text-center">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
