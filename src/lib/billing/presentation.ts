export const BILLING_DISPLAY_TIME_ZONE = "UTC";

export const subscriptionStatusLabels = {
  active: "Ativa",
  canceled: "Cancelada",
  incomplete: "Pagamento pendente",
  incomplete_expired: "Assinatura nao concluida",
  past_due: "Pagamento em atraso",
  paused: "Pausada",
  trialing: "Em periodo de teste",
  unpaid: "Pagamento nao realizado",
} as const;

const billingDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: BILLING_DISPLAY_TIME_ZONE,
  year: "numeric",
});

const paymentKindLabels: Record<string, string> = {
  initial: "Pagamento inicial",
  manual_adjustment: "Ajuste manual",
  renewal: "Renovacao",
};

const paymentStatusLabels: Record<string, string> = {
  failed: "Falhou",
  pending: "Pendente",
  succeeded: "Pago",
};

export function isKnownSubscriptionStatus(status?: string | null) {
  return Boolean(status && status in subscriptionStatusLabels);
}

export function getSubscriptionStatusLabel(status?: string | null) {
  if (!status) return "Sem assinatura";
  if (isKnownSubscriptionStatus(status)) {
    return subscriptionStatusLabels[status as keyof typeof subscriptionStatusLabels];
  }
  return "Status indisponivel";
}

export function formatBillingDate(value?: string | null, fallback = "Data indisponivel") {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return billingDateFormatter.format(date);
}

export function getBillingIntervalLabel(interval?: string | null) {
  if (interval === "yearly") return "Anual";
  if (interval === "monthly") return "Mensal";
  return "Sem plano";
}

export function getPaymentKindLabel(kind: string) {
  return paymentKindLabels[kind] ?? "Cobranca";
}

export function getPaymentStatusLabel(status: string) {
  return paymentStatusLabels[status] ?? "Status indisponivel";
}

export function hasPendingBillingIssue(status?: string | null) {
  return status === "past_due" ||
    status === "incomplete" ||
    status === "incomplete_expired" ||
    status === "unpaid";
}

export function getTrialDisplayRows(subscription?: {
  status?: string | null;
  trial_end?: string | null;
  trial_start?: string | null;
} | null) {
  const start = formatBillingDate(subscription?.trial_start, "");
  const end = formatBillingDate(subscription?.trial_end, "");
  const hasCompleteTrialPeriod = Boolean(start && end);

  if (hasCompleteTrialPeriod && subscription?.status === "trialing") {
    return [
      ["Inicio do periodo de teste", start],
      ["Termino do periodo de teste", end],
    ] as const;
  }

  if (hasCompleteTrialPeriod) {
    return [["Periodo de teste encerrado", `${start} a ${end}`]] as const;
  }

  if (subscription?.status === "trialing") {
    return [["Periodo de teste", "Nao foi possivel carregar o periodo de teste."]] as const;
  }

  return [["Periodo de teste", "Sem periodo de teste"]] as const;
}
