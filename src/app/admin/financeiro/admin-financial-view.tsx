import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CreditCard,
  DollarSign,
  LineChart,
  Receipt,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  FinancialPlanChart,
  HorizontalBars,
  RevenueTrendChart,
} from "./admin-financial-charts";
import { AdminFinancialActions } from "./admin-financial-actions";
import { InfoHint } from "@/components/ui/info-hint";
import { DEFAULT_PLATFORM_NAME } from "@/lib/branding/platform-branding-contract";
import type {
  AdminFinancialData,
  FinancialKpi,
  FinancialRenewalRow,
  FinancialTableRow,
} from "@/lib/admin/financial-metrics";
import { cn } from "@/lib/utils";

type AdminFinancialViewProps = {
  financial: AdminFinancialData;
  platformName?: string;
};

const kpiIcons: Record<FinancialKpi["id"], LucideIcon> = {
  activeSubscriptions: CreditCard,
  arr: LineChart,
  churn: ArrowDown,
  delinquency: Receipt,
  ltv: UsersRound,
  mrr: DollarSign,
};

const statusClasses: Record<FinancialTableRow["statusTone"], string> = {
  active: "border-[#1d8b46]/55 bg-[#1d8b46]/25 text-[#67d982]",
  danger: "border-[#9d3b3b]/60 bg-[#401b20]/70 text-[#ff9b8f]",
  neutral: "border-[#456172]/70 bg-[#173140]/70 text-[#c2d0d8]",
  warning: "border-[#b16a06]/55 bg-[#b16a06]/25 text-[#ebaa3a]",
};

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 rounded-[9px] border border-[#2b4a5d]/90 bg-[#0d2635]/80 shadow-[0_18px_60px_rgba(2,10,16,0.24)]", className)}>
      {children}
    </section>
  );
}

