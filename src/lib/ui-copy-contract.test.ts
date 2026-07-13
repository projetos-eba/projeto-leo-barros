import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

const userFacingFiles = [
  "src/app/admin/configuracoes/admin-settings-view.tsx",
  "src/app/admin/dashboard/create-partner-form.tsx",
  "src/app/parceiros/checkout/checkout-experience.tsx",
  "src/app/parceiros/checkout/page.tsx",
  "src/app/parceiros/checkout/sucesso/page.tsx",
  "src/app/parceiros/clientes/partner-clients-view.tsx",
  "src/app/parceiros/configuracoes/assinatura/page.tsx",
];

const forbiddenUiCopy = [
  /Aguardando sincronizacao/i,
  /catalogo local seguro/i,
  /credenciais Stripe/i,
  /Edge Function/i,
  /estado real reconciliado/i,
  /Informar metodo de pagamento/i,
  /nesta fase/i,
  /O codigo e revalidado/i,
  /pelo backend/i,
  /SetupIntent/i,
  /Sem valor sincronizado/i,
  /webhooks dependem/i,
];

describe("contrato de copy visivel ao usuario", () => {
  it("nao deixa mensagens de desenvolvimento em telas finais", () => {
    for (const relativePath of userFacingFiles) {
      const source = fs.readFileSync(path.join(root, relativePath), "utf8");
      for (const forbidden of forbiddenUiCopy) {
        expect(source, `${relativePath} contem ${forbidden}`).not.toMatch(forbidden);
      }
    }
  });
});
