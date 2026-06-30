import {
  effectiveProfessionalStatus,
  isSubscriptionActiveAt,
  latestSubscriptionForPartner,
} from "./professional-status";

export type ClientProfile = {
  created_at: string;
  display_name: string;
  email: string;
  id: string;
  role: string;
  status: string;
  updated_at: string;
};

export type ClientPatientRecord = {
  birth_date: string | null;
  created_at: string;
  id: string;
  objective: string | null;
  phone: string | null;
  profile_id: string;
  updated_at: string;
};

export type ClientPartnerRecord = {
  created_at: string;
  id: string;
  professional_name: string;
  professional_type: string;
  profile_id: string;
};

export type ClientPartnerSubscription = {
  canceled_at: string | null;
  created_at: string;
  current_period_end: string;
  current_period_start: string;
  id: string;
  partner_id: string;
  plan_id: string;
  status: string;
};

export type ClientPartnerLink = {
  created_at: string;
  ended_at: string | null;
  id: string;
  partner_id: string;
  patient_id: string;
  service_scope: string;
  started_at: string;
  status: string;
  updated_at: string;
};

export type AdminClientsRawData = {
  clientProfiles: ClientProfile[];
  partnerProfiles: ClientProfile[];
  partners: ClientPartnerRecord[];
  patients: ClientPatientRecord[];
  relationships: ClientPartnerLink[];
  subscriptions: ClientPartnerSubscription[];
};

export type ClientKpi = {
  delta: string;
  description: string;
  id: "activeClients" | "newClients" | "withoutActiveLink" | "endedLinks";
  label: string;
  tone: "blue" | "green" | "amber" | "slate";
  trend: "good" | "bad" | "neutral";
  value: string;
};

export type ClientLinkSummary = {
  endedAtLabel: string;
  id: string;
  partnerName: string;
  professionalStatus: "active" | "suspended" | "inactive";
  scopeLabel: string;
  startedAtLabel: string;
  statusLabel: string;
};

export type ClientRow = {
  activeLinksCount: number;
  email: string;
  id: string;
  initial: string;
  lastUpdateLabel: string;
  links: ClientLinkSummary[];
  name: string;
  phoneLabel: string;
  primaryPartnerLabel: string;
  scopeLabel: string;
  startedAtLabel: string;
  status: "active" | "unassigned" | "inactive";
  statusLabel: string;
  statusTone: "active" | "warning" | "inactive";
};

export type ClientStatusSlice = {
  color: string;
  count: number;
  id: ClientRow["status"];
  label: string;
  value: number;
};

export type ClientTopProfessional = {
  clientsCount: number;
  id: string;
  name: string;
  specialtyLabel: string;
};

export type AdminClientsData = {
  clients: ClientRow[];
  generatedAt: string;
  kpis: ClientKpi[];
  statusDistribution: ClientStatusSlice[];
  tabCounts: {
    active: number;
    all: number;
    inactive: number;
    unassigned: number;
  };
  topProfessionals: ClientTopProfessional[];
};

