"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { logoutPartner } from "@/app/login/actions";
import { PlatformLogo } from "@/components/branding/platform-logo";
import { usePlatformBranding } from "@/components/branding/use-platform-branding";
import { Button } from "@/components/ui/button";

type PartnerBillingShellProps = {
  children: ReactNode;
};

export function PartnerBillingShell({ children }: PartnerBillingShellProps) {
  const branding = usePlatformBranding();

  return (
    <div className="min-h-screen bg-[#0b1720] font-['Rethink_Sans',sans-serif] text-[#f1f6fa]">
      <header className="border-b border-[#1f3a4b] bg-[#0a151d]/95 px-5 py-4 md:px-8 lg:px-[43px]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <Link className="flex items-center gap-3" href="/planos">
            <PlatformLogo className="size-10 rounded-[8px] bg-[#f4f8fb] text-[13px] text-[#07131d]" fallbackClassName="text-[13px] font-black" />
            <span className="leading-none">
              <span className="block max-w-[190px] truncate text-[15px] font-extrabold text-[#f4f8fb]">{branding.platformName}</span>
              <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8ca1af]">
                {branding.tagline}
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Button asChild className="rounded-[8px]" size="sm" variant="outline">
              <Link href="/planos">Planos</Link>
            </Button>
            <form action={logoutPartner}>
              <Button className="rounded-[8px]" size="sm" type="submit" variant="ghost">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
