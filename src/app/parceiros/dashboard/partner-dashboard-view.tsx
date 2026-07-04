import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Plus,
  TriangleAlert,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  AdherenceRings,
  NewPatientsBarChart,
} from "./partner-dashboard-charts";
import { PartnerPerformancePanel } from "./partner-performance-panel";
import { InfoHint } from "@/components/ui/info-hint";
import type {
  PartnerAgendaItem,
  PartnerDashboardData,
  PartnerObjectiveDistributionItem,
  PartnerPendingUpdateRow,
  PartnerRenewalRow,
  PartnerSummaryMetric,
} from "@/lib/partners/dashboard-metrics";
import { cn } from "@/lib/utils";

type PartnerDashboardViewProps = {
  dashboard: PartnerDashboardData;
};

const metricIcons: Record<PartnerSummaryMetric["id"], LucideIcon> = {
  activeClients: UsersRound,
  clinicalAlerts: TriangleAlert,
  forecastMrr: CircleDollarSign,
  inactiveClients: UsersRound,
  pendingUpdates: CalendarDays,
  renewalsNext30: UsersRound,
};

const metricToneClasses: Record<PartnerSummaryMetric["tone"], string> = {
  amber: "border-[#5c5641]/70 bg-[linear-gradient(135deg,rgba(79,63,42,0.62),rgba(181,155,96,0)_92%)] text-[#d8c37f]",
  blue: "border-[#1d7ece] bg-[linear-gradient(135deg,rgba(29,126,206,0.68),rgba(25,42,55,0)_92%)] text-[#68afe9]",
  green: "border-[#356e3d]/70 bg-[linear-gradient(135deg,rgba(42,79,54,0.52),rgba(96,181,113,0)_92%)] text-[#58a067]",
  red: "border-[#8c3f45]/80 bg-[linear-gradient(135deg,rgba(83,35,42,0.72),rgba(18,7,11,0.82)_92%)] text-[#d65e64]",
  slate: "border-[#41505c]/70 bg-[linear-gradient(135deg,rgba(42,63,79,0.46),rgba(96,144,181,0)_92%)] text-[#8ca1af]",
};

const agendaToneClasses: Record<PartnerAgendaItem["tone"], string> = {
  amber: "bg-[#d0a246]",
  blue: "bg-[#2d9cff]",
  green: "bg-[#58a067]",
  red: "bg-[#d35b5b]",
};

function getMetric(dashboard: PartnerDashboardData, id: PartnerSummaryMetric["id"]) {
  return dashboard.summaryMetrics.find((metric) => metric.id === id);
}

function PartnerPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-[14px] border border-[#41505c]/70 bg-[linear-gradient(135deg,rgba(42,63,79,0.35),rgba(96,144,181,0)_92%)] shadow-[0_2px_4px_rgba(0,0,0,0.07)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function SmallIcon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#0a2c48] text-[#68afe9] sm:size-[40px] sm:rounded-[12px]", className)}>
      {children}
    </span>
  );
}

function PrimaryMetricCard({ metric }: { metric: PartnerSummaryMetric }) {
  const Icon = metricIcons[metric.id];
  const positive = metric.trend !== "bad";

  if (metric.id === "clinicalAlerts") {
    return <ClinicalAlertCard metric={metric} />;
  }

  return (
    <PartnerPanel className={cn("min-h-[118px] p-3 sm:min-h-[170px] sm:p-5", metricToneClasses[metric.tone])}>
      <div className="flex items-center gap-2 sm:gap-3">
        <SmallIcon className={metric.tone === "blue" ? "bg-[#061235] text-[#2d9cff]" : metric.tone === "red" ? "bg-[#210d0f] text-[#d35b5b]" : metric.tone === "green" ? "bg-[#0b2118] text-[#58a067]" : "bg-[#2f2414] text-[#d8c37f]"}>
          <Icon className="size-4 sm:size-[18px]" />
        </SmallIcon>
        <p className="text-[12px] font-medium leading-4 text-white sm:text-[15px] sm:leading-5">{metric.label}</p>
      </div>
      <p className="mt-4 text-[25px] font-bold leading-8 text-white sm:mt-7 sm:text-[32px] sm:leading-10">{metric.value}</p>
      <div className="mt-3 flex items-center gap-1.5 text-[11px] leading-4 sm:mt-6 sm:gap-2 sm:text-[13px] sm:leading-5">
        {metric.delta ? (
          <>
            <ArrowUpRight className={cn("size-3", positive ? "text-[#58a067]" : "rotate-90 text-[#d35b5b]")} />
            <span className={cn("font-bold", positive ? "text-[#58a067]" : "text-[#d35b5b]")}>{metric.delta.replace("+", "")}</span>
          </>
        ) : (
          <span className="size-2 rounded-full bg-current" />
        )}
        <span className="line-clamp-1 text-[#8b92a3]">{metric.subtext}</span>
      </div>
    </PartnerPanel>
  );
}

