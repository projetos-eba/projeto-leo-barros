export type PartnerClientListRow = {
  age_years: number | null;
  display_name: string;
  email: string;
  last_update_at: string;
  objective: string | null;
  patient_id: string;
  phone: string | null;
  profile_id: string;
  relationship_status: string;
  service_scopes: string[] | null;
  started_at: string;
};

export type PartnerClientPlan = {
  billing_interval: string;
  id: string;
  is_active: boolean;
  name: string;
  partner_id: string;
  price_cents: number;
};

export type PartnerClientPlanSubscription = {
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  current_period_end: string;
  current_period_start: string;
  custom_plan_id: string;
  id: string;
  partner_id: string;
  patient_id: string;
  status: string;
};

export type PartnerClientServicePlan = {
  billing_interval: string;
  duration_cycles: number;
  id: string;
  includes_diet: boolean;
  includes_training: boolean;
  name: string;
  price_cents: number;
  status: string;
};

export type PartnerClientsRawData = {
  clientPlanSubscriptions: PartnerClientPlanSubscription[];
  customPlans: PartnerClientPlan[];
  rows: PartnerClientListRow[];
  servicePlans?: PartnerClientServicePlan[];
};

export type PartnerClientStatus = "active" | "pending" | "suspended" | "inactive";

export type PartnerClientRow = {
  ageLabel: string;
  email: string;
  id: string;
  initial: string;
  lastUpdateLabel: string;
  name: string;
  objectiveLabel: string;
  phoneLabel: string;
  planNames: string[];
  planSummaryLabel: string;
  renewalDateLabel: string;
  renewalLabel: string;
  renewalTone: "blue" | "green" | "amber" | "red" | "slate";
  searchText: string;
  serviceScopeLabel: string;
  serviceScopes: string[];
  startedAtLabel: string;
  status: PartnerClientStatus;
  statusLabel: string;
};

export type PartnerClientsData = {
  activeCount: number;
  generatedAt: string;
  rows: PartnerClientRow[];
  servicePlans: PartnerClientServicePlan[];
  tabCounts: Record<"all" | PartnerClientStatus, number>;
  totalCount: number;
};

const activePlanStatuses = new Set(["active", "past_due"]);
const openPlanStatuses = new Set(["pending", "active", "past_due"]);

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatShortDateTime(value: string, now: Date) {
  const date = new Date(value);
  const sameDay = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (sameDay) return `Hoje, ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Ontem, ${time}`;
  return formatDate(value);
}

function scopeLabel(scope: string) {
  const labels: Record<string, string> = {
    dieta: "Dieta",
    saude: "Saúde",
    treino: "Treino",
  };

  const normalizedScope = scope === "cardio" ? "treino" : scope;
  return labels[normalizedScope] ?? normalizedScope;
}

function statusLabel(status: PartnerClientStatus) {
  const labels: Record<PartnerClientStatus, string> = {
    active: "Ativo",
    inactive: "Inativo",
    pending: "Pendente",
    suspended: "Suspenso",
  };

  return labels[status];
}

function normalizeStatus(value: string): PartnerClientStatus {
  if (value === "active" || value === "pending" || value === "suspended") {
    return value;
  }

  return "inactive";
}

