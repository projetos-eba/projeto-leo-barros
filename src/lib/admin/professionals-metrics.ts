import {
  effectiveProfessionalStatus,
  isSubscriptionActiveAt,
  isSubscriptionCurrentAt,
  latestSubscriptionForPartner,
} from "./professional-status";

export type ProfessionalProfile = {
  created_at: string;
  display_name: string;
  email: string;
  id: string;
  phone: string | null;
  role: string;
  status: string;
  updated_at: string;
};

export type ProfessionalRecord = {
  created_at: string;
  id: string;
  professional_name: string;
  professional_registry_number: string | null;
  professional_registry_type: string | null;
  professional_type: string;
  profile_id: string;
};

export type ProfessionalSubscription = {
  canceled_at: string | null;
  created_at: string;
  current_period_end: string;
  current_period_start: string;
  id: string;
  partner_id: string;
  plan_id: string;
  status: string;
};

export type ProfessionalPlan = {
  billing_interval: string;
  currency: string;
  id: string;
  name: string;
  price_cents: number;
  slug: string;
};

export type ProfessionalPayment = {
  amount_cents: number;
  due_at: string;
  id: string;
  paid_at: string | null;
  partner_id: string;
  payment_kind: string;
  status: string;
  subscription_id: string;
};

export type ProfessionalClientLink = {
  created_at: string;
  ended_at: string | null;
  partner_id: string;
  patient_id: string;
  started_at: string;
  status: string;
};

export type AdminProfessionalsRawData = {
  payments: ProfessionalPayment[];
  plans: ProfessionalPlan[];
  profiles: ProfessionalProfile[];
  professionals: ProfessionalRecord[];
  relationships: ProfessionalClientLink[];
  subscriptions: ProfessionalSubscription[];
};

export type ProfessionalKpi = {
  delta: string;
  id: "active" | "activeSubscriptions" | "averageRevenue";
  label: string;
  tone: "blue" | "green" | "purple";
  trend: "good" | "bad" | "neutral";
  value: string;
};

export type ProfessionalRow = {
  clientsCount: number;
  email: string;
  id: string;
  initial: string;
  lastAccessLabel: string;
  name: string;
  planLabel: string;
  profileStatusLabel: string;
  revenueBaseCents: number;
  specialtyLabel: string;
  statusLabel: string;
  statusTone: "active" | "inactive" | "suspended";
  subscriptionDateLabel: string;
  subscriptionLabel: string;
  subscriptionTone: "active" | "inactive" | "suspended";
};

export type ProfessionalBottomMetric = {
  delta: string;
  id: "newProfessionals" | "suspendedProfessionals" | "nps" | "churn";
  label: string;
  note?: string;
  tone: "blue" | "green" | "purple" | "red";
  trend: "good" | "bad" | "neutral";
  value: string;
};

export type ProfessionalSubscriptionItem = {
  date: string;
  email: string;
  id: string;
  initial: string;
  name: string;
  plan: string;
  status: string;
  statusTone: "active" | "inactive" | "suspended";
};

export type ProfessionalDistributionSlice = {
  color: string;
  count: number;
  label: string;
  value: number;
};

export type ProfessionalStatusSlice = {
  color: string;
  count: number;
  label: string;
  value: number;
};

export type AdminProfessionalsData = {
  bottomMetrics: ProfessionalBottomMetric[];
  generatedAt: string;
  kpis: ProfessionalKpi[];
  professionals: ProfessionalRow[];
  recentSubscriptions: ProfessionalSubscriptionItem[];
  specialtyDistribution: ProfessionalDistributionSlice[];
  statusDistribution: ProfessionalStatusSlice[];
  tabCounts: {
    active: number;
    all: number;
    inactive: number;
    suspended: number;
  };
};

const specialtyColors = ["#138eff", "#13c4c5", "#8c3bff", "#f04d69", "#e843b8", "#8998a4"];
const statusColors = ["#60c348", "#f0a52b", "#8998a4"];

function parseDate(value: string | null) {
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

function formatCurrencyCents(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value / 100);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;
}

