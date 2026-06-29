"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  CircleDollarSign,
  Copy,
  Download,
  Eye,
  Filter,
  MoreHorizontal,
  Search,
  Star,
  UserCheck,
  UserRoundCheck,
  UsersRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { ProfessionalsDonutChart } from "./admin-professionals-charts";
import { CreatePartnerDialog } from "./create-partner-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  AdminProfessionalsData,
  ProfessionalBottomMetric,
  ProfessionalKpi,
  ProfessionalRow,
} from "@/lib/admin/professionals-metrics";
import { cn } from "@/lib/utils";

type AdminProfessionalsViewProps = {
  professionals: AdminProfessionalsData;
};

type FilterTab = "all" | "active" | "suspended" | "inactive";

const kpiIcons: Record<ProfessionalKpi["id"], LucideIcon> = {
  active: UserRoundCheck,
  activeSubscriptions: UserCheck,
  averageRevenue: CircleDollarSign,
};

const bottomIcons: Record<ProfessionalBottomMetric["id"], LucideIcon> = {
  churn: ArrowDown,
  newProfessionals: UsersRound,
  nps: Star,
  suspendedProfessionals: ArrowDown,
};

const kpiToneClasses: Record<ProfessionalKpi["tone"], string> = {
  blue: "bg-[#0e8dff]/18 text-[#2d9cff]",
  green: "bg-[#1dbb61]/18 text-[#60d977]",
  purple: "bg-[#9d35ff]/18 text-[#a164ff]",
};

const bottomToneClasses: Record<ProfessionalBottomMetric["tone"], string> = {
  blue: "bg-[#0e8dff]/18 text-[#2d9cff]",
  green: "bg-[#1dbb61]/18 text-[#60d977]",
  purple: "bg-[#9d35ff]/18 text-[#a164ff]",
  red: "bg-[#f03a3a]/18 text-[#ff5c5c]",
};

const statusToneClasses: Record<ProfessionalRow["statusTone"], string> = {
  active: "bg-[#0f6b32] text-[#6ff089]",
  inactive: "bg-[#31424d] text-[#c4d1d9]",
  suspended: "bg-[#5d3513] text-[#ffbf72]",
};

const subscriptionToneClasses: Record<ProfessionalRow["subscriptionTone"], string> = {
  active: "text-[#60d977]",
  inactive: "text-[#9aaeba]",
  suspended: "text-[#ffb03d]",
};

