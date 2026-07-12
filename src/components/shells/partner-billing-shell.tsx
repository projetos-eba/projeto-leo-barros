import Link from "next/link";
import type { ReactNode } from "react";

import { logoutPartner } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

type PartnerBillingShellProps = {
  children: ReactNode;
};

export function PartnerBillingShell({ children }: PartnerBillingShellProps) {
  return (
    <div className="min-h-screen bg-[#0b1720] font-['Rethink_Sans',sans-serif] text-[#f1f6fa]">
      <header className="border-b border-[#1f3a4b] bg-[#0a151d]/95 px-5 py-4 md:px-8 lg:px-[43px]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <Link className="flex items-center gap-3" href="/planos">
            <span className="flex size-10 items-center justify-center rounded-[8px] bg-[#f4f8fb] text-[15px] font-black text-[#07131d]">
              LB
            </span>
            <span className="leading-none">
              <span className="block text-[15px] font-extrabold text-[#f4f8fb]">Leonardo Barros</span>
              <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8ca1af]">
                Saude | Nutricao | Performance
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