const statusColors: Record<ClientRow["status"], string> = {
  active: "#58d881",
  inactive: "#8998a4",
  unassigned: "#f0a52b",
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

function formatDelta(current: number, previous: number) {
  if (previous === 0 && current === 0) return "0%";
  if (previous === 0) return "+100%";

  const raw = ((current - previous) / previous) * 100;
  const sign = raw > 0 ? "+" : "";
  const formatted = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(raw);
  return `${sign}${formatted}%`;
}

function formatDate(value: string | null) {
  if (!value) return "Sem registro";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function scopeLabel(value: string) {
  const labels: Record<string, string> = {
    cardio: "Cardio",
    dieta: "Dieta",
    saude: "Saúde",
    treino: "Treino",
  };

  return labels[value] ?? "Geral";
}

function professionalTypeLabel(value: string) {
  const labels: Record<string, string> = {
    medico: "Medicina",
    nutricionista: "Nutrição",
    personal_trainer: "Educação Física",
  };

  return labels[value] ?? "Outros";
}

function relationshipStatusLabel(value: string) {
  if (value === "active") return "Ativo";
  if (value === "suspended") return "Suspenso";
  if (value === "pending") return "Pendente";
  return "Encerrado";
}

function statusLabel(status: ClientRow["status"]): Pick<ClientRow, "statusLabel" | "statusTone"> {
  if (status === "active") return { statusLabel: "Ativo", statusTone: "active" };
  if (status === "unassigned") return { statusLabel: "Sem vínculo ativo", statusTone: "warning" };
  return { statusLabel: "Inativo", statusTone: "inactive" };
}

function profileIsInactive(profile: ClientProfile | undefined) {
  return !profile || profile.status === "disabled" || profile.status === "suspended";
}

export function buildAdminClientsData(raw: AdminClientsRawData, now = new Date()): AdminClientsData {
  const currentStart = startOfMonth(now);
  const currentEnd = endOfMonth(now);
  const previousStart = addMonths(currentStart, -1);
  const previousEnd = new Date(currentStart.getTime() - 1);
  const clientProfilesById = new Map(raw.clientProfiles.map((profile) => [profile.id, profile]));
  const partnerProfilesById = new Map(raw.partnerProfiles.map((profile) => [profile.id, profile]));
  const patientsById = new Map(raw.patients.map((patient) => [patient.id, patient]));
  const partnersById = new Map(raw.partners.map((partner) => [partner.id, partner]));
  const subscriptionsByPartnerId = new Map<string, ClientPartnerSubscription[]>();

  raw.subscriptions.forEach((subscription) => {
    subscriptionsByPartnerId.set(subscription.partner_id, [
      ...(subscriptionsByPartnerId.get(subscription.partner_id) ?? []),
      subscription,
    ]);
  });

  const professionalStatusByPartnerId = new Map<string, "active" | "suspended" | "inactive">();
  raw.partners.forEach((partner) => {
    const profile = partnerProfilesById.get(partner.profile_id);
    const subscription = latestSubscriptionForPartner(subscriptionsByPartnerId.get(partner.id) ?? [], now);
    professionalStatusByPartnerId.set(partner.id, effectiveProfessionalStatus(profile?.status, subscription, now));
  });

  const isActiveRelationship = (relationship: ClientPartnerLink) =>
    relationship.status === "active" && professionalStatusByPartnerId.get(relationship.partner_id) === "active";

  const distinctPatientsForPeriod = (start: Date, end: Date) =>
    new Set(
      raw.relationships
        .filter((relationship) => isActiveRelationship(relationship) && isWithin(parseDate(relationship.started_at), start, end))
        .map((relationship) => relationship.patient_id),
    );

  const activePatientIds = new Set(raw.relationships.filter(isActiveRelationship).map((relationship) => relationship.patient_id));
  const previousActivePatientIds = new Set(
    raw.relationships
      .filter((relationship) => {
        const startedAt = parseDate(relationship.started_at);
        const endedAt = parseDate(relationship.ended_at);
        return Boolean(
          startedAt &&
            startedAt <= previousEnd &&
            (!endedAt || endedAt > previousEnd) &&
            relationship.status === "active" &&
            professionalStatusByPartnerId.get(relationship.partner_id) === "active",
        );
      })
      .map((relationship) => relationship.patient_id),
  );
  const newCurrentPatientIds = distinctPatientsForPeriod(currentStart, currentEnd);
  const newPreviousPatientIds = distinctPatientsForPeriod(previousStart, previousEnd);
  const endedCurrentPatientIds = new Set(
    raw.relationships
      .filter((relationship) => isWithin(parseDate(relationship.ended_at), currentStart, currentEnd))
      .map((relationship) => relationship.patient_id),
  );
  const endedPreviousPatientIds = new Set(
    raw.relationships
      .filter((relationship) => isWithin(parseDate(relationship.ended_at), previousStart, previousEnd))
      .map((relationship) => relationship.patient_id),
  );

  const clients = raw.patients
    .map((patient) => {
      const profile = clientProfilesById.get(patient.profile_id);
      const links = raw.relationships
        .filter((relationship) => relationship.patient_id === patient.id)
        .sort((left, right) => parseDate(right.started_at)!.getTime() - parseDate(left.started_at)!.getTime());
      const activeLinks = links.filter(isActiveRelationship);
      const primaryLink = activeLinks[0] ?? links[0];
      const partner = primaryLink ? partnersById.get(primaryLink.partner_id) : undefined;
      const partnerName = partner?.professional_name ?? "Sem profissional";
      const status: ClientRow["status"] = profileIsInactive(profile)
        ? "inactive"
        : activeLinks.length > 0
          ? "active"
          : "unassigned";
      const displayName = profile?.display_name ?? "Cliente sem perfil";
      const labels = statusLabel(status);

      return {
        activeLinksCount: activeLinks.length,
        email: profile?.email ?? "sem-email@example.invalid",
        id: patient.id,
        initial: displayName.charAt(0).toUpperCase(),
        lastUpdateLabel: formatDate(profile?.updated_at ?? patient.updated_at),
        links: links.map((link) => {
          const linkPartner = partnersById.get(link.partner_id);
          return {
            endedAtLabel: formatDate(link.ended_at),
            id: link.id,
            partnerName: linkPartner?.professional_name ?? "Sem profissional",
            professionalStatus: professionalStatusByPartnerId.get(link.partner_id) ?? "inactive",
            scopeLabel: scopeLabel(link.service_scope),
            startedAtLabel: formatDate(link.started_at),
            statusLabel: relationshipStatusLabel(link.status),
          };
        }),
        name: displayName,
        phoneLabel: patient.phone ?? "Sem telefone",
        primaryPartnerLabel: partnerName,
        scopeLabel: primaryLink ? scopeLabel(primaryLink.service_scope) : "Sem escopo",
        startedAtLabel: formatDate(primaryLink?.started_at ?? patient.created_at),
        status,
        ...labels,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));

  const unassignedClients = clients.filter((client) => client.status === "unassigned");
  const inactiveClients = clients.filter((client) => client.status === "inactive");
  const previousWithoutActiveLink = raw.patients.filter((patient) => !previousActivePatientIds.has(patient.id)).length;

  const topProfessionals = raw.partners
    .map((partner) => {
      const activeClientsForPartner = new Set(
        raw.relationships
          .filter((relationship) => relationship.partner_id === partner.id && isActiveRelationship(relationship))
          .map((relationship) => relationship.patient_id),
      );

      return {
        clientsCount: activeClientsForPartner.size,
        id: partner.id,
        name: partner.professional_name,
        specialtyLabel: professionalTypeLabel(partner.professional_type),
      };
    })
    .filter((item) => item.clientsCount > 0)
    .sort((left, right) => right.clientsCount - left.clientsCount || left.name.localeCompare(right.name, "pt-BR"))
    .slice(0, 5);

  const distributionTotal = clients.length;
  const statusDistribution = (["active", "unassigned", "inactive"] as const).map((status) => {
    const count = clients.filter((client) => client.status === status).length;
    return {
      color: statusColors[status],
      count,
      id: status,
      label: statusLabel(status).statusLabel,
      value: distributionTotal === 0 ? 0 : Number(((count / distributionTotal) * 100).toFixed(1)),
    };
  });

  return {
    clients,
    generatedAt: now.toISOString(),
    kpis: [
      {
        delta: formatDelta(activePatientIds.size, previousActivePatientIds.size),
        description: "Clientes distintos com vínculo ativo em profissionais ativos.",
        id: "activeClients",
        label: "Clientes ativos",
        tone: "blue",
        trend: "good",
        value: formatInteger(activePatientIds.size),
      },
      {
        delta: formatDelta(newCurrentPatientIds.size, newPreviousPatientIds.size),
        description: "Clientes distintos iniciados neste mês em profissionais ativos.",
        id: "newClients",
        label: "Novos clientes (mês)",
        tone: "green",
        trend: "good",
        value: formatInteger(newCurrentPatientIds.size),
      },
      {
        delta: formatDelta(unassignedClients.length, previousWithoutActiveLink),
        description: "Clientes cadastrados sem vínculo ativo com profissional ativo.",
        id: "withoutActiveLink",
        label: "Sem vínculo ativo",
        tone: "amber",
        trend: unassignedClients.length <= previousWithoutActiveLink ? "good" : "bad",
        value: formatInteger(unassignedClients.length),
      },
      {
        delta: formatDelta(endedCurrentPatientIds.size, endedPreviousPatientIds.size),
        description: "Clientes com pelo menos um vínculo encerrado no mês.",
        id: "endedLinks",
        label: "Vínculos encerrados",
        tone: "slate",
        trend: endedCurrentPatientIds.size <= endedPreviousPatientIds.size ? "good" : "bad",
        value: formatInteger(endedCurrentPatientIds.size),
      },
    ],
    statusDistribution,
    tabCounts: {
      active: activePatientIds.size,
      all: clients.length,
      inactive: inactiveClients.length,
      unassigned: unassignedClients.length,
    },
    topProfessionals,
  };
}
