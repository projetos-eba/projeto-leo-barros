import {
  effectiveProfessionalStatus,
  isSubscriptionActiveAt,
  latestSubscriptionForPartner,
} from "./professional-status";

export { isSubscriptionActiveAt } from "./professional-status";

export type BillingPlan = {
  billing_interval: string;
  currency: string;
  id: string;
  name: string;
  price_cents: number;
  slug: string;
};

export type PartnerSubscription = {
  canceled_at: string | null;
  created_at: string;
  current_period_end: string;
  current_period_start: string;
  id: string;
  partner_id: string;
  plan_id: string;
  status: string;
};

export type BillingPayment = {
  amount_cents: number;
  due_at: string;
  id: string;
  paid_at: string | null;
  partner_id: string;
  payment_kind: string;
  status: string;
  subscription_id: string;
};

export type PartnerProfile = {
  created_at: string;
  display_name: string;
  email: string;
  id: string;
  role: string;
  status: string;
};

export type PartnerRecord = {
  created_at: string;
  id: string;
  professional_name: string;
  professional_type: string;
  profile_id: string;
};

export type PartnerClientRecord = {
  created_at: string;
  ended_at: string | null;
  partner_id: string;
  patient_id: string;
  started_at: string;
  status: string;
};

export type SupportTicket = {
  created_at: string;
  id: string;
  partner_id: string;
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
  partner_id: string;
  status: string;
  title: string;
};

export type PlatformActivityEvent = {
  created_at: string;
  detail: string;
  event_type: string;
  id: string;
  partner_id: string | null;
  title: string;
};

export type DashboardRawData = {
  documents: PartnerDocument[];
  events: PlatformActivityEvent[];
  partnerClients: PartnerClientRecord[];
  partners: PartnerRecord[];
  payments: BillingPayment[];
  plans: BillingPlan[];
  profiles: PartnerProfile[];
  subscriptions: PartnerSubscription[];
  tickets: SupportTicket[];
};

export type DashboardKpi = {
  delta: string;
  id: "activePartners" | "activeClients" | "mrr" | "openTickets" | "renewalRate";
  label: string;
  trend: "good" | "bad" | "neutral";
  value: string;
};

export type DashboardHealthItem = {
  badge: string;
  id: "processedPayments" | "ticketsSla" | "pendingDocuments";
  label: string;
  subtext: string;
  value: string;
};

export type DashboardGrowthPoint = {
  activeClients: number;
  activePartners: number;
  label: string;
  month: string;
};

export type DashboardPlanSlice = {
  color: string;
  count: number;
  label: string;
  value: number;
};

export type DashboardProfessionalStatusSlice = {
  color: string;
  count: number;
  id: "active" | "suspended" | "inactive";
  label: string;
  value: number;
};

export type DashboardAlert = {
  action: string;
  body: string;
  id: string;
  tone: "danger" | "info" | "success" | "warning";
  title: string;
};

export type DashboardApproval = {
  date: string;
  email: string;
  initial: string;
  name: string;
  specialty: string;
  status: string;
};

export type DashboardMovement = {
  detail: string;
  id: string;
  time: string;
  title: string;
  tone: "amber" | "blue" | "green" | "purple" | "red";
};

export type DashboardBottomMetric = {
  delta: string;
  id: "newClients" | "churn" | "failedPayments" | "pendingDocuments";
  label: string;
  trend: "good" | "bad" | "neutral";
  value: string;
};

export type AdminDashboardData = {
  alerts: DashboardAlert[];
  approvals: DashboardApproval[];
  bottomMetrics: DashboardBottomMetric[];
  generatedAt: string;
  growth: DashboardGrowthPoint[];
  health: DashboardHealthItem[];
  kpis: DashboardKpi[];
  movements: DashboardMovement[];
  periodLabel: string;
  planDistribution: DashboardPlanSlice[];
  professionalStatusDistribution: DashboardProfessionalStatusSlice[];
};