const tabLabels: Record<FilterTab, string> = {
  active: "Ativos",
  all: "Todos",
  inactive: "Inativos",
  suspended: "Suspensos",
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

function IconBubble({ className, icon: Icon }: { className: string; icon: LucideIcon }) {
  return (
    <div className={cn("flex size-[72px] shrink-0 items-center justify-center rounded-full", className)}>
      <Icon className="size-8" />
    </div>
  );
}

function KpiCard({ metric }: { metric: ProfessionalKpi }) {
  const Icon = kpiIcons[metric.id];
  const isBad = metric.trend === "bad";

  return (
    <AdminPanel className="min-h-[178px] p-6">
      <div className="flex items-start gap-5">
        <IconBubble className={kpiToneClasses[metric.tone]} icon={Icon} />
        <div>
          <p className="text-[16px] font-semibold leading-[22px] text-[#dde7ee]">{metric.label}</p>
          {metric.id === "averageRevenue" ? (
            <p className="mt-1 text-[11px] leading-[16px] text-[#8fa2af]">MRR ativo / parceiros ativos</p>
          ) : null}
          <p className="mt-4 text-[36px] font-normal leading-[42px] text-[#f4f7fa]">{metric.value}</p>
          <p className={cn("mt-2 inline-flex items-center gap-1 text-[16px] font-bold", isBad ? "text-[#ff8a00]" : "text-[#35d34b]")}>
            <ArrowUp className="size-4" />
            {metric.delta}
            <span className="ml-2 text-[12px] font-normal text-[#bbc6cd]">vs. mês anterior</span>
          </p>
        </div>
      </div>
    </AdminPanel>
  );
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="relative block h-[57px] min-w-[150px]">
      <span className="pointer-events-none absolute left-0 top-1 text-[12px] font-semibold leading-[18px] text-[#c4ced6]">
        {label}
      </span>
      <select
        className="h-full w-full appearance-none bg-transparent pt-5 text-[15px] leading-[20px] text-[#dde7ee] outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option className="bg-[#071a25] text-[#dde7ee]" key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-[#8fa2af]" />
    </label>
  );
}

function escapeCsv(value: string | number) {
  return `"${String(value).replaceAll("\"", "\"\"")}"`;
}

function downloadProfessionalsCsv(rows: ProfessionalRow[]) {
  const headers = ["Nome", "E-mail", "Tipo profissional", "Plano", "Clientes", "Status", "Assinatura", "Receita mensal"];
  const csvRows = rows.map((row) => [
    row.name,
    row.email,
    row.specialtyLabel,
    row.planLabel,
    row.clientsCount,
    row.statusLabel,
    row.subscriptionLabel,
    (row.revenueBaseCents / 100).toFixed(2),
  ]);
  const csv = [headers, ...csvRows].map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "parceiros-profissionais.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function ProfessionalsTable({
  onActionMessage,
  onFilterByPlan,
  onFilterByStatus,
  onViewProfile,
  rows,
}: {
  onActionMessage: (message: string) => void;
  onFilterByPlan: (plan: string) => void;
  onFilterByStatus: (status: FilterTab) => void;
  onViewProfile: (professional: ProfessionalRow) => void;
  rows: ProfessionalRow[];
}) {
  async function copyEmail(professional: ProfessionalRow) {
    try {
      await navigator.clipboard.writeText(professional.email);
      onActionMessage(`E-mail de ${professional.name} copiado.`);
    } catch {
      onActionMessage(`E-mail: ${professional.email}`);
    }
  }

  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[1080px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[#2a4657]/65 text-[12px] font-semibold leading-[16px] text-[#a5b2bc]">
            <th className="pb-4">Profissional</th>
            <th className="pb-4">Tipo profissional</th>
            <th className="pb-4">Plano</th>
            <th className="pb-4">Clientes</th>
            <th className="pb-4">Status</th>
            <th className="pb-4">Assinatura</th>
            <th className="pb-4">Último acesso</th>
            <th className="pb-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2a4657]/55">
          {rows.length === 0 ? (
            <tr>
              <td className="py-8 text-[14px] text-[#91a5b3]" colSpan={8}>
                Nenhum profissional encontrado.
              </td>
            </tr>
          ) : (
            rows.map((professional) => (
              <tr key={professional.id}>
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-[38px] items-center justify-center rounded-full bg-[#d4844c] text-[13px] font-bold text-white">
                      {professional.initial}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-[#dde7ee]">{professional.name}</span>
                      <span className="block max-w-[170px] truncate text-[11px] text-[#879aa8]">{professional.email}</span>
                    </span>
                  </div>
                </td>
                <td className="py-4 pr-4 text-[12px] text-[#b4c3cc]">{professional.specialtyLabel}</td>
                <td className="py-4 pr-4 text-[12px] text-[#b4c3cc]">{professional.planLabel}</td>
                <td className="py-4 pr-4 text-[12px] text-[#b4c3cc]">{professional.clientsCount}</td>
                <td className="py-4 pr-4">
                  <span className={cn("inline-flex min-w-[78px] justify-center rounded-[4px] px-3 py-1.5 text-[11px] font-bold", statusToneClasses[professional.statusTone])}>
                    {professional.statusLabel}
                  </span>
                </td>
                <td className="py-4 pr-4">
                  <span className={cn("text-[12px] font-semibold", subscriptionToneClasses[professional.subscriptionTone])}>
                    {professional.subscriptionLabel}
                  </span>
                </td>
                <td className="py-4 pr-4 text-[12px] text-[#b4c3cc]">{professional.lastAccessLabel}</td>
                <td className="py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="inline-flex h-8 items-center gap-1 rounded-[4px] border border-[#0f6fb5] px-2.5 text-[11px] font-semibold text-[#1f9bff]"
                      type="button"
                      onClick={() => onViewProfile(professional)}
                    >
                      <Eye className="size-3" />
                      Ver perfil
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          aria-label={`Mais ações para ${professional.name}`}
                          className="flex size-8 items-center justify-center rounded-[4px] border border-[#2b4a5d] text-[#a9bac6]"
                          type="button"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-[#2b4a5d] bg-[#071a25] text-[#dfeaf1]">
                        <DropdownMenuLabel>{professional.name}</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-[#2b4a5d]" />
                        <DropdownMenuItem onClick={() => onViewProfile(professional)}>
                          <Eye className="mr-2 size-4" />
                          Ver perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void copyEmail(professional)}>
                          <Copy className="mr-2 size-4" />
                          Copiar e-mail
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onFilterByPlan(professional.planLabel)}>
                          Filtrar por plano
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onFilterByStatus(professional.statusTone)}>
                          Filtrar por status
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function BottomMetricCard({ metric }: { metric: ProfessionalBottomMetric }) {
  const Icon = bottomIcons[metric.id];
  const isBad = metric.trend === "bad";

  return (
    <AdminPanel className="min-h-[150px] p-5">
      <p className="text-[13px] font-semibold leading-[18px] text-[#c9d4dc]">{metric.label}</p>
      <div className="mt-4 flex items-center gap-3">
        <div className={cn("flex size-[52px] items-center justify-center rounded-full", bottomToneClasses[metric.tone])}>
          <Icon className="size-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[28px] leading-[34px] text-[#f4f7fa]">{metric.value}</p>
          <p className={cn("text-[12px] font-bold", isBad ? "text-[#ff3434]" : "text-[#34d849]")}>{metric.delta}</p>
          {metric.note ? <p className="text-[11px] text-[#b4c3cc]">{metric.note}</p> : <p className="text-[11px] text-[#b4c3cc]">vs. mês anterior</p>}
        </div>
      </div>
    </AdminPanel>
  );
}

function RecentSubscriptions({ data, onShowAll }: { data: AdminProfessionalsData; onShowAll: () => void }) {
  return (
    <AdminPanel className="p-5">
      <div className="flex items-center gap-3">
        <h2 className="text-[18px] font-bold text-[#dde7ee]">Assinaturas recentes</h2>
        <span className="rounded-full bg-[#243b4a] px-2.5 py-1 text-[12px] font-bold text-[#ccd6dc]">
          {data.recentSubscriptions.length}
        </span>
        <button className="ml-auto text-[13px] font-semibold text-[#1f9bff]" type="button" onClick={onShowAll}>Ver todos</button>
      </div>
      <div className="mt-6 space-y-5">
        {data.recentSubscriptions.length === 0 ? (
          <p className="text-[13px] text-[#91a5b3]">Nenhuma assinatura recente.</p>
        ) : (
          data.recentSubscriptions.map((item) => (
            <div className="grid grid-cols-[42px_minmax(0,1fr)_90px] items-start gap-3" key={item.id}>
              <span className="flex size-[42px] items-center justify-center rounded-full bg-[#c97356] text-[14px] font-bold text-white">
                {item.initial}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[#dde7ee]">{item.name}</p>
                <p className="truncate text-[10px] text-[#879aa8]">{item.email}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#b4c3cc]">{item.plan}</p>
                <p className="text-[10px] text-[#879aa8]">{item.date}</p>
              </div>
              <p className={cn("col-span-3 ml-[54px] text-[11px] font-bold", subscriptionToneClasses[item.statusTone])}>
                {item.status}
              </p>
            </div>
          ))
        )}
      </div>
    </AdminPanel>
  );
}

function ProfileDialog({
  onOpenChange,
  professional,
}: {
  onOpenChange: (open: boolean) => void;
  professional: ProfessionalRow | null;
}) {
  return (
    <Dialog open={Boolean(professional)} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#2b4a5d] bg-[#0d2635] text-[#f4f7fa] sm:max-w-[680px]">
        {professional ? (
          <>
            <DialogHeader>
              <DialogTitle>{professional.name}</DialogTitle>
              <DialogDescription className="text-[#9eb0bd]">
                Perfil operacional do parceiro na plataforma.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              {[
                ["E-mail", professional.email],
                ["Tipo profissional", professional.specialtyLabel],
                ["Plano", professional.planLabel],
                ["Clientes vinculados", professional.clientsCount.toLocaleString("pt-BR")],
                ["Status", professional.statusLabel],
                ["Assinatura", professional.subscriptionLabel],
                ["Status cadastral", professional.profileStatusLabel],
                ["Assinatura criada em", professional.subscriptionDateLabel],
                ["Receita mensal considerada", (professional.revenueBaseCents / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" })],
                ["Último acesso", professional.lastAccessLabel],
              ].map(([label, value]) => (
                <div className="rounded-[6px] border border-[#2b4a5d] bg-[#071a25]/70 p-3" key={label}>
                  <p className="text-[11px] font-semibold uppercase text-[#879aa8]">{label}</p>
                  <p className="mt-1 text-[#e4eef5]">{value}</p>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function AdminProfessionalsView({ professionals }: AdminProfessionalsViewProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<FilterTab>("all");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [selectedProfessional, setSelectedProfessional] = useState<ProfessionalRow | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const specialtyOptions = useMemo(() => {
    const labels = Array.from(new Set(professionals.professionals.map((item) => item.specialtyLabel))).sort();
    return [{ label: "Todas", value: "all" }, ...labels.map((label) => ({ label, value: label }))];
  }, [professionals.professionals]);

  const planOptions = useMemo(() => {
    const labels = Array.from(new Set(professionals.professionals.map((item) => item.planLabel))).sort();
    return [{ label: "Todos", value: "all" }, ...labels.map((label) => ({ label, value: label }))];
  }, [professionals.professionals]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return professionals.professionals.filter((professional) => {
      if (activeTab !== "all" && professional.statusTone !== activeTab) return false;
      if (statusFilter !== "all" && professional.statusTone !== statusFilter) return false;
      if (specialtyFilter !== "all" && professional.specialtyLabel !== specialtyFilter) return false;
      if (planFilter !== "all" && professional.planLabel !== planFilter) return false;
      if (!term) return true;

      const searchable = [
        professional.name,
        professional.email,
        professional.specialtyLabel,
        professional.planLabel,
        professional.statusLabel,
        professional.subscriptionLabel,
      ].join(" ").toLowerCase();

      return searchable.includes(term);
    });
  }, [activeTab, planFilter, professionals.professionals, search, specialtyFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const firstIndex = filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastIndex = Math.min(currentPage * pageSize, filteredRows.length);
  const visibleRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function updateTab(tab: FilterTab) {
    setActiveTab(tab);
    setPage(1);
  }

  function resetFilters() {
    setActiveTab("all");
    setSearch("");
    setSpecialtyFilter("all");
    setPlanFilter("all");
    setStatusFilter("all");
    setPage(1);
  }

  function showAllRows() {
    resetFilters();
    setPageSize(20);
  }

  function filterByPlan(plan: string) {
    setActiveTab("all");
    setPlanFilter(plan);
    setPage(1);
    setActionMessage(`Filtro aplicado: ${plan}.`);
  }

  function filterByStatus(status: FilterTab) {
    setActiveTab(status);
    setStatusFilter("all");
    setPage(1);
    setActionMessage(`Filtro aplicado: ${tabLabels[status]}.`);
  }

  const tabs: Array<{ id: FilterTab; label: string; count?: number }> = [
    { count: professionals.tabCounts.all, id: "all", label: "Todos" },
    { count: professionals.tabCounts.active, id: "active", label: "Ativos" },
    { count: professionals.tabCounts.suspended, id: "suspended", label: "Suspensos" },
    { count: professionals.tabCounts.inactive, id: "inactive", label: "Inativos" },
  ];

  return (
    <div className="min-h-screen bg-[#0b1720] px-5 py-6 font-['Rethink_Sans',sans-serif] text-[#f1f6fa] md:px-8 lg:px-[43px] lg:py-[35px]">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-[34px] font-bold leading-[40px] text-[#f4f7fa] md:text-[38px]">Parceiros & Profissionais</h1>
          <p className="mt-2 text-[17px] leading-[24px] text-[#b4c3cc]">Gerencie toda a rede de profissionais da plataforma.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="inline-flex h-[52px] items-center gap-3 rounded-[8px] border border-[#2b4656] bg-[#071a25]/80 px-5 text-[15px] font-semibold text-[#e4eef5]"
            type="button"
            onClick={() => downloadProfessionalsCsv(filteredRows)}
          >
            <Download className="size-4" />
            Exportar
          </button>
          <CreatePartnerDialog />
        </div>
      </header>

      <section className="mt-8 grid gap-5 xl:grid-cols-3">
        {professionals.kpis.map((metric) => <KpiCard key={metric.id} metric={metric} />)}
      </section>

      <AdminPanel className="mt-6 overflow-hidden p-5">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-3 border-b border-[#2a4657]/65 pb-4">
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
                onClick={() => updateTab(tab.id)}
              >
                {tab.label}
                {tab.count !== undefined ? (
                  <span className="rounded-full bg-[#243b4a] px-2 py-1 text-[11px] font-bold text-[#ccd6dc]">{tab.count}</span>
                ) : null}
                {isActive ? <span className="absolute -bottom-[17px] left-0 h-[3px] w-full rounded-full bg-[#1f9bff]" /> : null}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[325px_160px_150px_150px_195px]">
          <label className="flex h-[57px] items-center gap-3 rounded-[6px] border border-[#2b4656] bg-[#071a25]/70 px-4">
            <input
              className="min-w-0 flex-1 bg-transparent text-[14px] text-[#dde7ee] outline-none placeholder:text-[#a6b5bf]"
              placeholder="Buscar por nome ou e-mail"
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            <Search className="size-5 text-[#a6b5bf]" />
          </label>
          <FilterSelect
            label="Especialidade"
            options={specialtyOptions}
            value={specialtyFilter}
            onChange={(value) => {
              setSpecialtyFilter(value);
              setPage(1);
            }}
          />
          <FilterSelect
            label="Plano"
            options={planOptions}
            value={planFilter}
            onChange={(value) => {
              setPlanFilter(value);
              setPage(1);
            }}
          />
          <FilterSelect
            label="Status"
            options={[
              { label: "Todos", value: "all" },
              { label: "Ativo", value: "active" },
              { label: "Suspenso", value: "suspended" },
              { label: "Inativo", value: "inactive" },
            ]}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value as FilterTab);
              setPage(1);
            }}
          />
          <button
            aria-expanded={advancedOpen}
            className="flex h-[57px] items-center justify-between rounded-[6px] border border-[#2b4656] bg-[#071a25]/70 px-4 text-[14px] text-[#dde7ee]"
            type="button"
            onClick={() => setAdvancedOpen((open) => !open)}
          >
            Filtros avançados
            <Filter className="size-5 text-[#a6b5bf]" />
          </button>
        </div>

        {advancedOpen ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[8px] border border-[#2b4a5d] bg-[#071a25]/55 p-4 text-[13px] text-[#c5d2da]">
            <span>{filteredRows.length.toLocaleString("pt-BR")} profissionais no recorte atual.</span>
            <button className="ml-auto inline-flex items-center gap-2 rounded-[6px] border border-[#2b4a5d] px-3 py-2 text-[#dce8ef]" type="button" onClick={resetFilters}>
              <X className="size-4" />
              Limpar filtros
            </button>
          </div>
        ) : null}

        {actionMessage ? (
          <div className="mt-4 rounded-[6px] border border-[#226a9e] bg-[#092538] px-4 py-3 text-[13px] text-[#bfe3ff]" role="status">
            {actionMessage}
          </div>
        ) : null}

        <ProfessionalsTable
          rows={visibleRows}
          onActionMessage={setActionMessage}
          onFilterByPlan={filterByPlan}
          onFilterByStatus={filterByStatus}
          onViewProfile={setSelectedProfessional}
        />

        <div className="mt-5 flex flex-col gap-3 border-t border-[#2a4657]/65 pt-4 text-[12px] text-[#b4c3cc] md:flex-row md:items-center md:justify-between">
          <span>
            Mostrando {firstIndex} a {lastIndex} de {filteredRows.length} profissionais
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1).map((pageNumber) => (
              <button
                aria-current={pageNumber === currentPage ? "page" : undefined}
                className={cn(
                  "flex size-8 items-center justify-center rounded-[4px] border border-[#2b4a5d]",
                  pageNumber === currentPage ? "bg-[#1f9bff] text-white" : "text-[#c4ced6]",
                )}
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <select
              aria-label="Quantidade por página"
              className="h-8 rounded-[4px] border border-[#2b4a5d] bg-transparent px-3 text-[#c4ced6] outline-none"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              <option className="bg-[#071a25]" value={8}>8 por página</option>
              <option className="bg-[#071a25]" value={20}>20 por página</option>
            </select>
          </div>
        </div>
      </AdminPanel>

      <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {professionals.bottomMetrics.map((metric) => <BottomMetricCard key={metric.id} metric={metric} />)}
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1fr_1fr_1fr]">
        <RecentSubscriptions data={professionals} onShowAll={showAllRows} />
        <AdminPanel className="p-5">
          <h2 className="text-[18px] font-bold text-[#dde7ee]">Distribuição por tipo profissional</h2>
          <ProfessionalsDonutChart
            data={professionals.specialtyDistribution}
            testId="specialty-chart"
            totalLabel="profissionais"
          />
          <button className="mt-2 text-[14px] text-[#1f9bff]" type="button" onClick={() => setAdvancedOpen(true)}>Ver relatório completo</button>
        </AdminPanel>
        <AdminPanel className="p-5">
          <h2 className="text-[18px] font-bold text-[#dde7ee]">Profissionais por status</h2>
          <ProfessionalsDonutChart
            data={professionals.statusDistribution}
            testId="status-chart"
            totalLabel="profissionais"
          />
          <button className="mt-2 text-[14px] text-[#1f9bff]" type="button" onClick={() => updateTab("all")}>Ver todos os status</button>
        </AdminPanel>
      </section>

      <footer className="mt-7 flex flex-col gap-2 border-t border-[#244454]/70 pt-5 text-[12px] text-[#718795] md:flex-row md:items-center md:justify-between">
        <span>© 2026 PLATAFORMA LEONARDO BARROS.</span>
        <span>Todos os direitos reservados.</span>
      </footer>

      <ProfileDialog
        professional={selectedProfessional}
        onOpenChange={(open) => {
          if (!open) setSelectedProfessional(null);
        }}
      />
    </div>
  );
}
