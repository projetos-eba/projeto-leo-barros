import {
  isSubscriptionActiveAt,
  isSubscriptionCurrentAt,
} from "./professional-status";

export type FinancialPlan = {
  billing_interval: string;
  currency: string;
  id: string;
  is_active?: boolean;
  name: string;
  price_cents: number;
  slug: string;
};

export type FinancialSubscription = {
  active_client_quantity?: number;
  cancel_at_period_end?: boolean;
  canceled_at: string | null;
  created_at: string;
  current_period_end: string;
  current_period_start: string;
  id: string;
  partner_id: string;
  plan_id: string;
  status: string;
};

export type FinancialPayment = {
  amount_cents: number;
  currency?: string;
  due_at: string;
  id: string;
  paid_at: string | null;
  partner_id: string;
  payment_kind: string;
  status: string;
  subscription_id: string;
  stripe_payment_intent_id?: string | null;
};

export type FinancialProfile = {
  created_at: string;
  display_name: string;
  email: string;
  id: string;
  role: string;
  status: string;
};

export type FinancialPartner = {
  created_at: string;
  id: string;
  professional_name: string;
  professional_type: string;
  profile_id: string;
};

export type FinancialRawData = {
  partners: FinancialPartner[];
  payments: FinancialPayment[];
  plans: FinancialPlan[];
  profiles: FinancialProfile[];
  subscriptions: FinancialSubscription[];
};

export type FinancialKpi = {
  delta: string;
  description: string;
  id: "mrr" | "arr" | "activeSubscriptions" | "churn" | "delinquency" | "ltv";
  label: string;
  trend: "good" | "bad" | "neutral";
  value: string;
};

export type FinancialRevenuePoint = {
  label: string;
  month: string;
  mrr: number;
  newRevenue: number;
};

export type FinancialPlanSlice = {
  color: string;
  count: number;
  label: string;
  percent: number;
  value: number;
};

export type FinancialBar = {
  color: string;
  label: string;
  percent: number;
  value: number;
};

export type FinancialTableRow = {
  amount: string;
  dateLabel: string;
  email: string;
  id: string;
  method: string;
  name: string;
  plan: string;
  status: string;
  statusTone: "active" | "danger" | "neutral" | "warning";
};

export type FinancialRenewalRow = {
  amount: string;
  dateLabel: string;
  email: string;
  id: string;
  name: string;
  plan: string;
};

export type AdminFinancialData = {
  churnMrrCents: number;
  cycleDistribution: FinancialBar[];
  generatedAt: string;
  kpis: FinancialKpi[];
  newMrrCents: number;
  periodLabel: string;
  planDistribution: FinancialPlanSlice[];
  recentRows: FinancialTableRow[];
  reductionMrrCents: number;
  renewalRows: FinancialRenewalRow[];
  revenueByKind: FinancialBar[];
  revenueTrend: FinancialRevenuePoint[];
};

const currentCommercialStatuses = new Set(["active", "trialing", "past_due", "incomplete"]);
const planColors = ["#2d9cff", "#15c8c3", "#8d5cf6", "#58d881", "#f0a52b"];
const kindLabels: Record<string, string> = {
  initial: "Assinaturas do mês",
  renewal: "Renovações",
};

function parseDate(value: string | null | undefined) {
  return value ? new Date(value) : null;
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function endOfMonth(date: Date) {
  return new Date(addMonths(startOfMonth(date), 1).getTime() - 1);
}

function isWithin(date: Date | null, start: Date, end: Date) {
  return Boolean(date && date >= start && date <= end);
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
}

function formatCurrencyCents(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    maximumFractionDigits,
    style: "currency",
  }).format(value / 100);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;
}

