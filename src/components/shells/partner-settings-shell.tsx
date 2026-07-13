"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, CreditCard, LogOut, Settings, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useTransition } from "react";

import { logoutPartner } from "@/app/login/actions";
import { PlatformLogo } from "@/components/branding/platform-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PartnerSettingsShellProps = {
  children: ReactNode;
};

const settingsItems = [
  { href: "/parceiros/configuracoes/geral", icon: UserRound, label: "Geral" },
  { href: "/parceiros/configuracoes/assinatura", icon: CreditCard, label: "Assinatura" },
] as const;

export function PartnerSettingsShell({ children }: PartnerSettingsShellProps) {
  const pathname = usePathname() ?? "";
  const [logoutPending, startLogoutTransition] = useTransition();

  return (
    <div className="min-h-screen bg-[#0b1720] text-[#f1f6fa]">
      <header className="sticky top-0 z-40 border-b border-[#142432] bg-[#0b1720]/96 backdrop-blur-xl lg:hidden">
        <div className="flex h-14 items-center justify-between gap-3 px-3">
          <Link className="flex min-w-0 items-center gap-2" href="/parceiros/dashboard">
            <PlatformLogo className="size-8 rounded-[6px] bg-[#f4f7fa] text-[12px] text-[#092333]" fallbackClassName="text-[12px]" />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-bold leading-4 text-[#eaf2f7]">Configuracoes</span>
              <span className="block text-[9px] font-semibold uppercase leading-3 text-[#7c93a3]">Parceiros</span>
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Link
              aria-label="Voltar ao painel"
              className="flex size-9 items-center justify-center rounded-[8px] text-[#8a99a6] hover:bg-[#102a36]/70 hover:text-[#cfddea]"
              href="/parceiros/dashboard"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <button
              aria-label={logoutPending ? "Saindo" : "Sair"}
              className="flex size-9 items-center justify-center rounded-[8px] text-[#8a99a6] transition-colors hover:bg-[#32151b]/70 hover:text-[#ffb8c2] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={logoutPending}
              type="button"
              onClick={() => startLogoutTransition(() => {
                void logoutPartner();
              })}
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
        <nav aria-label="Navegacao de configuracoes" className="flex gap-1 overflow-x-auto px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {settingsItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[8px] px-3 text-[12px] font-semibold transition-colors",
                  isActive ? "bg-[#0a2c48] text-[#d7e8f7]" : "text-[#8a99a6] hover:bg-[#102a36]/70 hover:text-[#cfddea]",
                )}
                href={item.href}
                key={item.href}
              >
                <item.icon className="size-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[220px] border-r border-[#000a1c]/60 bg-[#0e151a] lg:block">
        <div className="flex h-full flex-col px-3 py-[33px]">
          <div className="flex items-center gap-2.5 px-[15px]">
            <PlatformLogo className="size-[37px] rounded-[6px] bg-[#f4f7fa] text-[14px] text-[#092333]" fallbackClassName="text-[14px]" />
            <span className="min-w-0">
              <span className="block text-[17px] font-bold leading-[17px] text-[#eaf2f7]">Configuracoes</span>
              <span className="mt-0.5 block text-[8px] font-medium uppercase leading-[10px] text-[#7c93a3]">
                Parceiros
              </span>
            </span>
          </div>

          <div className="mt-8 px-3">
            <Button asChild className="h-10 w-full justify-start rounded-[8px]" size="sm" variant="outline">
              <Link href="/parceiros/dashboard">
                <ArrowLeft className="mr-2 size-4" />
                Voltar ao painel
              </Link>
            </Button>
          </div>

          <nav className="mt-5 space-y-2">
            {settingsItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-[8px] px-3 text-[14px] font-semibold transition-colors",
                    isActive ? "bg-[#0a2c48] text-[#cfddea]" : "text-[#8a99a6] hover:bg-[#102a36]/60 hover:text-[#cfddea]",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <item.icon className="size-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-2 pb-5">
            <div className="flex h-10 items-center gap-3 rounded-[8px] px-3 text-[14px] font-semibold text-[#cfddea]">
              <Settings className="size-5 shrink-0" />
              <span>Configuracoes</span>
            </div>
            <button
              className="flex h-10 w-full items-center gap-3 rounded-[8px] px-3 text-left text-[14px] font-semibold text-[#8a99a6] transition-colors hover:bg-[#32151b]/70 hover:text-[#ffb8c2] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={logoutPending}
              type="button"
              onClick={() => startLogoutTransition(() => {
                void logoutPartner();
              })}
            >
              <LogOut className="size-5 shrink-0" />
              <span>{logoutPending ? "Saindo..." : "Sair"}</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-[220px]">{children}</main>
    </div>
  );
}
