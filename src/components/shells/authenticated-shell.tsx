"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  CalendarDays,
  Dumbbell,
  FileText,
  HeartPulse,
  HelpCircle,
  LayoutDashboard,
  Library,
  LogOut,
  Settings,
  TrendingUp,
  UserRoundCog,
  Users,
  Utensils,
  WalletCards,
} from "lucide-react";
import type { ReactNode } from "react";
import { useTransition } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { logout } from "@/app/login/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ClientShellIdentity } from "@/lib/clients/home-data";
import { cn } from "@/lib/utils";

type ShellProfile = "cliente" | "parceiros" | "admin";

type ShellNavigationItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  implemented?: boolean;
};

type ShellDefinition = {
  badge: string;
  description: string;
  navigation: ShellNavigationItem[];
  title: string;
};

const shellDefinitions: Record<ShellProfile, ShellDefinition> = {
  cliente: {
    badge: "Cliente",
    description: "Rotina, saúde e evolução pessoal.",
    title: "LB Saúde",
    navigation: [
      { href: "/cliente/inicio", icon: LayoutDashboard, label: "Início", implemented: true },
      { href: "/cliente/dieta", icon: Utensils, label: "Dieta" },
      { href: "/cliente/treino", icon: Dumbbell, label: "Treino" },
      { href: "/cliente/saude", icon: HeartPulse, label: "Saúde" },
      { href: "/cliente/evolucao", icon: TrendingUp, label: "Minha Evolução" },
      { href: "/cliente/configuracoes", icon: Settings, label: "Configurações" },
    ],
  },
  parceiros: {
    badge: "Parceiros",
    description: "Operação profissional e acompanhamento de clientes.",
    title: "Leonardo Barros",
    navigation: [
      { href: "/parceiros/dashboard", icon: Activity, label: "Visão Geral", implemented: true },
      { href: "/parceiros/clientes", icon: Users, label: "Clientes", implemented: true },
      { href: "/parceiros/agenda", icon: CalendarDays, label: "Agenda", implemented: true },
      { href: "/parceiros/materiais", icon: Library, label: "Materiais", implemented: true },
      { href: "/parceiros/cadastros", icon: FileText, label: "Cadastro", implemented: true },
      { href: "/parceiros/configuracoes", icon: Settings, label: "Configurações" },
    ],
  },
  admin: {
    badge: "Admin",
    description: "Gestão executiva e operacional da plataforma.",
    title: "Leonardo Barros",
    navigation: [
      { href: "/admin/dashboard", icon: LayoutDashboard, label: "Visão Geral", implemented: true },
      { href: "/admin/profissionais", icon: UserRoundCog, label: "Parceiros/Profissionais", implemented: true },
      { href: "/admin/clientes", icon: Users, label: "Clientes", implemented: true },
      { href: "/admin/financeiro", icon: WalletCards, label: "Financeiro & Planos", implemented: true },
      { href: "/admin/suporte", icon: HelpCircle, label: "Suporte", implemented: true },
      { href: "/admin/configuracoes", icon: Settings, label: "Configurações", implemented: true },
    ],
  },
};

type AuthenticatedShellProps = {
  children: ReactNode;
  clientIdentity?: ClientShellIdentity | null;
  profile: ShellProfile;
};