function formatDelta(current: number, previous: number, suffix = "%") {
  if (previous === 0 && current === 0) return suffix === "p.p." ? "0 p.p." : "0%";
  if (previous === 0) return suffix === "p.p." ? "+100 p.p." : "+100%";

  const raw = suffix === "p.p." ? current - previous : ((current - previous) / previous) * 100;
  const sign = raw > 0 ? "+" : "";
  const formatted = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(raw);
  return `${sign}${formatted}${suffix === "p.p." ? " p.p." : "%"}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function formatMonthLabel(date: Date) {
  const label = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC", year: "2-digit" }).format(date);
  return label.replace(".", "").replace(" de ", "/");
}

function periodLabel(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
  return `${formatter.format(start)} - ${formatter.format(end)}`.replaceAll(".", "");
}

function monthlyizePlanPrice(plan: FinancialPlan | undefined) {
  if (!plan) return 0;
  return plan.billing_interval === "yearly" ? Math.round(plan.price_cents / 12) : plan.price_cents;
}

function monthlyActiveClientAddon(subscription: FinancialSubscription) {
  return Math.max(0, subscription.active_client_quantity ?? 0) * 199;
}

function monthlySubscriptionAmount(subscription: FinancialSubscription, plansById: Map<string, FinancialPlan>) {
  return monthlyizePlanPrice(plansById.get(subscription.plan_id)) + monthlyActiveClientAddon(subscription);
}

function profileIsActivePartner(partner: FinancialPartner, profilesById: Map<string, FinancialProfile>) {
  const profile = profilesById.get(partner.profile_id);
  return profile?.role === "parceiro" && profile.status === "active";
}

function activePartnerIdsAt(raw: FinancialRawData, at: Date) {
  const profilesById = new Map(raw.profiles.map((profile) => [profile.id, profile]));
  const partnersById = new Map(raw.partners.map((partner) => [partner.id, partner]));

  return new Set(
    raw.subscriptions
      .filter((subscription) => {
        const partner = partnersById.get(subscription.partner_id);
        return Boolean(partner && profileIsActivePartner(partner, profilesById) && isSubscriptionActiveAt(subscription, at));
      })
      .map((subscription) => subscription.partner_id),
  );
}

function activeSubscriptionsAt(raw: FinancialRawData, at: Date) {
  const activePartnerIds = activePartnerIdsAt(raw, at);
  return raw.subscriptions.filter((subscription) => activePartnerIds.has(subscription.partner_id) && isSubscriptionActiveAt(subscription, at));
}

function mrrAt(raw: FinancialRawData, plansById: Map<string, FinancialPlan>, at: Date) {
  return activeSubscriptionsAt(raw, at).reduce((sum, subscription) => sum + monthlySubscriptionAmount(subscription, plansById), 0);
}

function churnRate(raw: FinancialRawData, start: Date, end: Date) {
  const activeAtStart = activeSubscriptionsAt(raw, start).length;
  const canceled = raw.subscriptions.filter((subscription) => isWithin(parseDate(subscription.canceled_at), start, end)).length;
  return activeAtStart === 0 ? 0 : (canceled / activeAtStart) * 100;
}

function newMrrWithin(raw: FinancialRawData, plansById: Map<string, FinancialPlan>, start: Date, end: Date) {
  const activePartnerIds = activePartnerIdsAt(raw, end);
  return raw.subscriptions
    .filter((subscription) => activePartnerIds.has(subscription.partner_id) && isWithin(parseDate(subscription.created_at), start, end))
    .reduce((sum, subscription) => sum + monthlySubscriptionAmount(subscription, plansById), 0);
}

function churnedMrrWithin(raw: FinancialRawData, plansById: Map<string, FinancialPlan>, start: Date, end: Date) {
  return raw.subscriptions
    .filter((subscription) => isWithin(parseDate(subscription.canceled_at), start, end))
    .reduce((sum, subscription) => sum + monthlySubscriptionAmount(subscription, plansById), 0);
}

function delinquentPayments(raw: FinancialRawData, now: Date) {
  return raw.payments.filter((payment) => {
    const dueAt = parseDate(payment.due_at);
    return Boolean(dueAt && dueAt < now && (payment.status === "failed" || payment.status === "pending"));
  });
}

function delinquencyRate(raw: FinancialRawData, now: Date) {
  const activeCount = activeSubscriptionsAt(raw, now).length;
  if (activeCount === 0) return 0;
  const affectedSubscriptions = new Set(delinquentPayments(raw, now).map((payment) => payment.subscription_id));
  return (affectedSubscriptions.size / activeCount) * 100;
}

function partnerLabel(
  partnerId: string,
  partnersById: Map<string, FinancialPartner>,
  profilesById: Map<string, FinancialProfile>,
) {
  const partner = partnersById.get(partnerId);
  const profile = partner ? profilesById.get(partner.profile_id) : undefined;
  const name = profile?.display_name ?? partner?.professional_name ?? "Profissional";
  return {
    email: profile?.email ?? "sem-email@example.invalid",
    name,
  };
}

function statusLabel(status: string): Pick<FinancialTableRow, "status" | "statusTone"> {
  if (status === "active") return { status: "Ativa", statusTone: "active" };
  if (status === "trialing" || status === "past_due" || status === "incomplete" || status === "pending") return { status: "Pendente", statusTone: "warning" };
  if (status === "canceled") return { status: "Cancelada", statusTone: "danger" };
  return { status: "Indefinida", statusTone: "neutral" };
}

function paymentMethod(subscription: FinancialSubscription, payment?: FinancialPayment) {
  if (payment?.payment_kind === "manual_adjustment") return "Ajuste manual";
  return subscription.status === "past_due" || payment?.status === "pending" ? "Boleto" : "Cartão";
}

function percentOf(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 1000) / 10;
}

export function buildAdminFinancialData(raw: FinancialRawData, now = new Date()): AdminFinancialData {
  const currentStart = startOfMonth(now);
  const currentEnd = endOfMonth(now);
  const previousStart = addMonths(currentStart, -1);
  const previousEnd = new Date(currentStart.getTime() - 1);
  const nextThirtyDays = new Date(now.getTime() + 30 * 86_400_000);
  const plansById = new Map(raw.plans.map((plan) => [plan.id, plan]));
  const partnersById = new Map(raw.partners.map((partner) => [partner.id, partner]));
  const profilesById = new Map(raw.profiles.map((profile) => [profile.id, profile]));
  const latestPaymentBySubscription = new Map<string, FinancialPayment>();

  raw.payments
    .slice()
    .sort((a, b) => new Date(b.due_at).getTime() - new Date(a.due_at).getTime())
    .forEach((payment) => {
      if (!latestPaymentBySubscription.has(payment.subscription_id)) {
        latestPaymentBySubscription.set(payment.subscription_id, payment);
      }
    });

  const activeSubscriptions = activeSubscriptionsAt(raw, now);
  const previousActiveSubscriptions = activeSubscriptionsAt(raw, previousEnd);
  const mrr = mrrAt(raw, plansById, now);
  const previousMrr = mrrAt(raw, plansById, previousEnd);
  const arr = mrr * 12;
  const previousArr = previousMrr * 12;
  const churn = churnRate(raw, currentStart, currentEnd);
  const previousChurn = churnRate(raw, previousStart, previousEnd);
  const delinquency = delinquencyRate(raw, now);
  const previousDelinquency = delinquencyRate(raw, previousEnd);
  const arpa = activeSubscriptions.length === 0 ? 0 : Math.round(mrr / activeSubscriptions.length);
  const previousArpa = previousActiveSubscriptions.length === 0 ? 0 : Math.round(previousMrr / previousActiveSubscriptions.length);
  const ltv = arpa * 12;
  const previousLtv = previousArpa * 12;
  const newMrr = newMrrWithin(raw, plansById, currentStart, currentEnd);
  const churnMrr = churnedMrrWithin(raw, plansById, currentStart, currentEnd);
  const reductionMrr = raw.subscriptions
    .filter((subscription) => subscription.status === "past_due" && isSubscriptionCurrentAt(subscription, now))
    .reduce((sum, subscription) => sum + monthlySubscriptionAmount(subscription, plansById), 0);

  const revenueTrend = Array.from({ length: 12 }, (_, index) => {
    const monthStart = addMonths(currentStart, index - 11);
    const monthEnd = endOfMonth(monthStart);
    return {
      label: formatMonthLabel(monthStart),
      month: monthStart.toISOString().slice(0, 7),
      mrr: mrrAt(raw, plansById, monthEnd) / 100,
      newRevenue: newMrrWithin(raw, plansById, monthStart, monthEnd) / 100,
    };
  });

  const planDistribution = raw.plans
    .map((plan, index) => {
      const count = activeSubscriptions.filter((subscription) => subscription.plan_id === plan.id).length;
      return {
        color: planColors[index % planColors.length],
        count,
        label: plan.name,
        percent: percentOf(count, activeSubscriptions.length),
        value: count,
      };
    })
    .filter((slice) => slice.count > 0);

  const paidPaymentsThisMonth = raw.payments.filter((payment) => (
    payment.status === "succeeded" &&
    (payment.payment_kind === "initial" || payment.payment_kind === "renewal") &&
    isWithin(parseDate(payment.paid_at), currentStart, currentEnd)
  ));
  const revenueByKindValues = paidPaymentsThisMonth.reduce<Record<string, number>>((totals, payment) => ({
    ...totals,
    [payment.payment_kind]: (totals[payment.payment_kind] ?? 0) + payment.amount_cents,
  }), {});
  const revenueTotal = Object.values(revenueByKindValues).reduce((sum, value) => sum + value, 0);
  const revenueByKind = Object.entries(revenueByKindValues)
    .map(([kind, value], index) => ({
      color: planColors[index % planColors.length],
      label: kindLabels[kind] ?? kind,
      percent: percentOf(value, revenueTotal),
      value,
    }))
    .sort((a, b) => b.value - a.value);

  const cycleValues = activeSubscriptions.reduce<Record<string, number>>((totals, subscription) => {
    const plan = plansById.get(subscription.plan_id);
    const key = plan?.billing_interval === "yearly" ? "Anual" : "Mensal";
    return { ...totals, [key]: (totals[key] ?? 0) + monthlySubscriptionAmount(subscription, plansById) };
  }, {});
  const cycleTotal = Object.values(cycleValues).reduce((sum, value) => sum + value, 0);
  const cycleDistribution = Object.entries(cycleValues).map(([label, value], index) => ({
    color: planColors[index % planColors.length],
    label,
    percent: percentOf(value, cycleTotal),
    value,
  }));

  const recentRows = raw.subscriptions
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)
    .map((subscription) => {
      const plan = plansById.get(subscription.plan_id);
      const partner = partnerLabel(subscription.partner_id, partnersById, profilesById);
      const payment = latestPaymentBySubscription.get(subscription.id);
      return {
        amount: formatCurrencyCents(monthlySubscriptionAmount(subscription, plansById)),
        dateLabel: formatDate(subscription.current_period_end),
        email: partner.email,
        id: subscription.id,
        method: paymentMethod(subscription, payment),
        name: partner.name,
        plan: plan?.name ?? "Sem plano",
        ...statusLabel(subscription.status),
      };
    });

  const renewalRows = activeSubscriptions
    .filter((subscription) => {
      const periodEnd = parseDate(subscription.current_period_end);
      return Boolean(periodEnd && periodEnd >= now && periodEnd <= nextThirtyDays && currentCommercialStatuses.has(subscription.status));
    })
    .sort((a, b) => new Date(a.current_period_end).getTime() - new Date(b.current_period_end).getTime())
    .slice(0, 5)
    .map((subscription) => {
      const plan = plansById.get(subscription.plan_id);
      const partner = partnerLabel(subscription.partner_id, partnersById, profilesById);
      return {
        amount: formatCurrencyCents(monthlySubscriptionAmount(subscription, plansById), 2),
        dateLabel: formatDate(subscription.current_period_end),
        email: partner.email,
        id: subscription.id,
        name: partner.name,
        plan: plan?.name ?? "Sem plano",
      };
    });

  return {
    churnMrrCents: churnMrr,
    cycleDistribution,
    generatedAt: now.toISOString(),
    kpis: [
      { delta: formatDelta(mrr, previousMrr), description: "Receita recorrente mensal", id: "mrr", label: "MRR", trend: mrr >= previousMrr ? "good" : "bad", value: formatCurrencyCents(mrr) },
      { delta: formatDelta(arr, previousArr), description: "Receita recorrente anual", id: "arr", label: "ARR", trend: arr >= previousArr ? "good" : "bad", value: formatCurrencyCents(arr) },
      { delta: formatDelta(activeSubscriptions.length, previousActiveSubscriptions.length), description: "Profissionais com assinatura ativa", id: "activeSubscriptions", label: "Assinaturas ativas", trend: activeSubscriptions.length >= previousActiveSubscriptions.length ? "good" : "bad", value: formatInteger(activeSubscriptions.length) },
      { delta: formatDelta(churn, previousChurn, "p.p."), description: "Taxa de cancelamento mensal", id: "churn", label: "Churn mensal", trend: churn <= previousChurn ? "good" : "bad", value: formatPercent(churn) },
      { delta: formatDelta(delinquency, previousDelinquency, "p.p."), description: "Cobranças vencidas ou falhas", id: "delinquency", label: "Inadimplência", trend: delinquency <= previousDelinquency ? "good" : "bad", value: formatPercent(delinquency) },
      { delta: formatDelta(ltv, previousLtv), description: "Valor médio em 12 meses", id: "ltv", label: "LTV médio", trend: ltv >= previousLtv ? "good" : "bad", value: formatCurrencyCents(ltv, 2) },
    ],
    newMrrCents: newMrr,
    periodLabel: periodLabel(currentStart, currentEnd),
    planDistribution,
    recentRows,
    reductionMrrCents: reductionMrr,
    renewalRows,
    revenueByKind,
    revenueTrend,
  };
}

export { monthlyizePlanPrice };