function SectionHeader({ action, info, subtitle, title }: { action?: ReactNode; info: string; subtitle?: string; title: string }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-[16px] font-bold leading-[22px] text-[#dde7ee]">{title}</h2>
          <InfoHint label={info} />
        </div>
        {subtitle ? <p className="mt-2 text-[12px] leading-[18px] text-[#8ca1af]">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

function KpiCard({ metric }: { metric: FinancialKpi }) {
  const Icon = kpiIcons[metric.id];
  const isBad = metric.trend === "bad";

  return (
    <Panel className="min-h-[174px] p-4">
      <div className="flex items-start gap-3">
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", isBad ? "bg-[#e05252]/20 text-[#ef6262]" : "bg-[#22c77a]/20 text-[#58d881]")}>
          <Icon className="size-[21px]" />
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold leading-[17px] text-[#c0ced8]">{metric.label}</p>
          <p className="mt-1 text-[12px] leading-[15px] text-[#9baab5]">{metric.description}</p>
        </div>
      </div>
      <p className="mt-6 truncate text-[26px] font-medium leading-[32px] text-[#f1f5f7]">{metric.value}</p>
      <p className={cn("mt-2 flex items-center gap-1 text-[13px] font-bold", isBad ? "text-[#f26758]" : "text-[#4bcb75]")}>
        {isBad ? <ArrowDown className="size-4" /> : <ArrowUp className="size-4" />}
        {metric.delta}
      </p>
      <p className="mt-1 text-[12px] text-[#9baab5]">vs. mês anterior</p>
    </Panel>
  );
}

function RecentSubscriptionsTable({ rows }: { rows: FinancialTableRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left">
        <thead>
          <tr className="border-b border-[#294657]/80 text-[11px] font-semibold text-[#8495a3]">
            <th className="px-2 py-3">Cliente / Profissional</th>
            <th className="px-2 py-3">Plano</th>
            <th className="px-2 py-3">Valor</th>
            <th className="px-2 py-3">Status</th>
            <th className="px-2 py-3">Renovação</th>
            <th className="px-2 py-3">Método</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#294657]/55">
          {rows.length === 0 ? (
            <tr><td className="px-2 py-6 text-center text-[13px] text-[#8ca1af]" colSpan={6}>Sem assinaturas registradas.</td></tr>
          ) : rows.map((row) => (
            <tr className="text-[12px] text-[#b8c5ce]" key={row.id}>
              <td className="px-2 py-3">
                <p className="font-bold text-[#d5dee5]">{row.name}</p>
                <p className="mt-1 text-[10px] text-[#8294a3]">{row.email}</p>
              </td>
              <td className="px-2 py-3">{row.plan}</td>
              <td className="px-2 py-3">{row.amount}</td>
              <td className="px-2 py-3"><span className={cn("rounded-[4px] border px-2 py-1 text-[10px] font-bold", statusClasses[row.statusTone])}>{row.status}</span></td>
              <td className="px-2 py-3">{row.dateLabel}</td>
              <td className="px-2 py-3">{row.method}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RenewalsTable({ rows }: { rows: FinancialRenewalRow[] }) {
  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <p className="rounded-[8px] border border-dashed border-[#31536a] py-8 text-center text-[13px] text-[#8ca1af]">Sem renovações críticas nos próximos 30 dias.</p>
      ) : rows.map((row) => (
        <div className="grid gap-3 rounded-[8px] border border-[#294657]/70 bg-[#0b2230] p-3 text-[12px] md:grid-cols-[minmax(0,1fr)_90px_90px]" key={row.id}>
          <div className="min-w-0">
            <p className="truncate font-bold text-[#d5dee5]">{row.name}</p>
            <p className="truncate text-[10px] text-[#8294a3]">{row.email}</p>
          </div>
          <div>
            <p className="text-[#8495a3]">Plano</p>
            <p className="font-semibold text-[#c8d5dc]">{row.plan}</p>
          </div>
          <div>
            <p className="text-[#8495a3]">Renovação</p>
            <p className="font-semibold text-[#c8d5dc]">{row.dateLabel}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminFinancialView({ financial, platformName = DEFAULT_PLATFORM_NAME }: AdminFinancialViewProps) {
  return (
    <div className="min-h-screen bg-[#0b1720] px-5 py-6 font-['Rethink_Sans',sans-serif] text-[#f1f6fa] md:px-8 lg:px-[43px] lg:py-[35px]">
      <header className="flex flex-col gap-4 border-b border-[#244454]/70 pb-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5db7ef]">Admin</p>
          <h1 className="mt-2 text-[30px] font-bold leading-[36px] text-[#f4f8fb] md:text-[34px]">Financeiro & Planos</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-[22px] text-[#8ca1af]">
            Monitore faturamento, assinaturas, inadimplência e performance comercial com dados atualizados da plataforma.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
          <div className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#2b4a5d] bg-[#0d2635]/80 px-3 text-[13px] font-semibold text-[#629bdb]">
            <CalendarDays className="size-4" />
            {financial.periodLabel}
          </div>
          <AdminFinancialActions financial={financial} />
        </div>
      </header>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {financial.kpis.map((metric) => <KpiCard key={metric.id} metric={metric} />)}
      </section>

      <section className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid min-w-0 gap-6">
          <Panel className="p-[22px]">
            <SectionHeader
              info="MRR soma o valor mensalizado do plano-base e o adicional por Clientes ativos das assinaturas de profissionais ativos. Receita nova soma assinaturas iniciadas em cada mês."
              subtitle="Acompanhe a evolução da receita mensal recorrente nos últimos 12 meses."
              title="Evolução da receita recorrente (MRR)"
            />
            <div className="mt-6 flex flex-wrap items-center gap-6 text-[13px] text-[#a1b0bb]">
              <span className="inline-flex items-center gap-2"><span className="h-1 w-5 rounded-full bg-[#15c8c3]" /> MRR</span>
              <span className="inline-flex items-center gap-2"><span className="h-1 w-5 rounded-full bg-[#2d9cff]" /> Receita nova</span>
            </div>
            <div className="mt-3"><RevenueTrendChart data={financial.revenueTrend} /></div>
          </Panel>

          <Panel className="p-[22px]">
            <SectionHeader
              info="Lista as assinaturas mais recentes, com plano, valor mensalizado, status financeiro e próxima renovação registrada."
              subtitle="Últimas assinaturas registradas no domínio financeiro."
              title="Últimas assinaturas e movimentações"
            />
            <div className="mt-4"><RecentSubscriptionsTable rows={financial.recentRows} /></div>
          </Panel>
        </div>

        <aside className="grid min-w-0 gap-6">
          <Panel className="p-[22px]">
            <SectionHeader
              info="Conta assinaturas ativas agrupadas por plano comercial, considerando apenas profissionais ativos."
              subtitle="Distribuição de assinaturas ativas por plano comercial."
              title="Assinaturas por plano"
            />
            <div className="mt-6"><FinancialPlanChart data={financial.planDistribution} /></div>
          </Panel>

          <Panel className="p-[22px]">
            <SectionHeader
              info="Soma pagamentos concluídos no mês, separados entre renovações e assinaturas iniciais. Ajustes manuais ficam fora do gráfico."
              subtitle="Receita processada por renovações e assinaturas iniciadas no mês."
              title="Receita por canal"
            />
            <div className="mt-5"><HorizontalBars data={financial.revenueByKind} /></div>
          </Panel>

          <Panel className="p-[22px]">
            <SectionHeader
              info="Agrupa a receita mensalizada do plano-base e do adicional por Clientes ativos pelo ciclo do plano: mensal ou anual."
              subtitle="Separação da base por ciclo comercial."
              title="Distribuição por ciclo de cobrança"
            />
            <div className="mt-5"><HorizontalBars data={financial.cycleDistribution} /></div>
          </Panel>

          <Panel className="p-[22px]">
            <SectionHeader
              info="Mostra assinaturas ativas com vencimento nos próximos 30 dias, ordenadas pela data de renovação."
              subtitle="Renovações ativas que vencem nos próximos 30 dias."
              title="Próximas renovações críticas"
            />
            <div className="mt-5"><RenewalsTable rows={financial.renewalRows} /></div>
          </Panel>
        </aside>
      </section>

      <footer className="mt-7 flex flex-col gap-2 border-t border-[#244454]/70 pt-5 text-[12px] text-[#718795] md:flex-row md:items-center md:justify-between">
        <span>{platformName} — Financeiro Admin</span>
        <span>Atualizado em {new Date(financial.generatedAt).toLocaleString("pt-BR")}</span>
      </footer>
    </div>
  );
}
