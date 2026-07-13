export type SupportTicketRecord = {
  created_at: string;
  id: string;
  opened_by_profile_id: string | null;
  partner_id: string;
  priority: string;
  resolved_at: string | null;
  sla_due_at: string;
  status: string;
  subject: string;
  ticket_number: string;
  updated_at: string;
};

export type SupportPartnerRecord = {
  id: string;
  professional_name: string;
  professional_type: string;
  profile_id: string;
};

export type SupportProfileRecord = {
  display_name: string;
  email: string;
  id: string;
  status: string;
};

export type SupportRawData = {
  partners: SupportPartnerRecord[];
  profiles: SupportProfileRecord[];
  tickets: SupportTicketRecord[];
};

export type SupportKpi = {
  delta: string;
  description: string;
  id: "openTickets" | "sla" | "avgResponse";
  label: string;
  trend: "good" | "bad" | "neutral";
  value: string;
};

export type SupportTicketRow = {
  category: string;
  createdAtLabel: string;
  email: string;
  id: string;
  initial: string;
  lastInteractionLabel: string;
  openedSinceLabel: string;
  partnerId: string;
  priority: string;
  priorityLabel: string;
  priorityTone: "danger" | "info" | "success" | "warning";
  professionalName: string;
  responsible: string;
  slaDueLabel: string;
  slaLabel: string;
  slaTone: "danger" | "success" | "warning";
  status: string;
  statusLabel: string;
  statusTone: "danger" | "info" | "success" | "warning";
  subject: string;
  tags: string[];
  ticketNumber: string;
  updatedAtLabel: string;
};

export type AdminSupportData = {
  delayedCount: number;
  generatedAt: string;
  kpis: SupportKpi[];
  periodLabel: string;
  tickets: SupportTicketRow[];
};

const activeStatuses = new Set(["open", "in_progress"]);

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

function formatPeriod(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });
  return `${formatter.format(start).replace(".", "")} - ${formatter.format(end).replace(".", "")}`;
}

