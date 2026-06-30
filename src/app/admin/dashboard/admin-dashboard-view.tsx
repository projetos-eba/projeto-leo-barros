import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  FileWarning,
  Headphones,
  RefreshCw,
  UsersRound,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  GrowthChart,
  PlanDistributionChart,
  ProfessionalStatusChart,
} from "./admin-dashboard-charts";
import { InfoHint } from "@/components/ui/info-hint";
import type {
  AdminDashboardData,
  DashboardAlert,
  DashboardBottomMetric,
  DashboardHealthItem,
  DashboardKpi,
  DashboardMovement,
} from "@/lib/admin/dashboard-metrics";
import { cn } from "@/lib/utils";

type AdminDashboardViewProps = {
  dashboard: AdminDashboardData;
};

const kpiIcons: Record<DashboardKpi["id"], LucideIcon> = {
  activeClients: BadgeCheck,
  activePartners: UsersRound,
  mrr: CircleDollarSign,
  openTickets: Headphones,
  renewalRate: RefreshCw,
};

const healthIcons: Record<DashboardHealthItem["id"], LucideIcon> = {
  pendingDocuments: FileWarning,
  processedPayments: CreditCard,
  ticketsSla: Headphones,
};

const bottomIcons: Record<DashboardBottomMetric["id"], LucideIcon> = {
  churn: ArrowDown,
  failedPayments: WalletCards,
  newClients: UsersRound,
  pendingDocuments: FileWarning,
};

const alertToneClasses: Record<DashboardAlert["tone"], string> = {
  danger: "border-[#9d3b3b]/70 bg-[#401b20]/55 text-[#ffb4a8]",
  info: "border-[#2b6f96]/70 bg-[#0d3042]/55 text-[#9fd8ff]",
  success: "border-[#1f7a46]/70 bg-[#0f3525]/55 text-[#a6efbf]",
  warning: "border-[#9a6b1f]/70 bg-[#3b2a12]/55 text-[#ffd287]",
};

const movementToneClasses: Record<DashboardMovement["tone"], string> = {
  amber: "bg-[#f0a52b]/20 text-[#ebaa3a]",
  blue: "bg-[#1f9bff]/20 text-[#2d9cff]",
  green: "bg-[#22c77a]/20 text-[#58d881]",
  purple: "bg-[#8d5cf6]/20 text-[#9b75ff]",
  red: "bg-[#e05252]/20 text-[#ef6262]",
};

function DashboardPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-[9px] border border-[#2b4a5d]/90 bg-[#0d2635]/80 shadow-[0_18px_60px_rgba(2,10,16,0.24)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function SectionHeader({ info, subtitle, title }: { info: string; subtitle?: string; title: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-[17px] font-bold leading-[22px] text-[#dde7ee]">{title}</h2>
        <InfoHint label={info} />
      </div>
      {subtitle ? <p className="mt-2 text-[13px] leading-[18px] text-[#8ca1af]">{subtitle}</p> : null}
    </div>
  );
}

function ToneIcon({ className, icon: Icon }: { className?: string; icon: LucideIcon }) {
  return (
    <div className={cn("flex size-[45px] shrink-0 items-center justify-center rounded-full", className)}>
      <Icon className="size-[22px]" />
    </div>
  );
}

function KpiCard({ metric }: { metric: DashboardKpi }) {
  const Icon = kpiIcons[metric.id];
  const isBad = metric.trend === "bad";

  return (
    <DashboardPanel className="min-h-[170px] p-[18px]">
      <div className="flex items-start gap-3">
        <ToneIcon
          className={cn(
            metric.id === "mrr" && "bg-[#22c77a]/20 text-[#58d881]",
            metric.id === "openTickets" && "bg-[#f0a52b]/20 text-[#e8a72f]",
            metric.id !== "mrr" && metric.id !== "openTickets" && "bg-[#1f9bff]/20 text-[#2d9cff]",
          )}
          icon={Icon}
        />
        <p className="max-w-[150px] text-[14px] font-semibold leading-[17px] text-[#9eb0bd]">{metric.label}</p>
      </div>
      <p className="mt-7 text-[30px] font-medium leading-[34px] text-[#f1f5f7]">{metric.value}</p>
      <p className={cn("mt-2 flex items-center gap-1 text-[17px] font-bold leading-[18px]", isBad ? "text-[#f26758]" : "text-[#4bcb75]")}> 
        {isBad ? <ArrowDown className="size-4" /> : <ArrowUp className="size-4" />} {metric.delta}
      </p>
      <p className="mt-1 text-[16px] leading-[17px] text-[#9baab5]">vs. mês anterior</p>
    </DashboardPanel>
  );
}

