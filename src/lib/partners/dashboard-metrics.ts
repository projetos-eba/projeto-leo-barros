export type PartnerProfile = {
  display_name: string;
  email: string;
  id: string;
  status: string;
};

export type PartnerRecord = {
  created_at: string;
  id: string;
  professional_name: string;
  professional_type: string;
  profile_id: string;
};

export type PartnerClientLink = {
  created_at: string;
  ended_at: string | null;
  id: string;
  partner_id: string;
  patient_id: string;
  service_scope: string;
  started_at: string;
  status: string;
};

export type PlatformPlan = {
  billing_interval: string;
  id: string;
  name: string;
  price_cents: number;
};

export type PlatformSubscription = {
  canceled_at: string | null;
  created_at: string;
  current_period_end: string;
  current_period_start: string;
  id: string;
  partner_id: string;
  plan_id: string;
  status: string;
};

export type PartnerCustomPlan = {
  billing_interval: string;
  currency: string;
  id: string;
  is_active: boolean;
  name: string;
  partner_id: string;
  price_cents: number;
};

export type ClientPlanSubscription = {
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

export type PartnerSupportTicket = {
  created_at: string;
  id: string;
  priority: string;
  resolved_at: string | null;
  sla_due_at: string;
  status: string;
  subject: string;
  ticket_number: string;
};

export type PartnerDocument = {
  created_at: string;
  document_type: string;
  id: string;
  status: string;
  title: string;
};

export type PartnerActivityEvent = {
  created_at: string;
  detail: string;
  event_type: string;
  id: string;
  title: string;
};

export type PartnerManualReceivable = {
  amount_cents: number;
  due_date: string;
  paid_at: string | null;
  status: string;
};

export type PartnerDashboardRawData = {
  clientPlanSubscriptions: ClientPlanSubscription[];
  customPlans: PartnerCustomPlan[];
  documents: PartnerDocument[];
  events: PartnerActivityEvent[];
  partner: PartnerRecord | null;
  partnerClients: PartnerClientLink[];
  manualReceivables?: PartnerManualReceivable[];
  platformPlans: PlatformPlan[];
  platformSubscriptions: PlatformSubscription[];
  profile: PartnerProfile | null;
  tickets: PartnerSupportTicket[];
};

export type PartnerDashboardKpi = {
  delta: string;
  description: string;
  id: "activeClients" | "newClients" | "forecastMrr" | "renewalsNext30" | "openTickets";
  label: string;
  tone: "blue" | "green" | "amber" | "red" | "slate";
  trend: "good" | "bad" | "neutral";
  value: string;
};

export type PartnerDashboardGrowthPoint = {
  activeClients: number;
  adherenceRate: number;
  adherenceTarget: number;
  adherentClients: number;
  forecastMrrCents: number;
  inactiveClients: number;
  label: string;
  monthlyRevenueCents: number;
  month: string;
  newClients: number;
};

export type PartnerPlanSlice = {
  color: string;
  count: number;
  label: string;
  value: number;
};

export type PartnerPlanRow = {
  activeSubscriptions: number;
  intervalLabel: string;
  monthlyRevenue: string;
  name: string;
  renewalsNext30: number;
};

export type PartnerRenewalRow = {
  amount: string;
  clientLabel: string;
  dueInLabel?: string;
  dueLabel: string;
  id: string;
  planName: string;
  status: "A renovar" | "Atrasada" | "Encerramento programado";
};

export type PartnerAlert = {
  body: string;
  id: string;
  title: string;
  tone: "success" | "warning" | "danger" | "info";
};

export type PartnerMovement = {
  detail: string;
  id: string;
  time: string;
  title: string;
  tone: "blue" | "green" | "amber" | "red" | "purple";
};

export type PartnerSummaryMetric = {
  delta?: string;
  description: string;
  id:
    | "activeClients"
    | "pendingUpdates"
    | "inactiveClients"
    | "renewalsNext30"
    | "forecastMrr"
    | "clinicalAlerts";
  label: string;
  subtext?: string;
  tone: "blue" | "green" | "amber" | "red" | "slate";
  trend?: "good" | "bad" | "neutral";
  value: string;
};

export type PartnerAdherenceMetric = {
  description: string;
  id: "planCoverage" | "renewalHealth";
  label: string;
  tone: "blue" | "green";
  value: number;
};

export type PartnerPerformanceMetric = {
  chartKey: "adherenceRate" | "adherentClients" | "monthlyRevenueCents";
  description: string;
  icon: "activity" | "dollar" | "users";
  id: "adherenceRate" | "adherentClients" | "adherenceTarget";
  label: string;
  unit: "currency" | "number" | "percent";
  value: string;
};

export type PartnerObjectiveDistributionItem = {
  color: string;
  count: number;
  label: string;
  value: number;
};

export type PartnerPendingUpdateRow = {
  actionLabel: string;
  clientLabel: string;
  daysLateLabel: string;
  id: string;
  lastUpdateLabel: string;
  objective: string;
};

export type PartnerAgendaItem = {
  id: string;
  subtitle: string;
  time: string;
  title: string;
  tone: "blue" | "green" | "amber" | "red";
};

export type PartnerDashboardData = {
  adherence: PartnerAdherenceMetric[];
  alerts: PartnerAlert[];
  generatedAt: string;
  growth: PartnerDashboardGrowthPoint[];
  kpis: PartnerDashboardKpi[];
  movements: PartnerMovement[];
  objectiveDistribution: PartnerObjectiveDistributionItem[];
  partnerName: string;
  pendingUpdates: PartnerPendingUpdateRow[];
  performanceMetrics: PartnerPerformanceMetric[];
  periodLabel: string;
  planDistribution: PartnerPlanSlice[];
  planRows: PartnerPlanRow[];
  platformPlanLabel: string;
  renewals: PartnerRenewalRow[];
  summaryMetrics: PartnerSummaryMetric[];
  todayAgenda: PartnerAgendaItem[];
};

const activeRelationshipStatuses = new Set(["active"]);
const openTicketStatuses = new Set(["open", "in_progress"]);
const pendingDocumentStatuses = new Set(["pending", "in_review", "expired"]);
const activeClientPlanStatuses = new Set(["active"]);
const billableClientPlanStatuses = new Set(["active", "past_due"]);
const openClientPlanStatuses = new Set(["pending", "active", "past_due"]);
const planColors = ["#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#64748b"];
const objectiveColors = ["#3b82f6", "#7c6cff", "#bf5af2", "#21d29b", "#f4a51c", "#68afe9"];
const adherenceTarget = 80;

function parseDate(value: string | null) {
  return value ? new Date(value) : null;
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000);
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

function formatPercent(value: number) {
  return `${formatInteger(value)}%`;
}

function formatCurrencyCents(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value / 100);
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

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(value));
}

