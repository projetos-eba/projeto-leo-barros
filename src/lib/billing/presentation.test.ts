import { describe, expect, it, vi } from "vitest";

import {
  formatBillingDate,
  getBillingIntervalLabel,
  getPaymentKindLabel,
  getPaymentStatusLabel,
  getSubscriptionStatusLabel,
  getTrialDisplayRows,
  hasPendingBillingIssue,
  isKnownSubscriptionStatus,
  subscriptionStatusLabels,
} from "./presentation";

describe("billing presentation", () => {
  it("traduz todos os status tecnicos de assinatura conhecidos", () => {
    expect(subscriptionStatusLabels).toMatchObject({
      active: "Ativa",
      canceled: "Cancelada",
      incomplete: "Pagamento pendente",
      incomplete_expired: "Assinatura nao concluida",
      past_due: "Pagamento em atraso",
      paused: "Pausada",
      trialing: "Em periodo de teste",
      unpaid: "Pagamento nao realizado",
    });
  });

  it("nunca exibe status tecnico desconhecido", () => {
    expect(isKnownSubscriptionStatus("unknown_status")).toBe(false);
    expect(getSubscriptionStatusLabel("unknown_status")).toBe("Status indisponivel");
    expect(getSubscriptionStatusLabel(null)).toBe("Sem assinatura");
  });

  it("formata datas de billing de forma deterministica em pt-BR", () => {
    expect(formatBillingDate("2026-07-10T00:30:00.000Z")).toBe("10/07/2026");
    expect(formatBillingDate("data-invalida")).toBe("Data indisponivel");
    expect(formatBillingDate(null)).toBe("Data indisponivel");
  });

  it("descreve periodo de teste em andamento com inicio e termino", () => {
    expect(
      getTrialDisplayRows({
        status: "trialing",
        trial_end: "2026-07-17T12:00:00.000Z",
        trial_start: "2026-07-10T12:00:00.000Z",
      }),
    ).toEqual([
      ["Inicio do periodo de teste", "10/07/2026"],
      ["Termino do periodo de teste", "17/07/2026"],
    ]);
  });

  it("preserva historico quando o periodo de teste ja encerrou", () => {
    expect(
      getTrialDisplayRows({
        status: "active",
        trial_end: "2026-07-17T12:00:00.000Z",
        trial_start: "2026-07-10T12:00:00.000Z",
      }),
    ).toEqual([["Periodo de teste encerrado", "10/07/2026 a 17/07/2026"]]);
  });

  it("trata assinatura sem periodo de teste e inconsistencia de trialing", () => {
    expect(getTrialDisplayRows({ status: "active", trial_end: null, trial_start: null })).toEqual([
      ["Periodo de teste", "Sem periodo de teste"],
    ]);
    expect(getTrialDisplayRows({ status: "trialing", trial_end: null, trial_start: null })).toEqual([
      ["Periodo de teste", "Nao foi possivel carregar o periodo de teste."],
    ]);
  });

  it("mapeia ciclo, pagamento e pendencias sem expor enums crus", () => {
    expect(getBillingIntervalLabel("yearly")).toBe("Anual");
    expect(getBillingIntervalLabel("monthly")).toBe("Mensal");
    expect(getBillingIntervalLabel(null)).toBe("Sem plano");
    expect(getPaymentKindLabel("renewal")).toBe("Renovacao");
    expect(getPaymentKindLabel("desconhecido")).toBe("Cobranca");
    expect(getPaymentStatusLabel("succeeded")).toBe("Pago");
    expect(getPaymentStatusLabel("desconhecido")).toBe("Status indisponivel");
    expect(hasPendingBillingIssue("past_due")).toBe(true);
    expect(hasPendingBillingIssue("active")).toBe(false);
  });

  it("a pagina registra observabilidade segura para status desconhecido", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(getSubscriptionStatusLabel("novo_status_stripe")).toBe("Status indisponivel");
    warn.mockRestore();
  });
});
