import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("partner subscription page contract", () => {
  it("nao exibe enums crus ou mensagens internas de desenvolvimento", () => {
    const page = read("src/app/parceiros/configuracoes/assinatura/page.tsx");
    const portalButton = read("src/app/parceiros/configuracoes/assinatura/customer-portal-button.tsx");

    expect(page).toContain("getSubscriptionStatusLabel(subscription?.status)");
    expect(page).toContain("getTrialDisplayRows(subscription)");
    expect(page).toContain("billing.financialSummary");
    expect(page).not.toContain("Nao identificado nos arquivos analisados");
    expect(page).not.toContain("Customer Portal");
    expect(page).not.toContain("Estimativa proximo ciclo");
    expect(page).not.toContain("Historico de cobrancas");
    expect(page).toContain('["Subtotal", synchronizedSubtotalLabel]');
    expect(page).toContain("Valor apos desconto");
    expect(page).toContain("Ir para o painel");
    expect(page).toContain("Consulte faturas, formas de pagamento e detalhes completos");
    expect(portalButton).not.toContain("Customer Portal");
    expect(portalButton).toContain("portal de pagamentos");
  });
});
