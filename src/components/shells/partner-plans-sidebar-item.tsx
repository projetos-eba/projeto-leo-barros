"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletCards } from "lucide-react";

export function PartnerPlansSidebarItem() {
  const pathname = usePathname() ?? "";
  const active = pathname === "/parceiros/planos" || pathname.startsWith("/parceiros/planos/");

  return (
    <>
      <Link
        aria-current={active ? "page" : undefined}
        className={`fixed left-3 top-[272px] z-50 hidden h-10 w-[169px] items-center gap-3 rounded-[8px] px-3 text-[14px] font-semibold lg:flex ${active ? "bg-[#0a2c48] text-[#cfddea]" : "text-[#8a99a6] hover:bg-[#102a36]/60 hover:text-[#cfddea]"}`}
        href="/parceiros/planos"
      >
        <WalletCards className="size-5 shrink-0" />
        <span>Planos & Financeiro</span>
      </Link>
      <Link
        className={`fixed bottom-3 right-3 z-50 flex items-center gap-2 rounded-full border border-[#1d4f70] bg-[#0b2230] px-4 py-2 text-xs font-semibold shadow-xl lg:hidden ${active ? "text-white" : "text-[#8fc9ef]"}`}
        href="/parceiros/planos"
      >
        <WalletCards className="size-4" /> Planos
      </Link>
    </>
  );
}