const openTicketStatuses = new Set(["open", "in_progress"]);
const pendingDocumentStatuses = new Set(["pending", "in_review", "expired"]);
const planColors = ["#2d9cff", "#15c8c3", "#8d5cf6", "#58d881", "#f0a52b"];
const professionalStatusColors: Record<DashboardProfessionalStatusSlice["id"], string> = {
  active: "#58d881",
  inactive: "#8998a4",
  suspended: "#f0a52b",
};

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
    maximumFractionDigits: 0,
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

export function monthlyizePlanPrice(plan: BillingPlan | undefined) {
  if (!plan) return 0;
  return plan.billing_interval === "yearly" ? Math.round(plan.price_cents / 12) : plan.price_cents;
}

function isPartnerProfileActive(partner: PartnerRecord, profilesById: Map<string, PartnerProfile>) {
  const profile = profilesById.get(partner.profile_id);
  return profile?.role === "parceiro" && profile.status === "active";
}

function activePartnerIdsAt(raw: DashboardRawData, at: Date) {
  const profilesById = new Map(raw.profiles.map((profile) => [profile.id, profile]));
  const partnersById = new Map(raw.partners.map((partner) => [partner.id, partner]));

  return new Set(
    raw.subscriptions
      .filter((subscription) => {
        const partner = partnersById.get(subscription.partner_id);
        return Boolean(partner && isPartnerProfileActive(partner, profilesById) && isSubscriptionActiveAt(subscription, at));
      })
      .map((subscription) => subscription.partner_id),
  );
}

function activeClientIdsAt(raw: DashboardRawData, activePartnerIds: Set<string>, at: Date) {
  return new Set(
    raw.partnerClients
      .filter((relationship) => {
        const startedAt = parseDate(relationship.started_at);
        const endedAt = parseDate(relationship.ended_at);
        return (
          relationship.status === "active" &&
          activePartnerIds.has(relationship.partner_id) &&
          Boolean(startedAt && startedAt <= at) &&
          (!endedAt || endedAt > at)
        );
      })
      .map((relationship) => relationship.patient_id),
  );
}

function newClientIdsWithin(raw: DashboardRawData, activePartnerIds: Set<string>, start: Date, end: Date) {
  return new Set(
    raw.partnerClients
      .filter((relationship) => (
        relationship.status === "active" &&
        activePartnerIds.has(relationship.partner_id) &&
        isWithin(parseDate(relationship.started_at), start, end)
      ))
      .map((relationship) => relationship.patient_id),
  );
}

function renewalRate(payments: BillingPayment[], start: Date, end: Date) {
  const eligible = payments.filter((payment) => {
    const dueAt = parseDate(payment.due_at);
    return payment.payment_kind === "renewal" && isWithin(dueAt, start, end) && ["succeeded", "failed"].includes(payment.status);
  });

  if (eligible.length === 0) return 0;
  return (eligible.filter((payment) => payment.status === "succeeded").length / eligible.length) * 100;
}

function churnRate(subscriptions: PartnerSubscription[], start: Date, end: Date) {
  const canceled = subscriptions.filter((subscription) => isWithin(parseDate(subscription.canceled_at), start, end)).length;
  const activeAtStart = subscriptions.filter((subscription) => isSubscriptionActiveAt(subscription, start)).length;
  return activeAtStart === 0 ? 0 : (canceled / activeAtStart) * 100;
}

function eventTone(eventType: string): DashboardMovement["tone"] {
  if (eventType.includes("failed") || eventType.includes("canceled")) return "red";
  if (eventType.includes("ticket")) return "purple";
  if (eventType.includes("document")) return "amber";
  if (eventType.includes("payment") || eventType.includes("subscription")) return "green";
  return "blue";
}

