import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const pageSource = fs.readFileSync(path.join(process.cwd(), "src/app/planos/page.tsx"), "utf8");

describe("planos page contract", () => {
  it("exibe cards de confianca no pagamento sem prometer seguranca absoluta", () => {
    expect(pageSource).toContain("Pagamento seguro");
    expect(pageSource).toContain("Processado pela Stripe");
    expect(pageSource).toContain("Dados protegidos");
    expect(pageSource).not.toContain("100% seguro");
  });

  it("separa faixa de adicional e CTA em area inferior estruturada", () => {
    expect(pageSource).toContain('<footer className="mt-6 flex flex-col gap-4">');
    expect(pageSource).toContain("+ {formatCurrencyCents(199)}/mes por Cliente ativo");
    expect(pageSource).toContain("Comecar teste gratis");
  });
});