function ClinicalAlertCard({ metric }: { metric: PartnerSummaryMetric }) {
  return (
    <PartnerPanel className="relative min-h-[118px] overflow-hidden border-[#7d3439]/90 bg-[linear-gradient(138deg,rgba(45,37,43,0.96)_0%,rgba(10,28,38,0.94)_82%)] p-3 shadow-[0_18px_50px_rgba(94,28,36,0.22)] sm:min-h-[170px] sm:p-5">
      <div className="absolute -right-10 -top-10 size-28 rounded-full bg-[#8a2d35]/10 blur-2xl" />
      <div className="flex items-center gap-2 sm:gap-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#260809] text-[#d35b5b] sm:size-[56px]">
          <TriangleAlert className="size-4 sm:size-7" />
        </span>
        <p className="text-[12px] font-medium leading-4 text-white sm:text-[15px] sm:leading-5">{metric.label}</p>
      </div>
      <p className="mt-4 text-[28px] font-bold leading-none text-white sm:mt-7 sm:text-[44px]">{metric.value}</p>
      <div className="mt-4 flex items-center gap-2 text-[11px] leading-4 text-[#d35b5b] sm:mt-7 sm:gap-3 sm:text-[15px] sm:leading-5">
        <span className="size-2.5 rounded-full bg-[#d35b5b]" />
        <span>{metric.subtext}</span>
      </div>
    </PartnerPanel>
  );
}

function CompactMetricCard({ metric }: { metric: PartnerSummaryMetric }) {
  const Icon = metricIcons[metric.id];

  return (
    <PartnerPanel className={cn("flex min-h-[58px] items-center justify-between gap-2 px-3 sm:min-h-[78px] sm:px-4", metricToneClasses[metric.tone])}>
      <div className="flex items-center gap-3">
        <SmallIcon className={metric.tone === "amber" ? "bg-[#5b3b1b] text-[#d8a85a]" : "bg-white/10 text-[#b9c5cf]"}>
          <Icon className="size-4 sm:size-[18px]" />
        </SmallIcon>
        <p className="max-w-[92px] text-[11px] font-medium leading-3 text-white sm:max-w-[140px] sm:text-[13px] sm:leading-4">{metric.label}</p>
      </div>
      <div className="flex items-center gap-1 sm:gap-3">
        <p className="text-[21px] font-bold leading-7 text-white sm:text-[26px] sm:leading-8">{metric.value}</p>
        <ChevronRight className="hidden size-4 text-[#9aa8b5] sm:block" />
      </div>
    </PartnerPanel>
  );
}

function TopActions({ dashboard }: { dashboard: PartnerDashboardData }) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="flex items-center gap-3 sm:gap-8">
          <h1 className="text-[21px] font-semibold leading-7 text-[#d7dae0] sm:text-[24px] sm:leading-8">Olá, {dashboard.partnerName}</h1>
          <span className="text-[20px] leading-7 sm:text-[24px] sm:leading-8">👋</span>
        </div>
        <p className="mt-1 text-[12px] leading-4 text-[#828a9c] sm:mt-3 sm:text-[14px] sm:leading-5">{dashboard.periodLabel}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-4">
        <a
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] px-3 text-[12px] font-medium text-[#b6c0cc] transition-colors hover:bg-[#102635] hover:text-white sm:h-[42px] sm:gap-2 sm:rounded-[10px] sm:px-4 sm:text-[14px]"
          href="/parceiros/agenda"
        >
          <CalendarDays className="size-4 sm:size-[18px]" />
          Agenda
        </a>
        <a
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] bg-[#1d7ece] px-3 text-[12px] font-semibold text-white shadow-[0_8px_24px_rgba(29,126,206,0.2)] transition-colors hover:bg-[#2890df] sm:h-10 sm:gap-2 sm:rounded-[10px] sm:px-4 sm:text-[14px]"
          href="/parceiros/clientes"
        >
          <Plus className="size-4 sm:size-[18px]" />
          Cliente
        </a>
      </div>
    </div>
  );
}