function formatMonthLabel(date: Date) {
  const label = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC", year: "2-digit" }).format(date);
  return label.replace(".", "").replace(" de ", "/");
}

function formatRelativeTime(value: string, now: Date) {
  const date = new Date(value);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffHours < 1) return "Agora há pouco";
  if (diffHours < 24) return `Há ${diffHours}h`;
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `Há ${diffDays} dias`;
  return formatDate(value);
}

function periodLabel(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
  return `${formatter.format(start)} - ${formatter.format(end)}`.replaceAll(".", "");
}

function intervalLabel(interval: string) {
  const labels: Record<string, string> = {
    monthly: "Mensal",
    quarterly: "Trimestral",
    yearly: "Anual",
  };

  return labels[interval] ?? interval;
}

export function monthlyizeCustomPlanPrice(plan: PartnerCustomPlan | undefined) {
  if (!plan) return 0;
  if (plan.billing_interval === "yearly") return Math.round(plan.price_cents / 12);
  if (plan.billing_interval === "quarterly") return Math.round(plan.price_cents / 3);
  return plan.price_cents;
}

function isActiveRelationshipAt(relationship: PartnerClientLink, at: Date) {
  const startedAt = parseDate(relationship.started_at);
  const endedAt = parseDate(relationship.ended_at);

  return (
    activeRelationshipStatuses.has(relationship.status) &&
    Boolean(startedAt && startedAt <= at) &&
    (!endedAt || endedAt > at)
  );
}

function activeClientIdsAt(relationships: PartnerClientLink[], at: Date) {
  return new Set(
    relationships
      .filter((relationship) => isActiveRelationshipAt(relationship, at))
      .map((relationship) => relationship.patient_id),
  );
}

function knownClientIdsAt(relationships: PartnerClientLink[], at: Date) {
  return new Set(
    relationships
      .filter((relationship) => {
        const startedAt = parseDate(relationship.started_at);
        return Boolean(startedAt && startedAt <= at);
      })
      .map((relationship) => relationship.patient_id),
  );
}