export function AuthenticatedShell({ children, clientIdentity, profile }: AuthenticatedShellProps) {
  const pathname = usePathname() ?? "";
  const [logoutPending, startLogoutTransition] = useTransition();
  const definition = shellDefinitions[profile];

  if (profile === "cliente") {
    const identity = clientIdentity ?? {
      avatarUrl: null,
      initial: "C",
      name: "Cliente",
    };

    return (
      <div className="min-h-screen bg-[#07141d] text-[#f9fafb]">
        <header className="sticky top-0 z-40 border-b border-[#132430] bg-[#07141d]/95 shadow-[0_2px_4px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="mx-auto flex h-[81px] w-full max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
            <Link className="flex items-center gap-3" href="/cliente/inicio">
              <div className="flex size-10 items-center justify-center rounded-[9px] bg-[#f4f7fa] text-[21px] font-bold leading-none text-[#092333]">
                lß
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="text-[18px] font-bold leading-[17px] text-[#eaf2f7]">Leonardo</p>
                <p className="text-[18px] font-bold leading-[17px] text-[#eaf2f7]">Barros</p>
                <p className="mt-0.5 text-[7px] font-medium uppercase leading-[8px] text-[#7c93a3]">
                  Saude | Nutricao | Performance
                </p>
              </div>
            </Link>

            <nav aria-label="Navegação Cliente" className="hidden items-center gap-5 md:flex">
              <Link
                aria-current={pathname === "/cliente/inicio" ? "page" : undefined}
                className={cn(
                  "rounded-[10px] px-4 py-2 text-[14px] font-medium transition-colors",
                  pathname === "/cliente/inicio"
                    ? "text-white"
                    : "text-[#b9c0d0]/70 hover:bg-white/[0.04] hover:text-white",
                )}
                href="/cliente/inicio"
              >
                Home
              </Link>
              <button
                aria-disabled="true"
                className="rounded-[10px] px-4 py-2 text-[14px] font-medium text-[#b9c0d0]/45"
                disabled
                type="button"
              >
                Minha Evolução
              </button>
              <button
                aria-disabled="true"
                className="rounded-[10px] px-4 py-2 text-[14px] font-medium text-[#b9c0d0]/45"
                disabled
                type="button"
              >
                Configurações
              </button>
            </nav>

            <div className="flex items-center gap-3">
              <button
                aria-label="Notificações"
                className="relative hidden size-10 items-center justify-center rounded-full text-[#b9c0d0] transition hover:bg-white/[0.05] hover:text-white sm:flex"
                type="button"
              >
                <Bell className="size-5" />
                <span className="absolute right-2 top-2 size-2 rounded-full bg-[#e77]" />
              </button>
              <div className="hidden h-9 w-px bg-[#2a3a48] sm:block" />
              <div className="flex items-center gap-3">
                <span className="hidden max-w-[120px] truncate text-right text-[14px] font-medium text-white sm:block">
                  {identity.name}
                </span>
                <Avatar className="size-9 border border-white/10 bg-[#e1e7ff]">
                  {identity.avatarUrl ? <AvatarImage alt="" src={identity.avatarUrl} /> : null}
                  <AvatarFallback className="bg-[#e1e7ff] text-[13px] font-bold text-[#092333]">
                    {identity.initial}
                  </AvatarFallback>
                </Avatar>
              </div>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-[10px] px-3 text-[13px] font-semibold text-[#b9c0d0] transition hover:bg-[#32151b]/70 hover:text-[#ffb8c2] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={logoutPending}
                type="button"
                onClick={() => startLogoutTransition(() => {
                  void logout();
                })}
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">{logoutPending ? "Saindo..." : "Sair"}</span>
              </button>
            </div>
          </div>
        </header>

        <main>{children}</main>
      </div>
    );
  }

  if (profile === "admin" || profile === "parceiros") {
    const isPartner = profile === "parceiros";
    const sidebarWidth = isPartner ? "lg:pl-[193px]" : "lg:pl-[235px]";
    const asideWidth = isPartner ? "w-[193px]" : "w-[235px]";
    const navTopClass = isPartner ? "mt-8 space-y-2" : "mt-10 space-y-[15px]";
    const logoSizeClass = isPartner ? "size-[37px] rounded-[6px]" : "size-[37px] rounded-[6px]";

    return (
      <div className="min-h-screen bg-[#0b1720] text-[#f1f6fa]">
        <aside className={cn("fixed inset-y-0 left-0 z-40 hidden border-r border-[#000a1c]/60 lg:block", asideWidth, isPartner ? "bg-[#0e151a]" : "bg-[#071923]/95")}>
          <div className={cn("flex h-full flex-col", isPartner ? "px-3 py-[33px]" : "px-[14px] py-8")}>
            <div className={cn("flex items-center gap-2.5", isPartner ? "px-[15px]" : "px-5")}>
              <div className={cn("flex items-center justify-center bg-[#f4f7fa] text-[18px] font-bold leading-none text-[#092333]", logoSizeClass)}>
                lß
              </div>
              <div className="min-w-0">
                <p className={cn("font-bold text-[#eaf2f7]", isPartner ? "text-[17px] leading-[17px]" : "text-[18px] leading-[18px]")}>
                  Leonardo
                </p>
                <p className={cn("font-bold text-[#eaf2f7]", isPartner ? "text-[17px] leading-[17px]" : "text-[18px] leading-[18px]")}>
                  Barros
                </p>
                <p className="mt-0.5 text-[7px] font-medium uppercase leading-[8px] text-[#7c93a3]">
                  Saude | Nutricao | Performance
                </p>
              </div>
            </div>

            <nav className={navTopClass}>
              {definition.navigation
                .filter((item) => !(isPartner && item.href === "/parceiros/configuracoes"))
                .map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                const content = (
                  <>
                    <item.icon className="size-5 shrink-0" />
                    <span>{item.label}</span>
                  </>
                );

                if (item.implemented) {
                  return (
                    <Link
                      aria-current={isActive ? "page" : undefined}
                      className={
                        isActive
                          ? cn(
                              "flex items-center gap-3 rounded-[8px] font-semibold text-[#cfddea]",
                              isPartner ? "h-10 bg-[#0a2c48] px-3 text-[14px]" : "h-[52px] bg-[#0f6fb5]/45 px-4 text-[15px]",
                            )
                          : cn(
                              "flex items-center gap-3 rounded-[8px] font-semibold text-[#8a99a6] transition-colors hover:bg-[#102a36]/60 hover:text-[#cfddea]",
                              isPartner ? "h-10 px-3 text-[14px]" : "h-[52px] px-4 text-[15px]",
                            )
                      }
                      href={item.href}
                      key={item.href}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <button
                    aria-disabled="true"
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[8px] text-left font-semibold text-[#8a99a6]",
                      isPartner ? "h-10 px-3 text-[14px]" : "h-[52px] px-4 text-[15px]",
                    )}
                    disabled
                    key={item.href}
                    type="button"
                  >
                    {content}
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto space-y-2 pb-5">
              {isPartner ? (
                <Link
                  className="flex h-10 items-center gap-3 rounded-[8px] px-3 text-[14px] font-semibold text-[#8a99a6] transition-colors hover:bg-[#102a36]/60 hover:text-[#cfddea]"
                  href="/parceiros/configuracoes"
                >
                  <Settings className="size-5 shrink-0" />
                  <span>Configurações</span>
                </Link>
              ) : null}
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-[8px] text-left font-semibold text-[#8a99a6] transition-colors hover:bg-[#32151b]/70 hover:text-[#ffb8c2] disabled:cursor-not-allowed disabled:opacity-60",
                  isPartner ? "h-10 px-3 text-[14px]" : "h-[52px] px-4 text-[15px]",
                )}
                disabled={logoutPending}
                type="button"
                onClick={() => startLogoutTransition(() => {
                  void logout();
                })}
              >
                <LogOut className="size-5 shrink-0" />
                <span>{logoutPending ? "Saindo..." : "Sair"}</span>
              </button>
            </div>
          </div>
        </aside>

        <main className={cn("min-h-screen", sidebarWidth)}>{children}</main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Activity className="size-5 text-primary" />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-bold text-sidebar-foreground">
                {definition.title}
              </p>
              <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                {definition.badge}
              </p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegação</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {definition.navigation.map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <SidebarMenuItem key={item.href}>
                      {item.implemented ? (
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.label}
                        >
                          <Link href={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton
                          aria-disabled="true"
                          disabled
                          tooltip={`${item.label} — fase futura`}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />
        <SidebarFooter className="p-4">
          <p className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            {definition.description}
          </p>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-xl md:px-6">
          <SidebarTrigger aria-label="Alternar navegação" />
          <div>
            <p className="text-sm font-semibold text-foreground">{definition.badge}</p>
            <p className="text-xs text-muted-foreground">Área autenticada</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="container max-w-7xl py-6 md:py-8">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export type { ShellProfile };