function formatRelativeTime(value: string, now: Date) {
  const date = new Date(value);
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) return "Agora";
  if (diffMinutes < 60) return `${diffMinutes} min atrás`;
  if (diffHours < 24) return `${diffHours} h atrás`;
  if (diffDays < 7) return `${diffDays} d atrás`;
  return formatDate(value);
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${Math.max(0, Math.round(minutes))}min`;

  const hours = minutes / 60;
  if (hours < 24) return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(hours)}h`;

  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(hours / 24)}d`;
}

function statusMeta(status: string): Pick<SupportTicketRow, "statusLabel" | "statusTone"> {
  if (status === "in_progress") return { statusLabel: "Em atendimento", statusTone: "info" };
  if (status === "resolved") return { statusLabel: "Resolvido", statusTone: "success" };
  if (status === "closed") return { statusLabel: "Fechado", statusTone: "success" };
  return { statusLabel: "Novo", statusTone: "info" };
}

function priorityMeta(priority: string): Pick<SupportTicketRow, "priorityLabel" | "priorityTone"> {
  if (priority === "urgent") return { priorityLabel: "Crítica", priorityTone: "danger" };
  if (priority === "high") return { priorityLabel: "Alta", priorityTone: "danger" };
  if (priority === "low") return { priorityLabel: "Baixa", priorityTone: "success" };
  return { priorityLabel: "Média", priorityTone: "warning" };
}

function deriveCategory(subject: string) {
  const normalized = subject.toLowerCase();
  if (/(integra|google|api|conectar|ads)/.test(normalized)) return "Integrações";
  if (/(pagamento|plano|assinatura|cobran)/.test(normalized)) return "Financeiro";
  if (/(acesso|senha|login|conta)/.test(normalized)) return "Conta";
  if (/(relat|funil|dashboard|carrega)/.test(normalized)) return "Relatórios";
  return "Geral";
}

function deriveTags(subject: string, category: string) {
  const normalized = subject.toLowerCase();
  const tags = [category.toLowerCase()];
  if (normalized.includes("google")) tags.push("google-ads");
  if (normalized.includes("api")) tags.push("api");
  if (normalized.includes("plano")) tags.push("plano");
  if (normalized.includes("pagamento")) tags.push("pagamento");
  return Array.from(new Set(tags)).slice(0, 3);
}

function deriveResponsible(priority: string, status: string) {
  if (status === "open") return priority === "urgent" || priority === "high" ? "Bruno Almeida" : "Equipe suporte";
  if (status === "in_progress") return "Camila Rezende";
  return "Equipe suporte";
}

function slaMeta(ticket: SupportTicketRecord, now: Date): Pick<SupportTicketRow, "slaLabel" | "slaTone"> {
  if (!activeStatuses.has(ticket.status)) return { slaLabel: "Resolvido", slaTone: "success" };
  if (new Date(ticket.sla_due_at) < now) return { slaLabel: "Atrasado", slaTone: "danger" };
  return { slaLabel: "Em SLA", slaTone: "success" };
}

function averageResponseMinutes(tickets: SupportTicketRecord[]) {
  const durations = tickets
    .map((ticket) => Math.max(0, new Date(ticket.updated_at).getTime() - new Date(ticket.created_at).getTime()) / 60_000)
    .filter((duration) => duration > 0);

  if (durations.length === 0) return 0;
  return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
}

export function buildAdminSupportData(raw: SupportRawData, now = new Date()): AdminSupportData {
  const currentStart = startOfMonth(now);
  const currentEnd = endOfMonth(now);
  const previousStart = addMonths(currentStart, -1);
  const previousEnd = new Date(currentStart.getTime() - 1);
  const partnersById = new Map(raw.partners.map((partner) => [partner.id, partner]));
  const profilesById = new Map(raw.profiles.map((profile) => [profile.id, profile]));

  const openTickets = raw.tickets.filter((ticket) => activeStatuses.has(ticket.status));
  const previousOpenTickets = raw.tickets.filter((ticket) => activeStatuses.has(ticket.status) && isWithin(parseDate(ticket.created_at), previousStart, previousEnd));
  const currentOpenTickets = raw.tickets.filter((ticket) => activeStatuses.has(ticket.status) && isWithin(parseDate(ticket.created_at), currentStart, currentEnd));
  const activeTicketsWithSla = openTickets.filter((ticket) => ticket.sla_due_at);
  const ticketsInSla = activeTicketsWithSla.filter((ticket) => new Date(ticket.sla_due_at) >= now);
  const slaRate = activeTicketsWithSla.length === 0 ? 100 : (ticketsInSla.length / activeTicketsWithSla.length) * 100;
  const previousActiveTicketsWithSla = raw.tickets.filter((ticket) => activeStatuses.has(ticket.status) && isWithin(parseDate(ticket.created_at), previousStart, previousEnd));
  const previousSlaRate = previousActiveTicketsWithSla.length === 0
    ? 100
    : (previousActiveTicketsWithSla.filter((ticket) => new Date(ticket.sla_due_at) >= now).length / previousActiveTicketsWithSla.length) * 100;
  const avgResponse = averageResponseMinutes(openTickets);
  const previousAvgResponse = averageResponseMinutes(previousOpenTickets);
  const delayedTickets = openTickets.filter((ticket) => new Date(ticket.sla_due_at) < now);

  const tickets = raw.tickets
    .slice()
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .map((ticket) => {
      const partner = partnersById.get(ticket.partner_id);
      const profile = partner ? profilesById.get(partner.profile_id) : undefined;
      const category = deriveCategory(ticket.subject);

      return {
        ...priorityMeta(ticket.priority),
        ...slaMeta(ticket, now),
        ...statusMeta(ticket.status),
        category,
        createdAtLabel: formatDate(ticket.created_at),
        email: profile?.email ?? "sem-email@example.invalid",
        id: ticket.id,
        initial: (partner?.professional_name ?? profile?.display_name ?? "P").trim().charAt(0).toUpperCase(),
        lastInteractionLabel: formatRelativeTime(ticket.updated_at, now),
        openedSinceLabel: formatRelativeTime(ticket.created_at, now).replace(" atrás", ""),
        partnerId: ticket.partner_id,
        priority: ticket.priority,
        professionalName: partner?.professional_name ?? profile?.display_name ?? "Profissional sem nome",
        responsible: deriveResponsible(ticket.priority, ticket.status),
        slaDueLabel: formatDate(ticket.sla_due_at),
        status: ticket.status,
        subject: ticket.subject,
        tags: deriveTags(ticket.subject, category),
        ticketNumber: ticket.ticket_number,
        updatedAtLabel: formatDate(ticket.updated_at),
      };
    });

  return {
    delayedCount: delayedTickets.length,
    generatedAt: now.toISOString(),
    kpis: [
      {
        delta: formatDelta(currentOpenTickets.length, previousOpenTickets.length),
        description: "Tickets em aberto ou em atendimento",
        id: "openTickets",
        label: "Tickets abertos",
        trend: openTickets.length <= previousOpenTickets.length ? "good" : "bad",
        value: formatInteger(openTickets.length),
      },
      {
        delta: formatDelta(slaRate, previousSlaRate, "p.p."),
        description: "Tickets ativos dentro do prazo de SLA",
        id: "sla",
        label: "Em SLA",
        trend: slaRate >= previousSlaRate ? "good" : "bad",
        value: formatPercent(slaRate),
      },
      {
        delta: previousAvgResponse === 0 ? "0min" : `${avgResponse <= previousAvgResponse ? "↓" : "↑"} ${formatDuration(Math.abs(avgResponse - previousAvgResponse))}`,
        description: "Tempo médio entre abertura e última atualização",
        id: "avgResponse",
        label: "Tempo médio de resposta",
        trend: avgResponse <= previousAvgResponse || previousAvgResponse === 0 ? "good" : "bad",
        value: formatDuration(avgResponse),
      },
    ],
    periodLabel: formatPeriod(currentStart, currentEnd),
    tickets,
  };
}