function newClientIdsWithin(relationships: PartnerClientLink[], start: Date, end: Date) {
  return new Set(
    relationships
      .filter((relationship) => relationship.status === "active" && isWithin(parseDate(relationship.started_at), start, end))
      .map((relationship) => relationship.patient_id),
  );
}

function isClientSubscriptionOpenAt(subscription: ClientPlanSubscription, at: Date) {
  const startsAt = parseDate(subscription.current_period_start);
  const canceledAt = parseDate(subscription.canceled_at);

  return (
    openClientPlanStatuses.has(subscription.status) &&
    Boolean(startsAt && startsAt <= at) &&
    (!canceledAt || canceledAt > at)
  );
}

function isClientSubscriptionCurrentAt(subscription: ClientPlanSubscription, at: Date) {
  const startsAt = parseDate(subscription.current_period_start);
  const endsAt = parseDate(subscription.current_period_end);
  const canceledAt = parseDate(subscription.canceled_at);

  return (
    activeClientPlanStatuses.has(subscription.status) &&
    Boolean(startsAt && endsAt && startsAt <= at && endsAt >= at) &&
    (!canceledAt || canceledAt > at)
  );
}

function activePlanPatientIdsAt(subscriptions: ClientPlanSubscription[], at: Date) {
  return new Set(
    subscriptions
      .filter((subscription) => isClientSubscriptionCurrentAt(subscription, at))
      .map((subscription) => subscription.patient_id),
  );
}

function subscriptionRevenueAt(
  subscriptions: ClientPlanSubscription[],
  plansById: Map<string, PartnerCustomPlan>,
  at: Date,
) {
  return subscriptions
    .filter((subscription) => isClientSubscriptionOpenAt(subscription, at) && billableClientPlanStatuses.has(subscription.status))
    .reduce((sum, subscription) => sum + monthlyizeCustomPlanPrice(plansById.get(subscription.custom_plan_id)), 0);
}

function eventTone(eventType: string): PartnerMovement["tone"] {
  if (eventType.includes("failed") || eventType.includes("canceled")) return "red";
  if (eventType.includes("ticket")) return "purple";
  if (eventType.includes("document")) return "amber";
  if (eventType.includes("payment") || eventType.includes("subscription")) return "green";
  return "blue";
}

function clientLabel(patientId: string) {
  return `Cliente ${patientId.slice(0, 8)}`;
}

function normalizeServiceScope(scope: string) {
  return scope === "cardio" ? "treino" : scope;
}

function serviceScopeLabel(scope: string) {
  const labels: Record<string, string> = {
    dieta: "Dieta",
    saude: "Saúde",
    treino: "Treino",
  };

  const normalizedScope = normalizeServiceScope(scope);
  return labels[normalizedScope] ?? normalizedScope;
}

