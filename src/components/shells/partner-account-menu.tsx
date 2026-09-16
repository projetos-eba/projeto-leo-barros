"use client";

import Link from "next/link";
import { ChevronDown, CreditCard, LogOut, UserRound } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { logoutPartner } from "@/app/login/actions";
import { cn } from "@/lib/utils";

type PartnerAccountMenuProps = {
  accountName?: string | null;
  className?: string;
  planActive?: boolean;
};

export function PartnerAccountMenu({ accountName, className, planActive = false }: PartnerAccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [logoutPending, startLogoutTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const label = accountName?.trim() || "Minha conta";

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex min-w-[190px] items-center gap-3 rounded-[10px] border border-[#294657] bg-[#0e202c] px-3 py-2 text-left transition-colors hover:border-[#3d6a82] hover:bg-[#102a36]"
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-[#1b3340] text-[#9bc8e7]">
          <UserRound className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-[#eaf2f7]">{label}</span>
          <span className="block truncate text-[11px] text-[#8297a6]">
            {planActive ? "Plano ativo" : "Conta profissional"}
          </span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-[#8ca1af] transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[80] w-[236px] rounded-[10px] border border-[#294657] bg-[#101c27] p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.4)]" role="menu">
          <Link
            className="flex items-center gap-2 rounded-[7px] px-3 py-2.5 text-[13px] font-medium text-[#cfddea] transition-colors hover:bg-[#183445] hover:text-white"
            href="/parceiros/configuracoes/geral"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <UserRound className="size-4 text-[#6bbcf3]" />
            Minha conta
          </Link>
          <Link
            className="flex items-center gap-2 rounded-[7px] px-3 py-2.5 text-[13px] font-medium text-[#cfddea] transition-colors hover:bg-[#183445] hover:text-white"
            href="/parceiros/configuracoes/assinatura"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <CreditCard className="size-4 text-[#6bbcf3]" />
            Ver assinatura
          </Link>
          <div className="my-1 border-t border-[#294657]/70" />
          <button
            className="flex w-full items-center gap-2 rounded-[7px] px-3 py-2.5 text-left text-[13px] font-medium text-[#ffb8c2] transition-colors hover:bg-[#32151b]/80 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={logoutPending}
            role="menuitem"
            type="button"
            onClick={() => startLogoutTransition(() => void logoutPartner())}
          >
            <LogOut className="size-4" />
            {logoutPending ? "Saindo..." : "Sair"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
