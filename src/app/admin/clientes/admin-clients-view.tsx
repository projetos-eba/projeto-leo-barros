"use client";

import {
  ArrowDown,
  ArrowUp,
  Copy,
  Download,
  Eye,
  Link2Off,
  Search,
  UserCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { InfoHint } from "@/components/ui/info-hint";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AdminClientsData, ClientKpi, ClientRow } from "@/lib/admin/clients-metrics";
import { cn } from "@/lib/utils";

type AdminClientsViewProps = {
  clients: AdminClientsData;
};

type FilterTab = "all" | ClientRow["status"];

const tabLabels: Record<FilterTab, string> = {
  active: "Ativos",
  all: "Todos",
  inactive: "Inativos",
  unassigned: "Sem vínculo",
};

const kpiIcons: Record<ClientKpi["id"], LucideIcon> = {
  activeClients: UserCheck,
  endedLinks: Link2Off,
  newClients: UserPlus,
  withoutActiveLink: UsersRound,
};

const kpiToneClasses: Record<ClientKpi["tone"], string> = {
  amber: "bg-[#f0a52b]/18 text-[#f0a52b]",
  blue: "bg-[#0e8dff]/18 text-[#2d9cff]",
  green: "bg-[#1dbb61]/18 text-[#60d977]",
  slate: "bg-[#506777]/32 text-[#c3d2dc]",
};

const statusToneClasses: Record<ClientRow["statusTone"], string> = {
  active: "bg-[#0f6b32] text-[#6ff089]",
  inactive: "bg-[#31424d] text-[#c4d1d9]",
  warning: "bg-[#5d3513] text-[#ffbf72]",
};

function AdminPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "rounded-[9px] border border-[#2b4a5d]/90 bg-[#0d2635]/80 shadow-[0_18px_60px_rgba(2,10,16,0.24)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function escapeCsv(value: string | number) {
  return `"${String(value).replaceAll("\"", "\"\"")}"`;
}