export function buildAdminDashboardData(raw: DashboardRawData, now = new Date()): AdminDashboardData {
  const currentStart = startOfMonth(now);
  const currentEnd = endOfMonth(now);
  const previousStart = addMonths(currentStart, -1);
  const previousEnd = new Date(currentStart.getTime() - 1);
  const plansById = new Map(raw.plans.map((plan) => [plan.id, plan]));
  const partnersById = new Map(raw.partners.map((partner) => [partner.id, partner]));
  const profilesById = new Map(raw.profiles.map((profile) => [profile.id, profile]));
  const subscriptionsByPartnerId = new Map<string, PartnerSubscription[]>();

  raw.subscriptions.forEach((subscription) => {
    subscriptionsByPartnerId.set(subscription.partner_id, [...(subscriptionsByPartnerId.get(subscription.partner_id) ?? []), subscription]);
  });

  const activePartnerIds = activePartnerIdsAt(raw, now);
  const previousActivePartnerIds = activePartnerIdsAt(raw, previousEnd);
  const activeClientIds = activeClientIdsAt(raw, activePartnerIds, now);
  const previousActiveClientIds = activeClientIdsAt(raw, previousActivePartnerIds, previousEnd);

  const activeSubscriptions = raw.subscriptions.filter((subscription) => activePartnerIds.has(subscription.partner_id) && isSubscriptionActiveAt(subscription, now));
  const previousActiveSubscriptions = raw.subscriptions.filter((subscription) => previousActivePartnerIds.has(subscription.partner_id) && isSubscriptionActiveAt(subscription, previousEnd));
  const mrr = activeSubscriptions.reduce((sum, subscription) => sum + monthlyizePlanPrice(plansById.get(subscription.plan_id)), 0);
  const previousMrr = previousActiveSubscriptions.reduce((sum, subscription) => sum + monthlyizePlanPrice(plansById.get(subscription.plan_id)), 0);
  const openTickets = raw.tickets.filter((ticket) => activePartnerIds.has(ticket.partner_id) && openTicketStatuses.has(ticket.status));
  const previousOpenTickets = raw.tickets.filter((ticket) => {
    const createdAt = parseDate(ticket.created_at);
    const resolvedAt = parseDate(ticket.resolved_at);
    return (
      activePartnerIds.has(ticket.partner_id) &&
      Boolean(createdAt && createdAt <= previousEnd) &&
      (!resolvedAt || resolvedAt > previousEnd)
    );
  });
  const renewalRateCurrent = renewalRate(raw.payments, currentStart, currentEnd);
  const renewalRatePrevious = renewalRate(raw.payments, previousStart, previousEnd);
  const processedPayments = raw.payments
    .filter((payment) => payment.status === "succeeded" && isWithin(parseDate(payment.paid_at), currentStart, currentEnd))
    .reduce((sum, payment) => sum + payment.amount_cents, 0);
  const resolvedTickets = raw.tickets.filter((ticket) => isWithin(parseDate(ticket.resolved_at), currentStart, currentEnd));
  const ticketsWithinSla = resolvedTickets.length === 0
    ? 100
    : (resolvedTickets.filter((ticket) => {
        const resolvedAt = parseDate(ticket.resolved_at);
        const slaDueAt = parseDate(ticket.sla_due_at);
        return Boolean(resolvedAt && slaDueAt && resolvedAt <= slaDueAt);
      }).length / resolvedTickets.length) * 100;
  const pendingDocuments = raw.documents.filter((document) => pendingDocumentStatuses.has(document.status));
  const failedPayments = raw.payments.filter((payment) => payment.status === "failed" && isWithin(parseDate(payment.due_at), currentStart, currentEnd));
  const newClientIds = newClientIdsWithin(raw, activePartnerIds, currentStart, currentEnd);
  const previousNewClientIds = newClientIdsWithin(raw, previousActivePartnerIds, previousStart, previousEnd);
  const churn = churnRate(raw.subscriptions, currentStart, currentEnd);
  const previousChurn = churnRate(raw.subscriptions, previousStart, previousEnd);

  const growth = Array.from({ length: 13 }, (_, index) => {
    const monthStart = addMonths(currentStart, index - 12);
    const monthEnd = endOfMonth(monthStart);
    const monthActivePartnerIds = activePartnerIdsAt(raw, monthEnd);
    return {
      activeClients: activeClientIdsAt(raw, monthActivePartnerIds, monthEnd).size,
      activePartners: monthActivePartnerIds.size,
      label: formatMonthLabel(monthStart),
      month: monthStart.toISOString().slice(0, 7),
    };
  });

  const planDistribution = raw.plans
    .map((plan, index) => {
      const count = activeSubscriptions.filter((subscription) => subscription.plan_id === plan.id).length;
      return {
        color: planColors[index % planColors.length],
        count,
        label: plan.name,
        value: count,
      };
    })
    .filter((slice) => slice.count > 0);
  const professionalStatusCounts = raw.partners.reduce<Record<DashboardProfessionalStatusSlice["id"], number>>(
    (counts, partner) => {
      const profile = profilesById.get(partner.profile_id);
      const subscription = latestSubscriptionForPartner(subscriptionsByPartnerId.get(partner.id) ?? [], now);
      const status = effectiveProfessionalStatus(profile?.status, subscription, now);
      return { ...counts, [status]: counts[status] + 1 };
    },
    { active: 0, inactive: 0, suspended: 0 },
  );
  const professionalStatusDistribution: DashboardProfessionalStatusSlice[] = [
    {
      color: professionalStatusColors.active,
      count: professionalStatusCounts.active,
      id: "active",
      label: "Ativos",
      value: professionalStatusCounts.active,
    },
    {
      color: professionalStatusColors.suspended,
      count: professionalStatusCounts.suspended,
      id: "suspended",
      label: "Suspensos",
      value: professionalStatusCounts.suspended,
    },
    {
      color: professionalStatusColors.inactive,
      count: professionalStatusCounts.inactive,
      id: "inactive",
      label: "Inativos",
      value: professionalStatusCounts.inactive,
    },
  ];

  const alerts: DashboardAlert[] = [
    pendingDocuments.length > 0
      ? {
          action: "Revisar documentos",
          body: `${pendingDocuments.length} documento(s) aguardando análise ou regularização.`,
          id: "pending-documents",
          tone: "danger",
          title: "Documentos pendentes",
        }
      : {
          action: "Ver profissionais",
          body: "Nenhum documento pendente no momento.",
          id: "pending-documents",
          tone: "success",
          title: "Documentos em dia",
        },
    failedPayments.length > 0
      ? {
          action: "Ver financeiro",
          body: `${failedPayments.length} pagamento(s) falharam neste mês.`,
          id: "failed-payments",
          tone: "warning",
          title: "Pagamentos com falha",
        }
      : {
          action: "Ver financeiro",
          body: "Nenhuma falha de pagamento registrada neste mês.",
          id: "failed-payments",
          tone: "success",
          title: "Pagamentos estáveis",
        },
    openTickets.length > 0
      ? {
          action: "Ver suporte",
          body: `${openTickets.length} ticket(s) aguardam acompanhamento da operação.`,
          id: "open-tickets",
          tone: "info",
          title: "Suporte em andamento",
        }
      : {
          action: "Ver suporte",
          body: "Não há tickets abertos agora.",
          id: "open-tickets",
          tone: "success",
          title: "Suporte sem fila",
        },
  ];

  const approvals = pendingDocuments.slice(0, 5).map((document) => {
    const partner = partnersById.get(document.partner_id);
    const profile = partner ? profilesById.get(partner.profile_id) : undefined;
    const name = profile?.display_name ?? partner?.professional_name ?? "Parceiro";

    return {
      date: formatDate(document.created_at),
      email: profile?.email ?? "sem-email@example.invalid",
      initial: name.charAt(0).toUpperCase(),
      name,
      specialty: partner?.professional_type.replace("_", " ") ?? "Não informado",
      status: document.status === "expired" ? "Documento expirado" : "Aguardando revisão",
    };
  });

  return {
    alerts,
    approvals,
    bottomMetrics: [
      {
        delta: formatDelta(newClientIds.size, previousNewClientIds.size),
        id: "newClients",
        label: "Novos clientes (mês)",
        trend: "good",
        value: formatInteger(newClientIds.size),
      },
      {
        delta: formatDelta(churn, previousChurn, "p.p."),
        id: "churn",
        label: "Churn de assinaturas",
        trend: churn <= previousChurn ? "good" : "bad",
        value: formatPercent(churn),
      },
      {
        delta: failedPayments.length > 0 ? "+" + formatInteger(failedPayments.length) : "0",
        id: "failedPayments",
        label: "Pagamentos falhos",
        trend: failedPayments.length > 0 ? "bad" : "good",
        value: formatInteger(failedPayments.length),
      },
      {
        delta: pendingDocuments.length > 0 ? "+" + formatInteger(pendingDocuments.length) : "0",
        id: "pendingDocuments",
        label: "Documentos pendentes",
        trend: pendingDocuments.length > 0 ? "bad" : "good",
        value: formatInteger(pendingDocuments.length),
      },
    ],
    generatedAt: now.toISOString(),
    growth,
    health: [
      {
        badge: processedPayments > 0 ? "Processado" : "Sem registros",
        id: "processedPayments",
        label: "Pagamentos processados",
        subtext: "Este mês",
        value: formatCurrencyCents(processedPayments),
      },
      {
        badge: ticketsWithinSla >= 90 ? "Bom" : "Atenção",
        id: "ticketsSla",
        label: "Tickets dentro do SLA",
        subtext: "Resolvidos este mês",
        value: formatPercent(ticketsWithinSla),
      },
      {
        badge: pendingDocuments.length > 0 ? "Atenção" : "Em dia",
        id: "pendingDocuments",
        label: "Documentos pendentes",
        subtext: "Parceiros e profissionais",
        value: formatInteger(pendingDocuments.length),
      },
    ],
    kpis: [
      {
        delta: formatDelta(activePartnerIds.size, previousActivePartnerIds.size),
        id: "activePartners",
        label: "Parceiros ativos",
        trend: "good",
        value: formatInteger(activePartnerIds.size),
      },
      {
        delta: formatDelta(activeClientIds.size, previousActiveClientIds.size),
        id: "activeClients",
        label: "Clientes ativos",
        trend: "good",
        value: formatInteger(activeClientIds.size),
      },
      {
        delta: formatDelta(mrr, previousMrr),
        id: "mrr",
        label: "Receita recorrente mensal (MRR)",
        trend: "good",
        value: formatCurrencyCents(mrr),
      },
      {
        delta: formatDelta(openTickets.length, previousOpenTickets.length),
        id: "openTickets",
        label: "Tickets abertos",
        trend: openTickets.length <= previousOpenTickets.length ? "good" : "bad",
        value: formatInteger(openTickets.length),
      },
      {
        delta: formatDelta(renewalRateCurrent, renewalRatePrevious, "p.p."),
        id: "renewalRate",
        label: "Taxa de renovação",
        trend: renewalRateCurrent >= renewalRatePrevious ? "good" : "bad",
        value: formatPercent(renewalRateCurrent),
      },
    ],
    movements: raw.events.slice(0, 6).map((event) => ({
      detail: event.detail,
      id: event.id,
      time: formatRelativeTime(event.created_at, now),
      title: event.title,
      tone: eventTone(event.event_type),
    })),
    periodLabel: periodLabel(currentStart, currentEnd),
    planDistribution,
    professionalStatusDistribution,
  };
}