function daysUntilLabel(target: Date, now: Date) {
  const days = Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)} dias em atraso`;
  if (days === 0) return "Hoje";
  if (days === 1) return "1 dia";
  return `${days} dias`;
}

function renewalTone(target: Date | null, cancelAtPeriodEnd: boolean, now: Date): PartnerClientRow["renewalTone"] {
  if (!target) return "slate";
  if (cancelAtPeriodEnd) return "amber";
  if (target < now) return "red";
  if (target.getTime() <= now.getTime() + 15 * 86_400_000) return "amber";
  return "green";
}

function serviceScopeSummary(scopes: string[]) {
  if (scopes.length === 0) return "Sem escopo";
  if (scopes.length === 1) return scopeLabel(scopes[0]);
  return scopes.map(scopeLabel).join(" + ");
}

function planSummary(plans: string[]) {
  if (plans.length === 0) return "Sem plano";
  if (plans.length === 1) return plans[0];
  return `${plans[0]} +${plans.length - 1}`;
}

export function buildPartnerClientsData(raw: PartnerClientsRawData, now = new Date()): PartnerClientsData {
  const servicePlans = (raw.servicePlans ?? []).filter((plan) => plan.status === "active");
  const plansById = new Map(raw.customPlans.map((plan) => [plan.id, plan]));
  const subscriptionsByPatientId = new Map<string, PartnerClientPlanSubscription[]>();

  raw.clientPlanSubscriptions.forEach((subscription) => {
    if (!openPlanStatuses.has(subscription.status)) return;
    subscriptionsByPatientId.set(subscription.patient_id, [
      ...(subscriptionsByPatientId.get(subscription.patient_id) ?? []),
      subscription,
    ]);
  });

  const rows = raw.rows
    .map((row) => {
      const status = normalizeStatus(row.relationship_status);
      const scopes = Array.from(
        new Set((row.service_scopes ?? []).map((scope) => (scope === "cardio" ? "treino" : scope))),
      ).sort();
      const subscriptions = subscriptionsByPatientId.get(row.patient_id) ?? [];
      const activeSubscriptions = subscriptions.filter((subscription) => activePlanStatuses.has(subscription.status));
      const planNames = Array.from(
        new Set(
          activeSubscriptions
            .map((subscription) => plansById.get(subscription.custom_plan_id)?.name)
            .filter((name): name is string => Boolean(name)),
        ),
      );
      const nextRenewal = [...activeSubscriptions].sort(
        (left, right) => new Date(left.current_period_end).getTime() - new Date(right.current_period_end).getTime(),
      )[0];
      const renewalDate = nextRenewal ? new Date(nextRenewal.current_period_end) : null;
      const objectiveLabel = row.objective?.trim() || serviceScopeSummary(scopes);
      const phoneLabel = row.phone?.trim() || "Sem telefone";
      const ageLabel = row.age_years ? `${row.age_years} anos` : "Sem idade";
      const renewalLabel = renewalDate ? daysUntilLabel(renewalDate, now) : "Sem renovação";
      const renewalDateLabel = renewalDate ? formatDate(nextRenewal.current_period_end) : "Sem plano ativo";
      const planSummaryLabel = planSummary(planNames);

      return {
        ageLabel,
        email: row.email,
        id: row.patient_id,
        initial: row.display_name.trim().charAt(0).toUpperCase() || "C",
        lastUpdateLabel: formatShortDateTime(row.last_update_at, now),
        name: row.display_name,
        objectiveLabel,
        phoneLabel,
        planNames,
        planSummaryLabel,
        renewalDateLabel,
        renewalLabel,
        renewalTone: renewalTone(renewalDate, Boolean(nextRenewal?.cancel_at_period_end), now),
        searchText: [
          row.display_name,
          row.email,
          phoneLabel,
          objectiveLabel,
          serviceScopeSummary(scopes),
          planSummaryLabel,
          statusLabel(status),
        ].join(" ").toLowerCase(),
        serviceScopeLabel: serviceScopeSummary(scopes),
        serviceScopes: scopes,
        startedAtLabel: formatDate(row.started_at),
        status,
        statusLabel: statusLabel(status),
      } satisfies PartnerClientRow;
    })
    .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));

  const tabCounts = {
    active: rows.filter((row) => row.status === "active").length,
    all: rows.length,
    inactive: rows.filter((row) => row.status === "inactive").length,
    pending: rows.filter((row) => row.status === "pending").length,
    suspended: rows.filter((row) => row.status === "suspended").length,
  };

  return {
    activeCount: tabCounts.active,
    generatedAt: now.toISOString(),
    rows,
    servicePlans,
    tabCounts,
    totalCount: rows.length,
  };
}