function downloadClientsCsv(rows: ClientRow[]) {
  const headers = ["Cliente", "E-mail", "Profissional", "Escopo", "Status", "Vínculos ativos", "Início", "Última atualização"];
  const csvRows = rows.map((row) => [
    row.name,
    row.email,
    row.primaryPartnerLabel,
    row.scopeLabel,
    row.statusLabel,
    row.activeLinksCount,
    row.startedAtLabel,
    row.lastUpdateLabel,
  ]);
  const csv = [headers, ...csvRows].map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "clientes-admin.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function KpiCard({ metric }: { metric: ClientKpi }) {
  const Icon = kpiIcons[metric.id];
  const isBad = metric.trend === "bad";

  return (
    <AdminPanel className="min-h-[178px] p-5">
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start gap-4">
          <div className={cn("flex size-[58px] shrink-0 items-center justify-center rounded-full", kpiToneClasses[metric.tone])}>
            <Icon className="size-7" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[16px] font-semibold leading-[21px] text-[#dde7ee]">{metric.label}</p>
              <InfoHint label={metric.description} />
            </div>
            <p className="mt-2 text-[12px] leading-[16px] text-[#8fa2af]">{metric.description}</p>
          </div>
        </div>
        <div>
          <p className="mt-5 text-[40px] font-normal leading-[44px] text-[#f4f7fa]">{metric.value}</p>
          <p className={cn("mt-3 inline-flex items-center gap-1 text-[16px] font-bold", isBad ? "text-[#ff6b5c]" : "text-[#35d34b]")}>
            {isBad ? <ArrowDown className="size-4" /> : <ArrowUp className="size-4" />}
            {metric.delta}
            <span className="ml-2 text-[12px] font-normal text-[#bbc6cd]">vs. mês anterior</span>
          </p>
        </div>
      </div>
    </AdminPanel>
  );
}

function ClientDrawer({
  client,
  onOpenChange,
}: {
  client: ClientRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={Boolean(client)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-l border-[#244454] bg-[#082235] p-0 text-[#e8edf2] sm:max-w-[470px]" side="right">
        {client ? (
          <>
            <SheetHeader className="border-b border-[#19394c] px-6 py-5 text-left">
              <SheetTitle className="text-[22px] font-bold text-[#e8edf2]">Cliente selecionado</SheetTitle>
              <SheetDescription className="text-[13px] text-[#8ca1af]">
                Dados operacionais, vínculos e histórico resumido.
              </SheetDescription>
            </SheetHeader>

            <div className="grid gap-6 px-6 py-5">
              <section className="flex items-center gap-4">
                <span className="flex size-[56px] shrink-0 items-center justify-center rounded-full bg-[#d4844c] text-[20px] font-bold text-white">
                  {client.initial}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-[20px] font-bold text-[#f4f7fa]">{client.name}</h3>
                  <p className="truncate text-[13px] text-[#9eb0bd]">{client.email}</p>
                  <p className="mt-1 text-[12px] text-[#8fa2af]">{client.phoneLabel}</p>
                </div>
              </section>

              <section className="grid grid-cols-2 gap-3">
                {[
                  ["Status", client.statusLabel],
                  ["Profissional", client.primaryPartnerLabel],
                  ["Escopo", client.scopeLabel],
                  ["Vínculos ativos", client.activeLinksCount.toLocaleString("pt-BR")],
                  ["Início", client.startedAtLabel],
                  ["Atualização", client.lastUpdateLabel],
                ].map(([label, value]) => (
                  <div className="rounded-[6px] border border-[#2b4a5d] bg-[#071a25]/70 p-3" key={label}>
                    <p className="text-[11px] font-semibold uppercase text-[#879aa8]">{label}</p>
                    <p className="mt-1 text-[13px] font-semibold text-[#e4eef5]">{value}</p>
                  </div>
                ))}
              </section>

              <section>
                <h4 className="text-[15px] font-bold text-[#e8edf2]">Vínculos</h4>
                <div className="mt-3 grid gap-3">
                  {client.links.length === 0 ? (
                    <p className="rounded-[6px] border border-[#2b4a5d] bg-[#071a25]/70 p-4 text-[13px] text-[#91a5b3]">
                      Nenhum vínculo registrado para este cliente.
                    </p>
                  ) : (
                    client.links.map((link) => (
                      <div className="rounded-[6px] border border-[#2b4a5d] bg-[#071a25]/70 p-4" key={link.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-bold text-[#e4eef5]">{link.partnerName}</p>
                            <p className="mt-1 text-[12px] text-[#8fa2af]">{link.scopeLabel}</p>
                          </div>
                          <span className="rounded-[4px] bg-[#243b4a] px-2 py-1 text-[11px] font-bold text-[#cbd7df]">
                            {link.statusLabel}
                          </span>
                        </div>
                        <p className="mt-3 text-[11px] text-[#91a5b3]">
                          Início {link.startedAtLabel}
                          {link.endedAtLabel !== "Sem registro" ? ` · Fim ${link.endedAtLabel}` : ""}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export function AdminClientsView({ clients }: AdminClientsViewProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [professionalFilter, setProfessionalFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const professionalOptions = useMemo(() => {
    const labels = Array.from(new Set(clients.clients.map((client) => client.primaryPartnerLabel))).sort();
    return ["all", ...labels];
  }, [clients.clients]);

  const scopeOptions = useMemo(() => {
    const labels = Array.from(new Set(clients.clients.map((client) => client.scopeLabel))).sort();
    return ["all", ...labels];
  }, [clients.clients]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return clients.clients.filter((client) => {
      if (activeTab !== "all" && client.status !== activeTab) return false;
      if (professionalFilter !== "all" && client.primaryPartnerLabel !== professionalFilter) return false;
      if (scopeFilter !== "all" && client.scopeLabel !== scopeFilter) return false;
      if (!term) return true;

      return [
        client.name,
        client.email,
        client.primaryPartnerLabel,
        client.scopeLabel,
        client.statusLabel,
      ].join(" ").toLowerCase().includes(term);
    });
  }, [activeTab, clients.clients, professionalFilter, scopeFilter, search]);

  const tabs: Array<{ count: number; id: FilterTab; label: string }> = [
    { count: clients.tabCounts.all, id: "all", label: tabLabels.all },
    { count: clients.tabCounts.active, id: "active", label: tabLabels.active },
    { count: clients.tabCounts.unassigned, id: "unassigned", label: tabLabels.unassigned },
    { count: clients.tabCounts.inactive, id: "inactive", label: tabLabels.inactive },
  ];

  async function copyEmail(client: ClientRow) {
    try {
      await navigator.clipboard.writeText(client.email);
      setActionMessage(`E-mail de ${client.name} copiado.`);
    } catch {
      setActionMessage(`E-mail: ${client.email}`);
    }
  }

  function resetFilters() {
    setActiveTab("all");
    setSearch("");
    setProfessionalFilter("all");
    setScopeFilter("all");
  }

  return (
    <div className="min-h-screen bg-[#0b1720] px-5 py-6 font-['Rethink_Sans',sans-serif] text-[#f1f6fa] md:px-8 lg:px-[43px] lg:py-[35px]">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-[34px] font-bold leading-[40px] text-[#f4f7fa] md:text-[38px]">Clientes</h1>
          <p className="mt-2 max-w-3xl text-[17px] leading-[24px] text-[#b4c3cc]">
            Acompanhe clientes vinculados aos profissionais com uma visão operacional simples.
          </p>
        </div>
        <button
          className="inline-flex h-[52px] items-center justify-center gap-3 rounded-[8px] border border-[#2b4656] bg-[#071a25]/80 px-5 text-[15px] font-semibold text-[#e4eef5]"
          type="button"
          onClick={() => downloadClientsCsv(filteredRows)}
        >
          <Download className="size-4" />
          Exportar
        </button>
      </header>

      <section className="mt-8 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
        {clients.kpis.map((metric) => <KpiCard key={metric.id} metric={metric} />)}
      </section>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <AdminPanel className="overflow-hidden p-5">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-[#2a4657]/65 pb-4">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  aria-pressed={isActive}
                  className={cn(
                    "relative inline-flex items-center gap-2 text-[14px] font-semibold",
                    isActive ? "text-[#1f9bff]" : "text-[#bec9d1]",
                  )}
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                  <span className="rounded-full bg-[#243b4a] px-2 py-1 text-[11px] font-bold text-[#ccd6dc]">{tab.count}</span>
                  {isActive ? <span className="absolute -bottom-[17px] left-0 h-[3px] w-full rounded-full bg-[#1f9bff]" /> : null}
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(220px,1fr)_210px_150px_110px]">
            <label className="flex h-[48px] items-center gap-3 rounded-[6px] border border-[#2b4656] bg-[#071a25]/70 px-4">
              <input
                className="min-w-0 flex-1 bg-transparent text-[14px] text-[#dde7ee] outline-none placeholder:text-[#a6b5bf]"
                placeholder="Buscar por nome, e-mail ou profissional"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Search className="size-5 text-[#a6b5bf]" />
            </label>

            <select
              aria-label="Filtrar por profissional"
              className="h-[48px] rounded-[6px] border border-[#2b4656] bg-[#071a25]/70 px-3 text-[13px] font-semibold text-[#dde7ee] outline-none"
              value={professionalFilter}
              onChange={(event) => setProfessionalFilter(event.target.value)}
            >
              {professionalOptions.map((option) => (
                <option className="bg-[#071a25] text-[#dde7ee]" key={option} value={option}>
                  {option === "all" ? "Todos profissionais" : option}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtrar por escopo"
              className="h-[48px] rounded-[6px] border border-[#2b4656] bg-[#071a25]/70 px-3 text-[13px] font-semibold text-[#dde7ee] outline-none"
              value={scopeFilter}
              onChange={(event) => setScopeFilter(event.target.value)}
            >
              {scopeOptions.map((option) => (
                <option className="bg-[#071a25] text-[#dde7ee]" key={option} value={option}>
                  {option === "all" ? "Todos escopos" : option}
                </option>
              ))}
            </select>

            <button
              className="h-[48px] rounded-[6px] border border-[#2b4656] text-[13px] font-semibold text-[#b9c8d2]"
              type="button"
              onClick={resetFilters}
            >
              Limpar
            </button>
          </div>

          {actionMessage ? (
            <div className="mt-4 flex items-center justify-between rounded-[6px] border border-[#1f9bff]/45 bg-[#0a2b42] px-4 py-3 text-[13px] text-[#cfe7ff]">
              <span>{actionMessage}</span>
              <button className="text-[#8fc8ff]" type="button" onClick={() => setActionMessage(null)}>Fechar</button>
            </div>
          ) : null}

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[940px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#2a4657]/65 text-[12px] font-semibold leading-[16px] text-[#a5b2bc]">
                  <th className="pb-4">Cliente</th>
                  <th className="pb-4">Profissional</th>
                  <th className="pb-4">Escopo</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Início</th>
                  <th className="pb-4">Atualização</th>
                  <th className="pb-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a4657]/55">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td className="py-8 text-[14px] text-[#91a5b3]" colSpan={7}>
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((client) => (
                    <tr key={client.id}>
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <span className="flex size-[38px] items-center justify-center rounded-full bg-[#d4844c] text-[13px] font-bold text-white">
                            {client.initial}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[13px] font-semibold text-[#dde7ee]">{client.name}</span>
                            <span className="block max-w-[190px] truncate text-[11px] text-[#879aa8]">{client.email}</span>
                          </span>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-[12px] text-[#b4c3cc]">{client.primaryPartnerLabel}</td>
                      <td className="py-4 pr-4 text-[12px] text-[#b4c3cc]">{client.scopeLabel}</td>
                      <td className="py-4 pr-4">
                        <span className={cn("inline-flex min-w-[112px] justify-center rounded-[4px] px-3 py-1.5 text-[11px] font-bold", statusToneClasses[client.statusTone])}>
                          {client.statusLabel}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-[12px] text-[#b4c3cc]">{client.startedAtLabel}</td>
                      <td className="py-4 pr-4 text-[12px] text-[#b4c3cc]">{client.lastUpdateLabel}</td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            className="inline-flex h-8 items-center gap-1 rounded-[4px] border border-[#0f6fb5] px-2.5 text-[11px] font-semibold text-[#1f9bff]"
                            type="button"
                            onClick={() => setSelectedClient(client)}
                          >
                            <Eye className="size-3" />
                            Ver detalhes
                          </button>
                          <button
                            aria-label={`Copiar e-mail de ${client.name}`}
                            className="flex size-8 items-center justify-center rounded-[4px] border border-[#2b4a5d] text-[#a9bac6]"
                            type="button"
                            onClick={() => void copyEmail(client)}
                          >
                            <Copy className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[12px] text-[#91a5b3]">
            <span>Mostrando {filteredRows.length.toLocaleString("pt-BR")} de {clients.clients.length.toLocaleString("pt-BR")} clientes</span>
            <span>Atualizado pelo banco local</span>
          </div>
        </AdminPanel>

        <aside className="grid gap-6">
          <AdminPanel className="p-5">
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-bold text-[#dde7ee]">Clientes por status</h2>
              <InfoHint label="Distribuição dos clientes entre ativos, sem vínculo ativo e inativos." side="left" />
            </div>
            <div className="mt-5 grid gap-4">
              {clients.statusDistribution.map((slice) => (
                <div key={slice.id}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-[13px]">
                    <span className="font-semibold text-[#c9d4dc]">{slice.label}</span>
                    <span className="text-[#8fa2af]">{slice.count} · {slice.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#071a25]">
                    <div className="h-full rounded-full" style={{ backgroundColor: slice.color, width: `${slice.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel className="p-5">
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-bold text-[#dde7ee]">Top profissionais</h2>
              <InfoHint label="Profissionais ativos com mais clientes ativos vinculados." side="left" />
            </div>
            <div className="mt-5 grid gap-4">
              {clients.topProfessionals.length === 0 ? (
                <p className="text-[13px] text-[#91a5b3]">Nenhum profissional com cliente ativo.</p>
              ) : (
                clients.topProfessionals.map((professional, index) => (
                  <div className="flex items-center gap-3" key={professional.id}>
                    <span className="flex size-8 items-center justify-center rounded-full bg-[#0e8dff]/18 text-[12px] font-bold text-[#2d9cff]">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-[#dde7ee]">{professional.name}</p>
                      <p className="text-[11px] text-[#879aa8]">{professional.specialtyLabel}</p>
                    </div>
                    <span className="text-[13px] font-bold text-[#e4eef5]">{professional.clientsCount}</span>
                  </div>
                ))
              )}
            </div>
          </AdminPanel>
        </aside>
      </div>

      <ClientDrawer client={selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)} />
    </div>
  );
}