function percentage(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function daysBetween(start: Date, end: Date) {
  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
}

function daysUntilLabel(target: Date, now: Date) {
  const days = Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)} dias em atraso`;
  if (days === 0) return "vence hoje";
  if (days === 1) return "1 dia";
  return `${days} dias`;
}

function platformPlanLabel(raw: PartnerDashboardRawData, now: Date) {
  const currentSubscription = [...raw.platformSubscriptions]
    .filter((subscription) => {
      const startsAt = parseDate(subscription.current_period_start);
      const endsAt = parseDate(subscription.current_period_end);
      return Boolean(startsAt && endsAt && startsAt <= now && endsAt >= now);
    })
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())[0];

  if (!currentSubscription) return "Plano da plataforma não encontrado";

  const plan = raw.platformPlans.find((item) => item.id === currentSubscription.plan_id);
  const statusLabels: Record<string, string> = {
    active: "ativo",
    canceled: "cancelado",
    incomplete: "incompleto",
    past_due: "pendente",
    trialing: "trial",
  };

  return `${plan?.name ?? "Plano"} · ${statusLabels[currentSubscription.status] ?? currentSubscription.status}`;
}

function manualRevenueBetween(receivables: PartnerManualReceivable[] | undefined, start: Date, end: Date) {
  return (receivables ?? []).reduce((total, receivable) => {
    if (receivable.status !== "paid" || !receivable.paid_at) return total;
    const paidAt = parseDate(receivable.paid_at);
    if (!paidAt || paidAt < start || paidAt > end) return total;
    return total + receivable.amount_cents;
  }, 0);
}

export function buildPartnerDashboardData(raw: PartnerDashboardRawData, now = new Date()): PartnerDashboardData {
  const currentStart = startOfMonth(now);
  const currentEnd = endOfMonth(now);
  const previousStart = addMonths(currentStart, -1);
  const previousEnd = new Date(currentStart.getTime() - 1);
  const next30 = addDays(now, 30);
  const plansById = new Map(raw.customPlans.map((plan) => [plan.id, plan]));
  const activeClients = activeClientIdsAt(raw.partnerClients, now);
  const previousActiveClients = activeClientIdsAt(raw.partnerClients, previousEnd);
  const allClientIds = new Set(raw.partnerClients.map((relationship) => relationship.patient_id));
  const inactiveClients = new Set([...allClientIds].filter((clientId) => !activeClients.has(clientId)));
  const newClients = newClientIdsWithin(raw.partnerClients, currentStart, currentEnd);
  const previousNewClients = newClientIdsWithin(raw.partnerClients, previousStart, previousEnd);
  const forecastMrr = subscriptionRevenueAt(raw.clientPlanSubscriptions, plansById, now);
  const previousForecastMrr = subscriptionRevenueAt(raw.clientPlanSubscriptions, plansById, previousEnd);
  const manualRevenueMonth = manualRevenueBetween(raw.manualReceivables, currentStart, currentEnd);
  const previousManualRevenueMonth = manualRevenueBetween(raw.manualReceivables, previousStart, previousEnd);
  const openTickets = raw.tickets.filter((ticket) => openTicketStatuses.has(ticket.status));
  const previousOpenTickets = raw.tickets.filter((ticket) => {
    const createdAt = parseDate(ticket.created_at);
    const resolvedAt = parseDate(ticket.resolved_at);
    return Boolean(createdAt && createdAt <= previousEnd) && (!resolvedAt || resolvedAt > previousEnd);
  });
  const pendingDocuments = raw.documents.filter((document) => pendingDocumentStatuses.has(document.status));
  const dueRenewals = raw.clientPlanSubscriptions.filter((subscription) => {
    const endsAt = parseDate(subscription.current_period_end);
    return (
      activeClientPlanStatuses.has(subscription.status) &&
      Boolean(endsAt && endsAt >= now && endsAt <= next30)
    );
  });
  const overdueSubscriptions = raw.clientPlanSubscriptions.filter((subscription) => {
    const endsAt = parseDate(subscription.current_period_end);
    return billableClientPlanStatuses.has(subscription.status) && Boolean(endsAt && endsAt < now);
  });
  const operationalAlertsCount = overdueSubscriptions.length + pendingDocuments.length + openTickets.length;

  const growth = Array.from({ length: 7 }, (_, index) => {
    const monthStart = addMonths(currentStart, index - 6);
    const monthEnd = endOfMonth(monthStart);
    const monthActiveClients = activeClientIdsAt(raw.partnerClients, monthEnd);
    const monthKnownClients = knownClientIdsAt(raw.partnerClients, monthEnd);
    const monthActivePlanPatientIds = activePlanPatientIdsAt(raw.clientPlanSubscriptions, monthEnd);
    return {
      activeClients: monthActiveClients.size,
      adherenceRate: percentage(monthActivePlanPatientIds.size, monthActiveClients.size),
      adherenceTarget,
      adherentClients: monthActivePlanPatientIds.size,
      forecastMrrCents: subscriptionRevenueAt(raw.clientPlanSubscriptions, plansById, monthEnd),
      inactiveClients: Math.max(0, monthKnownClients.size - monthActiveClients.size),
      label: formatMonthLabel(monthStart),
      monthlyRevenueCents: manualRevenueBetween(raw.manualReceivables, monthStart, monthEnd),
      month: monthStart.toISOString().slice(0, 7),
      newClients: newClientIdsWithin(raw.partnerClients, monthStart, monthEnd).size,
    };
  });

  const activeClientPlanSubscriptions = raw.clientPlanSubscriptions.filter(
    (subscription) => activeClientPlanStatuses.has(subscription.status) && isClientSubscriptionOpenAt(subscription, now),
  );
  const activePlanPatientIds = new Set(activeClientPlanSubscriptions.map((subscription) => subscription.patient_id));
  const healthyRenewalSubscriptions = activeClientPlanSubscriptions.filter((subscription) => {
    const endsAt = parseDate(subscription.current_period_end);
    return Boolean(endsAt && endsAt >= now);
  });

  const planDistribution = raw.customPlans
    .map((plan, index) => {
      const count = activeClientPlanSubscriptions.filter((subscription) => subscription.custom_plan_id === plan.id).length;
      return {
        color: planColors[index % planColors.length],
        count,
        label: plan.name,
        value: count,
      };
    })
    .filter((slice) => slice.count > 0);

  const objectiveDistributionSource =
    planDistribution.length > 0
      ? planDistribution.map((slice) => ({
          count: slice.count,
          label: slice.label,
        }))
      : [...raw.partnerClients.reduce((map, relationship) => {
          if (activeRelationshipStatuses.has(relationship.status)) {
            const scope = normalizeServiceScope(relationship.service_scope);
            map.set(scope, (map.get(scope) ?? 0) + 1);
          }
          return map;
        }, new Map<string, number>()).entries()].map(([scope, count]) => ({
          count,
          label: serviceScopeLabel(scope),
        }));
  const objectiveTotal = objectiveDistributionSource.reduce((sum, item) => sum + item.count, 0);
  const objectiveDistribution = objectiveDistributionSource
    .map((item, index) => ({
      color: objectiveColors[index % objectiveColors.length],
      count: item.count,
      label: item.label,
      value: percentage(item.count, objectiveTotal),
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);

  const adherence: PartnerAdherenceMetric[] = [
    {
      description: "Percentual de clientes ativos que possuem uma assinatura ativa em plano personalizado.",
      id: "planCoverage",
      label: "% de adesão aos planos",
      tone: "blue",
      value: percentage(activePlanPatientIds.size, activeClients.size),
    },
    {
      description: "Percentual de assinaturas ativas que ainda estão dentro do período vigente.",
      id: "renewalHealth",
      label: "% renovações em dia",
      tone: "green",
      value: percentage(healthyRenewalSubscriptions.length, activeClientPlanSubscriptions.length),
    },
  ];

  const planRows = raw.customPlans
    .filter((plan) => plan.is_active)
    .map((plan) => {
      const planSubscriptions = activeClientPlanSubscriptions.filter((subscription) => subscription.custom_plan_id === plan.id);
      const renewalsNext30 = dueRenewals.filter((subscription) => subscription.custom_plan_id === plan.id).length;
      return {
        activeSubscriptions: planSubscriptions.length,
        intervalLabel: intervalLabel(plan.billing_interval),
        monthlyRevenue: formatCurrencyCents(planSubscriptions.length * monthlyizeCustomPlanPrice(plan)),
        name: plan.name,
        renewalsNext30,
      };
    })
    .sort((left, right) => right.activeSubscriptions - left.activeSubscriptions)
    .slice(0, 5);

  const renewals: PartnerRenewalRow[] = raw.clientPlanSubscriptions
    .filter((subscription) => {
      const endsAt = parseDate(subscription.current_period_end);
      return (
        billableClientPlanStatuses.has(subscription.status) &&
        Boolean(endsAt && endsAt <= next30)
      );
    })
    .sort((left, right) => new Date(left.current_period_end).getTime() - new Date(right.current_period_end).getTime())
    .slice(0, 6)
    .map((subscription) => {
      const plan = plansById.get(subscription.custom_plan_id);
      const endsAt = new Date(subscription.current_period_end);
      const status: PartnerRenewalRow["status"] = subscription.cancel_at_period_end
        ? "Encerramento programado"
        : endsAt < now
          ? "Atrasada"
          : "A renovar";

      return {
        amount: formatCurrencyCents(plan?.price_cents ?? 0),
        clientLabel: clientLabel(subscription.patient_id),
        dueInLabel: daysUntilLabel(endsAt, now),
        dueLabel: formatDate(subscription.current_period_end),
        id: subscription.id,
        planName: plan?.name ?? "Plano personalizado",
        status,
      };
    });

  const pendingUpdates: PartnerPendingUpdateRow[] = overdueSubscriptions
    .sort((left, right) => new Date(left.current_period_end).getTime() - new Date(right.current_period_end).getTime())
    .slice(0, 5)
    .map((subscription) => {
      const plan = plansById.get(subscription.custom_plan_id);
      const endsAt = new Date(subscription.current_period_end);
      return {
        actionLabel: subscription.cancel_at_period_end ? "Revisar" : "Atualizar",
        clientLabel: clientLabel(subscription.patient_id),
        daysLateLabel: `${daysBetween(endsAt, now)} dias`,
        id: subscription.id,
        lastUpdateLabel: formatShortDate(subscription.current_period_end),
        objective: plan?.name ?? "Plano personalizado",
      };
    });

  const todayAgenda: PartnerAgendaItem[] = [
    ...dueRenewals.slice(0, 4).map((subscription, index) => {
      const plan = plansById.get(subscription.custom_plan_id);
      return {
        id: `renewal-${subscription.id}`,
        subtitle: plan?.name ?? "Plano personalizado",
        time: index === 0 ? "Hoje" : daysUntilLabel(new Date(subscription.current_period_end), now),
        title: clientLabel(subscription.patient_id),
        tone: subscription.cancel_at_period_end ? "amber" : "blue",
      } satisfies PartnerAgendaItem;
    }),
    ...openTickets.slice(0, 2).map((ticket) => ({
      id: `ticket-${ticket.id}`,
      subtitle: ticket.subject,
      time: "Suporte",
      title: ticket.ticket_number,
      tone: ticket.priority === "high" || ticket.priority === "urgent" ? "red" : "green",
    } satisfies PartnerAgendaItem)),
  ].slice(0, 5);

  const alerts: PartnerAlert[] = [
    overdueSubscriptions.length > 0
      ? {
          body: `${overdueSubscriptions.length} assinatura(s) de cliente passaram da data de renovação.`,
          id: "overdue-renewals",
          title: "Renovações atrasadas",
          tone: "danger",
        }
      : {
          body: "Nenhuma assinatura personalizada vencida neste momento.",
          id: "overdue-renewals",
          title: "Renovações em dia",
          tone: "success",
        },
    dueRenewals.length > 0
      ? {
          body: `${dueRenewals.length} renovação(ões) previstas para os próximos 30 dias.`,
          id: "due-renewals",
          title: "Renovações próximas",
          tone: "warning",
        }
      : {
          body: "Sem renovações críticas nos próximos 30 dias.",
          id: "due-renewals",
          title: "Agenda tranquila",
          tone: "info",
        },
    pendingDocuments.length > 0
      ? {
          body: `${pendingDocuments.length} documento(s) ainda pedem atenção operacional.`,
          id: "documents",
          title: "Documentos pendentes",
          tone: "warning",
        }
      : {
          body: "Documentos operacionais sem pendência registrada.",
          id: "documents",
          title: "Documentos em dia",
          tone: "success",
        },
  ];

  return {
    adherence,
    alerts,
    generatedAt: now.toISOString(),
    growth,
    kpis: [
      {
        delta: formatDelta(activeClients.size, previousActiveClients.size),
        description: "Clientes distintos com vínculo ativo com este parceiro na data atual.",
        id: "activeClients",
        label: "Clientes ativos",
        tone: "blue",
        trend: activeClients.size >= previousActiveClients.size ? "good" : "bad",
        value: formatInteger(activeClients.size),
      },
      {
        delta: formatDelta(newClients.size, previousNewClients.size),
        description: "Clientes distintos cujo vínculo ativo começou no mês atual.",
        id: "newClients",
        label: "Novos clientes",
        tone: "green",
        trend: newClients.size >= previousNewClients.size ? "good" : "bad",
        value: formatInteger(newClients.size),
      },
      {
        delta: formatDelta(forecastMrr, previousForecastMrr),
        description: "Soma mensalizada dos planos personalizados ativos ou pendentes de cobrança dos clientes.",
        id: "forecastMrr",
        label: "Receita prevista",
        tone: "green",
        trend: forecastMrr >= previousForecastMrr ? "good" : "bad",
        value: formatCurrencyCents(forecastMrr),
      },
      {
        delta: `${formatInteger(overdueSubscriptions.length)} atrasada(s)`,
        description: "Assinaturas de clientes em planos personalizados que renovam nos próximos 30 dias.",
        id: "renewalsNext30",
        label: "Renovações próximas",
        tone: dueRenewals.length > 0 ? "amber" : "slate",
        trend: overdueSubscriptions.length > 0 ? "bad" : "neutral",
        value: formatInteger(dueRenewals.length),
      },
      {
        delta: formatDelta(openTickets.length, previousOpenTickets.length),
        description: "Tickets abertos ou em atendimento vinculados a este parceiro.",
        id: "openTickets",
        label: "Tickets abertos",
        tone: openTickets.length > previousOpenTickets.length ? "red" : "slate",
        trend: openTickets.length <= previousOpenTickets.length ? "good" : "bad",
        value: formatInteger(openTickets.length),
      },
    ],
    movements: raw.events.slice(0, 6).map((event) => ({
      detail: event.detail,
      id: event.id,
      time: formatRelativeTime(event.created_at, now),
      title: event.title,
      tone: eventTone(event.event_type),
    })),
    objectiveDistribution,
    partnerName: raw.partner?.professional_name ?? raw.profile?.display_name ?? "Parceiro",
    pendingUpdates,
    performanceMetrics: [
      {
        chartKey: "adherenceRate",
        description: "Percentual de clientes ativos com plano personalizado vigente no período.",
        icon: "users",
        id: "adherenceRate",
        label: "Adesão média no período",
        unit: "percent",
        value: formatPercent(adherence[0]?.value ?? 0),
      },
      {
        chartKey: "adherentClients",
        description: "Clientes ativos que possuem plano personalizado vigente.",
        icon: "users",
        id: "adherentClients",
        label: "Clientes aderentes (≥80%)",
        unit: "number",
        value: formatInteger(activePlanPatientIds.size),
      },
      {
        chartKey: "monthlyRevenueCents",
        description: "Recebimentos manuais registrados no mês atual.",
        icon: "dollar",
        id: "adherenceTarget",
        label: "Receita do mês",
        unit: "currency",
        value: formatCurrencyCents(manualRevenueMonth),
      },
    ],
    periodLabel: periodLabel(currentStart, currentEnd),
    planDistribution,
    planRows,
    platformPlanLabel: platformPlanLabel(raw, now),
    renewals,
    summaryMetrics: [
      {
        delta: formatDelta(activeClients.size, previousActiveClients.size),
        description: "Clientes distintos com vínculo ativo com este parceiro na data atual.",
        id: "activeClients",
        label: "Clientes ativos",
        subtext: "vs. mês anterior",
        tone: "blue",
        trend: activeClients.size >= previousActiveClients.size ? "good" : "bad",
        value: formatInteger(activeClients.size),
      },
      {
        description: "Soma de renovações próximas e documentos operacionais pendentes.",
        id: "pendingUpdates",
        label: "Próximos da Atualização",
        subtext: `${formatInteger(dueRenewals.length)} pendentes`,
        tone: "amber",
        trend: dueRenewals.length > 0 || pendingDocuments.length > 0 ? "neutral" : "good",
        value: formatInteger(dueRenewals.length + pendingDocuments.length),
      },
      {
        description: "Clientes que já tiveram vínculo com o parceiro, mas não possuem vínculo ativo no momento.",
        id: "inactiveClients",
        label: "Clientes Inativos",
        tone: "slate",
        trend: "neutral",
        value: formatInteger(inactiveClients.size),
      },
      {
        description: "Assinaturas de clientes em planos personalizados que renovam nos próximos 30 dias.",
        id: "renewalsNext30",
        label: "Próximos do vencimento",
        tone: "amber",
        trend: overdueSubscriptions.length > 0 ? "bad" : "neutral",
        value: formatInteger(dueRenewals.length),
      },
      {
        delta: formatDelta(manualRevenueMonth, previousManualRevenueMonth),
        description: "Recebimentos manuais registrados no mês atual.",
        id: "forecastMrr",
        label: "Receita do Mês",
        subtext: "vs. mês anterior",
        tone: "green",
        trend: manualRevenueMonth >= previousManualRevenueMonth ? "good" : "bad",
        value: formatCurrencyCents(manualRevenueMonth),
      },
      {
        description: "Soma de renovações vencidas, documentos pendentes e tickets abertos do parceiro.",
        id: "clinicalAlerts",
        label: "Alertas clínicos",
        subtext: operationalAlertsCount > 0 ? "Requerem atenção" : "Sem alertas críticos",
        tone: operationalAlertsCount > 0 ? "red" : "slate",
        trend: operationalAlertsCount > 0 ? "bad" : "good",
        value: formatInteger(operationalAlertsCount),
      },
    ],
    todayAgenda,
  };
}