function formatDelta(current: number, previous: number, suffix = "%") {
  if (previous === 0 && current === 0) return "0%";
  if (previous === 0) return suffix === "p.p." ? "+100 p.p." : "+100%";

  const raw = suffix === "p.p." ? current - previous : ((current - previous) / previous) * 100;
  const sign = raw > 0 ? "+" : "";
  const formatted = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(raw);
  return `${sign}${formatted}${suffix === "p.p." ? " p.p." : "%"}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function professionalTypeLabel(value: string) {
  const labels: Record<string, string> = {
    medico: "Medicina",
    nutricionista: "Nutrição",
    personal_trainer: "Educação Física",
  };

  return labels[value] ?? "Outros";
}

function statusLabel(value: string): Pick<ProfessionalRow, "statusLabel" | "statusTone"> {
  if (value === "active") return { statusLabel: "Ativo", statusTone: "active" };
  if (value === "suspended") return { statusLabel: "Suspenso", statusTone: "suspended" };
  return { statusLabel: "Inativo", statusTone: "inactive" };
}

function subscriptionState(
  subscription: ProfessionalSubscription | undefined,
  now: Date,
): Pick<ProfessionalRow, "subscriptionLabel" | "subscriptionTone"> {
  if (!subscription) return { subscriptionLabel: "Sem assinatura", subscriptionTone: "inactive" };
  if (isSubscriptionActiveAt(subscription, now)) {
    return { subscriptionLabel: subscription.status === "trialing" ? "Teste ativo" : "Ativa", subscriptionTone: "active" };
  }
  if (isSubscriptionCurrentAt(subscription, now) && (subscription.status === "past_due" || subscription.status === "incomplete")) {
    return { subscriptionLabel: "Pagamento pendente", subscriptionTone: "suspended" };
  }
  return { subscriptionLabel: "Cancelada", subscriptionTone: "inactive" };
}

function monthlyizePlanPrice(plan: ProfessionalPlan | undefined) {
  if (!plan) return 0;
  return plan.billing_interval === "yearly" ? Math.round(plan.price_cents / 12) : plan.price_cents;
}

function churnRate(subscriptions: ProfessionalSubscription[], start: Date, end: Date) {
  const canceled = subscriptions.filter((subscription) => isWithin(parseDate(subscription.canceled_at), start, end)).length;
  const activeAtStart = subscriptions.filter((subscription) => isSubscriptionActiveAt(subscription, start)).length;
  return activeAtStart === 0 ? 0 : (canceled / activeAtStart) * 100;
}

function distribution<T extends string>(
  values: T[],
  colorList: string[],
  labelForValue: (value: T) => string,
) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(labelForValue(value), (counts.get(labelForValue(value)) ?? 0) + 1));
  const total = values.length;

  return Array.from(counts.entries())
    .sort(([, left], [, right]) => right - left)
    .map(([label, count], index) => ({
      color: colorList[index % colorList.length],
      count,
      label,
      value: total === 0 ? 0 : Number(((count / total) * 100).toFixed(1)),
    }));
}

function effectiveStatus(
  profileStatus: string | undefined,
  subscription: ProfessionalSubscription | undefined,
  now: Date,
): Pick<ProfessionalRow, "statusLabel" | "statusTone"> {
  return statusLabel(effectiveProfessionalStatus(profileStatus, subscription, now));
}

export function buildAdminProfessionalsData(raw: AdminProfessionalsRawData, now = new Date()): AdminProfessionalsData {
  const currentStart = startOfMonth(now);
  const currentEnd = endOfMonth(now);
  const previousStart = addMonths(currentStart, -1);
  const previousEnd = new Date(currentStart.getTime() - 1);
  const profilesById = new Map(raw.profiles.map((profile) => [profile.id, profile]));
  const subscriptionsByPartnerId = new Map<string, ProfessionalSubscription[]>();
  const plansById = new Map(raw.plans.map((plan) => [plan.id, plan]));

  raw.subscriptions.forEach((subscription) => {
    subscriptionsByPartnerId.set(subscription.partner_id, [...(subscriptionsByPartnerId.get(subscription.partner_id) ?? []), subscription]);
  });

  const activeSubscriptions = raw.subscriptions.filter((subscription) => isSubscriptionActiveAt(subscription, now));
  const previousActiveSubscriptions = raw.subscriptions.filter((subscription) => isSubscriptionActiveAt(subscription, previousEnd));
  const mrr = activeSubscriptions.reduce((sum, subscription) => sum + monthlyizePlanPrice(plansById.get(subscription.plan_id)), 0);
  const previousMrr = previousActiveSubscriptions.reduce((sum, subscription) => sum + monthlyizePlanPrice(plansById.get(subscription.plan_id)), 0);
  const newProfessionals = raw.profiles.filter((profile) => isWithin(parseDate(profile.created_at), currentStart, currentEnd));
  const previousNewProfessionals = raw.profiles.filter((profile) => isWithin(parseDate(profile.created_at), previousStart, previousEnd));
  const churn = churnRate(raw.subscriptions, currentStart, currentEnd);
  const previousChurn = churnRate(raw.subscriptions, previousStart, previousEnd);

  const professionals = raw.professionals.map((professional) => {
    const profile = profilesById.get(professional.profile_id);
    const subscriptions = subscriptionsByPartnerId.get(professional.id) ?? [];
    const currentSubscription = latestSubscriptionForPartner(subscriptions, now);
    const plan = currentSubscription ? plansById.get(currentSubscription.plan_id) : undefined;
    const currentMonthlyRevenue = currentSubscription && isSubscriptionActiveAt(currentSubscription, now)
      ? monthlyizePlanPrice(plan)
      : 0;
    const clientsCount = new Set(
      raw.relationships
        .filter((relationship) => relationship.partner_id === professional.id && relationship.status === "active")
        .map((relationship) => relationship.patient_id),
    ).size;
    const displayName = profile?.display_name ?? professional.professional_name;
    const effective = effectiveStatus(profile?.status, currentSubscription, now);
    const subscription = subscriptionState(currentSubscription, now);

    return {
      clientsCount,
      email: profile?.email ?? "sem-email@example.invalid",
      id: professional.id,
      initial: displayName.charAt(0).toUpperCase(),
      lastAccessLabel: "Sem registro",
      name: displayName,
      planLabel: plan?.name ?? "Sem plano",
      profileStatusLabel: statusLabel(profile?.status ?? "disabled").statusLabel,
      revenueBaseCents: currentMonthlyRevenue,
      specialtyLabel: professionalTypeLabel(professional.professional_type),
      subscriptionDateLabel: currentSubscription ? formatDate(currentSubscription.created_at) : "Sem registro",
      ...effective,
      ...subscription,
    };
  });

  const activeProfessionals = professionals.filter((professional) => professional.statusTone === "active");
  const suspendedProfessionals = professionals.filter((professional) => professional.statusTone === "suspended");
  const inactiveProfessionals = professionals.filter((professional) => professional.statusTone === "inactive");
  const previousActiveProfiles = raw.profiles.filter((profile) => parseDate(profile.created_at)! <= previousEnd && profile.status === "active");
  const previousSuspendedProfiles = raw.profiles.filter((profile) => parseDate(profile.created_at)! <= previousEnd && profile.status === "suspended");
  const averageRevenue = activeProfessionals.length === 0 ? 0 : Math.round(mrr / activeProfessionals.length);
  const previousAverageRevenue = previousActiveProfiles.length === 0 ? 0 : Math.round(previousMrr / previousActiveProfiles.length);

  const recentSubscriptions = raw.subscriptions
    .slice()
    .sort((left, right) => parseDate(right.created_at)!.getTime() - parseDate(left.created_at)!.getTime())
    .slice(0, 5)
    .map((subscription) => {
      const professional = raw.professionals.find((item) => item.id === subscription.partner_id);
      const profile = professional ? profilesById.get(professional.profile_id) : undefined;
      const displayName = profile?.display_name ?? professional?.professional_name ?? "Profissional";
      const plan = plansById.get(subscription.plan_id);
      const state = subscriptionState(subscription, now);

      return {
        date: formatDate(subscription.created_at),
        email: profile?.email ?? "sem-email@example.invalid",
        id: subscription.id,
        initial: displayName.charAt(0).toUpperCase(),
        name: displayName,
        plan: plan?.name ?? "Sem plano",
        status: state.subscriptionLabel,
        statusTone: state.subscriptionTone,
      };
    });

  const statusDistribution = distribution(
    professionals.map((professional) => professional.statusLabel),
    statusColors,
    (value) => value,
  );

  const specialtyDistribution = distribution(
    raw.professionals.map((professional) => professional.professional_type),
    specialtyColors,
    professionalTypeLabel,
  );

  return {
    bottomMetrics: [
      {
        delta: formatDelta(newProfessionals.length, previousNewProfessionals.length),
        id: "newProfessionals",
        label: "Novos profissionais no mês",
        tone: "blue",
        trend: "good",
        value: formatInteger(newProfessionals.length),
      },
      {
        delta: formatDelta(suspendedProfessionals.length, previousSuspendedProfiles.length),
        id: "suspendedProfessionals",
        label: "Profissionais suspensos",
        tone: "red",
        trend: suspendedProfessionals.length <= previousSuspendedProfiles.length ? "good" : "bad",
        value: formatInteger(suspendedProfessionals.length),
      },
      {
        delta: "sem histórico",
        id: "nps",
        label: "NPS dos profissionais",
        note: "Aguardando coleta",
        tone: "purple",
        trend: "neutral",
        value: "Sem dados",
      },
      {
        delta: formatDelta(churn, previousChurn, "p.p."),
        id: "churn",
        label: "Churn de profissionais",
        tone: "green",
        trend: churn <= previousChurn ? "good" : "bad",
        value: formatPercent(churn),
      },
    ],
    generatedAt: now.toISOString(),
    kpis: [
      {
        delta: formatDelta(activeProfessionals.length, previousActiveProfiles.length),
        id: "active",
        label: "Profissionais ativos",
        tone: "blue",
        trend: "good",
        value: formatInteger(activeProfessionals.length),
      },
      {
        delta: formatDelta(activeSubscriptions.length, previousActiveSubscriptions.length),
        id: "activeSubscriptions",
        label: "Assinaturas ativas",
        tone: "green",
        trend: "good",
        value: formatInteger(activeSubscriptions.length),
      },
      {
        delta: formatDelta(averageRevenue, previousAverageRevenue),
        id: "averageRevenue",
        label: "Receita média por profissional",
        tone: "purple",
        trend: averageRevenue >= previousAverageRevenue ? "good" : "bad",
        value: formatCurrencyCents(averageRevenue),
      },
    ],
    professionals,
    recentSubscriptions,
    specialtyDistribution,
    statusDistribution,
    tabCounts: {
      active: activeProfessionals.length,
      all: professionals.length,
      inactive: inactiveProfessionals.length,
      suspended: suspendedProfessionals.length,
    },
  };
}