function MetricsGrid({ dashboard }: { dashboard: PartnerDashboardData }) {
  const active = getMetric(dashboard, "activeClients");
  const pending = getMetric(dashboard, "pendingUpdates");
  const inactive = getMetric(dashboard, "inactiveClients");
  const renewals = getMetric(dashboard, "renewalsNext30");
  const revenue = getMetric(dashboard, "forecastMrr");
  const alerts = getMetric(dashboard, "clinicalAlerts");

  return (
    <section className="mt-4 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 xl:grid-cols-[213px_252px_283px_192px_192px]">
      {active ? <PrimaryMetricCard metric={active} /> : null}
      {pending ? <PrimaryMetricCard metric={pending} /> : null}
      <div className="grid gap-3">
        {inactive ? <CompactMetricCard metric={inactive} /> : null}
        {renewals ? <CompactMetricCard metric={renewals} /> : null}
      </div>
      {revenue ? <PrimaryMetricCard metric={revenue} /> : null}
      {alerts ? <PrimaryMetricCard metric={alerts} /> : null}
    </section>
  );
}

function AgendaPanel({ items }: { items: PartnerAgendaItem[] }) {
  return (
    <PartnerPanel className="p-4 sm:p-6 lg:h-[462px]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[17px] font-bold leading-6 text-[#d7dae0] sm:text-[20px] sm:leading-[30px]">Agenda do Dia</h2>
        <a className="text-[12px] font-medium text-[#9fd8ff] sm:text-[14px]" href="/parceiros/agenda">Ver agenda</a>
      </div>
      <div className="mt-4 space-y-4 sm:mt-7 sm:space-y-8">
        {items.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-[#41505c]/70 px-4 py-8 text-center">
            <Clock3 className="mx-auto size-6 text-[#647789]" />
            <p className="mt-3 text-[13px] leading-5 text-[#8ca1af]">Nenhuma ação operacional prevista para hoje.</p>
          </div>
        ) : (
          items.slice(0, 5).map((item) => (
            <div className="grid grid-cols-[42px_20px_1fr] items-start gap-3 sm:grid-cols-[48px_34px_1fr] sm:gap-4" key={item.id}>
              <p className="text-[12px] leading-4 text-[#7f8fa0] sm:text-[14px] sm:leading-5">{item.time}</p>
              <div className="relative flex justify-center">
                <span className={cn("mt-1 size-2.5 rounded-full", agendaToneClasses[item.tone])} />
                <span className="absolute top-5 h-[30px] w-px bg-[#20394a]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold leading-4 text-[#d7dae0] sm:text-[14px] sm:leading-5">{item.title}</p>
                <p className="mt-1 line-clamp-1 text-[11px] leading-4 text-[#7f8fa0] sm:mt-2 sm:line-clamp-2 sm:text-[12px]">{item.subtitle}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <a className="mt-5 block text-center text-[12px] font-medium text-[#1d9bf0] sm:mt-10 sm:text-[14px]" href="/parceiros/agenda">
        Ver todas as consultas
      </a>
    </PartnerPanel>
  );
}

function NewPatientsPanel({ dashboard }: { dashboard: PartnerDashboardData }) {
  return (
    <PartnerPanel className="bg-[#04111b] p-4 sm:p-5 lg:h-[242px]">
      <div className="flex items-start justify-between gap-3">
        <h2 className="max-w-[160px] text-[14px] font-bold leading-5 text-white sm:max-w-[95px] sm:text-[16px] sm:leading-6">Novos clientes</h2>
        <button className="inline-flex h-7 items-center gap-2 rounded-[6px] border border-[#6f8090] px-3 text-[10px] text-white" type="button">
          Últimos 6 meses
          <ChevronDown className="size-3" />
        </button>
      </div>
      <div className="mt-4">
        <NewPatientsBarChart data={dashboard.growth} />
      </div>
    </PartnerPanel>
  );
}

function AdherencePanel({ dashboard }: { dashboard: PartnerDashboardData }) {
  return (
    <PartnerPanel className="overflow-hidden border-[#2d4658] bg-[#04111b] p-4 sm:p-5 lg:h-[242px]">
      <div className="flex items-start justify-between gap-3">
        <h2 className="max-w-[220px] text-[16px] font-bold leading-6 text-white sm:text-[20px] sm:leading-[30px]">Distribuição de adesão por módulo</h2>
        <InfoHint label="Percentuais derivados de clientes ativos com plano personalizado e assinaturas ainda vigentes." />
      </div>
      <div className="mt-4">
        <AdherenceRings data={dashboard.adherence} />
      </div>
    </PartnerPanel>
  );
}

function ObjectiveDistributionPanel({ items }: { items: PartnerObjectiveDistributionItem[] }) {
  return (
    <PartnerPanel className="bg-[#04111b] p-4 sm:p-5 lg:h-[242px]">
      <h2 className="text-[15px] font-bold leading-5 text-white sm:text-[16px] sm:leading-6">Distribuição por objetivo principal</h2>
      <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
        {items.length === 0 ? (
          <p className="rounded-[10px] border border-dashed border-[#41505c]/70 px-4 py-8 text-center text-[13px] text-[#8ca1af]">
            Sem planos ou vínculos ativos para distribuir.
          </p>
        ) : (
          items.map((item) => (
            <div className="grid grid-cols-[minmax(0,1fr)_72px_34px] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_120px_42px] sm:gap-3" key={item.label}>
              <div className="flex min-w-0 items-center gap-3">
                <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate text-[12px] leading-4 text-[#d7dae0] sm:text-[14px] sm:leading-5">{item.label}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#243245]">
                <div className="h-full rounded-full" style={{ backgroundColor: item.color, width: `${Math.max(item.value, 3)}%` }} />
              </div>
              <span className="text-right text-[12px] font-medium text-white sm:text-[14px]">{item.value}%</span>
            </div>
          ))
        )}
      </div>
    </PartnerPanel>
  );
}

function PendingUpdatesTable({ rows }: { rows: PartnerPendingUpdateRow[] }) {
  return (
    <PartnerPanel className="p-4 sm:p-6 lg:h-[458px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[16px] font-bold leading-6 text-white">Pendências de atualização</h2>
        <p className="inline-flex items-center gap-1.5 text-[11px] leading-[14px] text-[#f6b118]">
          <TriangleAlert className="size-3" />
          Planos com data de atualização vencida
        </p>
      </div>
      <div className="mt-4 overflow-x-auto sm:mt-6">
        <table className="min-w-[528px] w-full text-left">
          <thead className="text-[12px] leading-4 text-[#647789]">
            <tr className="border-b border-[#1e3343]">
              <th className="pb-3 font-medium">Cliente</th>
              <th className="pb-3 font-medium">Objetivo</th>
              <th className="pb-3 font-medium">Dias em atraso</th>
              <th className="pb-3 font-medium">Última atualização</th>
              <th className="pb-3 text-right font-medium">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#112b3d]">
            {rows.length === 0 ? (
              <tr>
                <td className="py-12 text-center text-[13px] text-[#8ca1af]" colSpan={5}>Nenhuma atualização vencida no momento.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr className="text-[12px] sm:text-[13px]" key={row.id}>
                  <td className="py-3 sm:py-4">
                    <span className="inline-flex items-center gap-3 text-[#d7dae0]">
                      <span className="flex size-8 items-center justify-center rounded-full bg-[#5a6874]/70 text-[#8fa0ac]"><UserRound className="size-3.5" /></span>
                      {row.clientLabel}
                    </span>
                  </td>
                  <td className="py-3 text-[#21d29b] sm:py-4">{row.objective}</td>
                  <td className="py-3 sm:py-4">
                    <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#4d1d34]/70 px-2 py-1 text-[#ff6f89]">
                      {row.daysLateLabel}
                      <TriangleAlert className="size-3" />
                    </span>
                  </td>
                  <td className="py-3 text-[#9eb0bd] sm:py-4">{row.lastUpdateLabel}</td>
                  <td className="py-3 text-right sm:py-4">
                    <button className="h-7 rounded-[6px] border border-white px-3 text-[12px] font-medium text-white" type="button">{row.actionLabel}</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <a className="mt-6 flex items-center justify-center gap-4 text-[12px] text-[#a8b6c2]" href="/parceiros/clientes">
        Ver todas as pendências
        <ChevronRight className="size-4" />
      </a>
    </PartnerPanel>
  );
}

function RenewalsTable({ rows }: { rows: PartnerRenewalRow[] }) {
  return (
    <PartnerPanel className="p-4 sm:p-6 lg:h-[458px]">
      <h2 className="text-[16px] font-bold leading-6 text-white">Planos próximos do vencimento</h2>
      <div className="mt-4 overflow-x-auto sm:mt-6">
        <table className="min-w-[532px] w-full text-left">
          <thead className="text-[12px] leading-4 text-[#647789]">
            <tr>
              <th className="pb-3 font-medium">Cliente</th>
              <th className="pb-3 font-medium">Tipo / Objetivo do plano</th>
              <th className="pb-3 font-medium">Vence em</th>
              <th className="pb-3 text-right font-medium">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#112b3d]">
            {rows.length === 0 ? (
              <tr>
                <td className="py-12 text-center text-[13px] text-[#8ca1af]" colSpan={4}>Sem planos próximos do vencimento.</td>
              </tr>
            ) : (
              rows.slice(0, 5).map((row) => (
                <tr className="text-[12px] sm:text-[13px]" key={row.id}>
                  <td className="py-3 sm:py-4">
                    <span className="inline-flex items-center gap-3 text-[#d7dae0]">
                      <span className="flex size-8 items-center justify-center rounded-full bg-[#5a6874]/70 text-[#8fa0ac]"><UserRound className="size-3.5" /></span>
                      {row.clientLabel}
                    </span>
                  </td>
                  <td className="py-3 text-[#68afe9] sm:py-4">{row.planName}</td>
                  <td className="py-3 text-[#9eb0bd] sm:py-4">
                    <span className="block">{row.dueInLabel ?? row.dueLabel}</span>
                    <span>{row.dueLabel}</span>
                  </td>
                  <td className="py-3 text-right sm:py-4">
                    <button className="h-7 rounded-[6px] border border-[#68afe9] px-4 text-[12px] font-medium text-[#68afe9]" type="button">Revisar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <a className="mt-6 flex items-center justify-center gap-4 text-[12px] text-[#a8b6c2]" href="/parceiros/clientes">
        Ver todos os planos próximos do vencimento
        <ChevronRight className="size-4" />
      </a>
    </PartnerPanel>
  );
}

function OperationalNotes({ dashboard }: { dashboard: PartnerDashboardData }) {
  return (
    <div className="mt-6 grid min-w-0 gap-3 text-[12px] text-[#728697] md:grid-cols-3">
      <span className="inline-flex min-w-0 items-center gap-2 md:justify-end"><AlertTriangle className="size-4 shrink-0" /> <span>Atualizado em {new Date(dashboard.generatedAt).toLocaleString("pt-BR")}</span></span>
    </div>
  );
}

export function PartnerDashboardView({ dashboard }: PartnerDashboardViewProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b1720] px-3 py-4 font-['Rethink_Sans',sans-serif] text-[#f1f6fa] sm:px-5 sm:py-8 lg:px-6 lg:py-[85px]">
      <div className="mx-auto min-w-0 max-w-[1199px]">
        <div className="fixed right-6 top-5 z-20 hidden items-center gap-3 lg:flex">
          <div className="size-10 rounded-[10px] bg-[#1b2c37]" />
          <div>
            <p className="text-[14px] font-semibold leading-5 text-[#d7dae0]">{dashboard.partnerName}</p>
            <p className="text-[12px] leading-4 text-[#828a9c]">{dashboard.platformPlanLabel}</p>
          </div>
          <ChevronDown className="size-4 text-[#9aa8b5]" />
        </div>

        <TopActions dashboard={dashboard} />
        <MetricsGrid dashboard={dashboard} />

        <section className="mt-4 grid min-w-0 gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-[855px_320px]">
          <PartnerPerformancePanel dashboard={dashboard} />
          <AgendaPanel items={dashboard.todayAgenda} />
        </section>

        <section className="mt-4 grid min-w-0 gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-[276px_320px_555px]">
          <NewPatientsPanel dashboard={dashboard} />
          <AdherencePanel dashboard={dashboard} />
          <ObjectiveDistributionPanel items={dashboard.objectiveDistribution} />
        </section>

        <section className="mt-4 grid min-w-0 gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-2">
          <PendingUpdatesTable rows={dashboard.pendingUpdates} />
          <RenewalsTable rows={dashboard.renewals} />
        </section>

        <OperationalNotes dashboard={dashboard} />
      </div>
    </div>
  );
}