function HealthPanel({ items }: { items: DashboardHealthItem[] }) {
  return (
    <DashboardPanel className="p-[22px]">
      <SectionHeader
        info="Reúne pagamentos processados no mês, percentual de tickets resolvidos dentro do SLA e documentos pendentes."
        title="Saúde operacional"
      />
      <div className="mt-4 divide-y divide-[#294657]/60 border-t border-[#294657]/60">
        {items.map((item) => {
          const Icon = healthIcons[item.id];
          const attention = item.badge === "Atenção";

          return (
            <div className="flex items-center gap-4 py-4" key={item.id}>
              <ToneIcon className="bg-[#1f9bff]/20 text-[#2d9cff]" icon={Icon} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold leading-[18px] text-[#9eb0bd]">{item.label}</p>
                <p className="mt-1 text-[22px] font-bold leading-[28px] text-[#f1f6fa]">{item.value}</p>
                <p className="text-[12px] leading-[17px] text-[#8ea0ae]">{item.subtext}</p>
              </div>
              <span className={cn("rounded-[5px] border px-2 py-1 text-[11px] font-bold", attention ? "border-[#b16a06]/55 bg-[#b16a06]/25 text-[#ebaa3a]" : "border-[#1d8b46]/55 bg-[#1d8b46]/25 text-[#67d982]")}>{item.badge}</span>
            </div>
          );
        })}
      </div>
    </DashboardPanel>
  );
}

function AlertsPanel({ alerts }: { alerts: DashboardAlert[] }) {
  return (
    <DashboardPanel className="p-[22px]">
      <SectionHeader
        info="Gera alertas a partir de documentos pendentes, pagamentos falhos no mês e tickets abertos da operação."
        subtitle="Sinais gerados a partir de documentos, pagamentos e suporte."
        title="Alertas e ações rápidas"
      />
      <div className="mt-5 grid gap-3">
        {alerts.map((alert) => (
          <div className={cn("rounded-[8px] border p-4", alertToneClasses[alert.tone])} key={alert.id}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="text-[14px] font-bold text-[#f2f7fa]">{alert.title}</p>
                <p className="mt-1 text-[13px] leading-[18px] text-[#b8c7d1]">{alert.body}</p>
                <p className="mt-3 text-[12px] font-bold text-[#dce8ef]">{alert.action}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}

function MovementsPanel({ movements }: { movements: DashboardMovement[] }) {
  return (
    <DashboardPanel className="p-[22px]">
      <SectionHeader
        info="Mostra os eventos mais recentes registrados na plataforma, como assinaturas, pagamentos, documentos e suporte."
        title="Últimas movimentações"
      />
      <div className="mt-4 space-y-4">
        {movements.length === 0 ? (
          <p className="text-[13px] text-[#91a5b3]">Nenhuma movimentação registrada.</p>
        ) : (
          movements.map((movement) => (
            <div className="flex gap-3" key={movement.id}>
              <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", movementToneClasses[movement.tone])}>
                <CheckCircle2 className="size-5" />
              </span>
              <div>
                <p className="text-[13px] font-bold text-[#edf5f8]">{movement.title}</p>
                <p className="text-[12px] leading-[17px] text-[#92a4b1]">{movement.detail}</p>
                <p className="mt-1 text-[11px] text-[#748999]">{movement.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardPanel>
  );
}

function BottomMetricCard({ metric }: { metric: DashboardBottomMetric }) {
  const Icon = bottomIcons[metric.id];
  const isBad = metric.trend === "bad";

  return (
    <DashboardPanel className="p-4">
      <div className="flex items-center gap-3">
        <ToneIcon className={isBad ? "bg-[#e05252]/20 text-[#ef6262]" : "bg-[#1f9bff]/20 text-[#2d9cff]"} icon={Icon} />
        <div>
          <p className="text-[13px] font-semibold text-[#9eb0bd]">{metric.label}</p>
          <p className="mt-1 text-[24px] font-bold text-[#f1f6fa]">{metric.value}</p>
          <p className={cn("text-[12px] font-bold", isBad ? "text-[#f26758]" : "text-[#4bcb75]")}>{metric.delta}</p>
        </div>
      </div>
    </DashboardPanel>
  );
}

function BottomMetricsGrid({ metrics }: { metrics: DashboardBottomMetric[] }) {
  const visibleMetrics = metrics.filter((metric) => ["newClients", "churn", "failedPayments"].includes(metric.id));

  return (
    <section aria-labelledby="monthly-indicators-title">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[17px] font-bold leading-[22px] text-[#dde7ee]" id="monthly-indicators-title">
            Indicadores do mês
          </h2>
          <InfoHint label="Novos clientes conta pacientes distintos iniciados no mês em profissionais ativos. Churn usa cancelamentos do mês sobre assinaturas ativas no início do mês. Pagamentos falhos conta cobranças failed no período." />
        </div>
        <p className="mt-2 text-[13px] leading-[18px] text-[#8ca1af]">
          Clientes novos em profissionais ativos, churn e pagamentos falhos no período atual.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {visibleMetrics.map((metric) => <BottomMetricCard key={metric.id} metric={metric} />)}
      </div>
    </section>
  );
}

export function AdminDashboardView({ dashboard }: AdminDashboardViewProps) {
  return (
    <div className="min-h-screen bg-[#0b1720] px-5 py-6 font-['Rethink_Sans',sans-serif] text-[#f1f6fa] md:px-8 lg:px-[43px] lg:py-[35px]">
      <header className="flex flex-col gap-4 border-b border-[#244454]/70 pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5db7ef]">Admin</p>
          <h1 className="mt-2 text-[30px] font-bold leading-[36px] text-[#f4f8fb] md:text-[34px]">Super Admin — Visão Geral</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-[22px] text-[#8ca1af]">Acompanhe assinaturas, clientes, suporte e documentos com dados reais do banco local.</p>
        </div>
        <div className="flex items-center gap-3 rounded-[8px] border border-[#2b4a5d] bg-[#0d2635]/80 px-4 py-3 text-[13px] font-semibold text-[#b5c7d2]">
          <CalendarDays className="size-4 text-[#5db7ef]" />
          {dashboard.periodLabel}
        </div>
      </header>

      <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {dashboard.kpis.map((metric) => <KpiCard key={metric.id} metric={metric} />)}
      </section>

      <section className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-w-0 gap-6">
          <DashboardPanel className="p-[22px]">
            <SectionHeader
              info="Conta, mês a mês, parceiros com assinatura ativa e clientes ativos vinculados a esses parceiros."
              subtitle="Evolução mensal de parceiros com assinatura ativa e clientes vinculados."
              title="Crescimento da plataforma"
            />
            <div className="mt-7 flex items-center gap-6 text-[13px] text-[#a1b0bb]">
              <span className="inline-flex items-center gap-2"><span className="h-1 w-5 rounded-full bg-[#2d9cff]" /> Parceiros</span>
              <span className="inline-flex items-center gap-2"><span className="h-1 w-5 rounded-full bg-[#15c8c3]" /> Clientes</span>
            </div>
            <div className="mt-4"><GrowthChart data={dashboard.growth} /></div>
          </DashboardPanel>

          <DashboardPanel className="p-[22px]">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <SectionHeader
                  info="Conta assinaturas ativas agrupadas pelo plano comercial vigente."
                  subtitle="Distribuição de assinaturas ativas por plano comercial."
                  title="Assinaturas por plano"
                />
                <div className="mt-5"><PlanDistributionChart data={dashboard.planDistribution} /></div>
              </div>
              <div>
                <SectionHeader
                  info="Classifica profissionais em ativos, suspensos e inativos pela regra efetiva de perfil e assinatura."
                  subtitle="Divisão operacional dos profissionais por status efetivo."
                  title="Profissionais por status"
                />
                <div className="mt-5"><ProfessionalStatusChart data={dashboard.professionalStatusDistribution} /></div>
              </div>
            </div>
          </DashboardPanel>

          <BottomMetricsGrid metrics={dashboard.bottomMetrics} />
        </div>

        <aside className="grid min-w-0 gap-6">
          <HealthPanel items={dashboard.health} />
          <AlertsPanel alerts={dashboard.alerts} />
          <MovementsPanel movements={dashboard.movements} />
        </aside>
      </section>

      <footer className="mt-7 flex flex-col gap-2 border-t border-[#244454]/70 pt-5 text-[12px] text-[#718795] md:flex-row md:items-center md:justify-between">
        <span>Leonardo Barros — Plataforma Admin</span>
        <span>Atualizado pelo banco local em {new Date(dashboard.generatedAt).toLocaleString("pt-BR")}</span>
      </footer>
    </div>
  );
}
