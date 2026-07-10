import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("stripe edge contract", () => {
  it("usa a versao Stripe homologada no dominio Next e nas Edge Functions", () => {
    expect(read("src/lib/billing/catalog.ts")).toContain('STRIPE_API_VERSION = "2026-06-24.dahlia"');
    expect(read("supabase/functions/_shared/billing/stripe.ts")).toContain('STRIPE_API_VERSION = "2026-06-24.dahlia"');
  });

  it("nao fixa payment_method_types card-only no SetupIntent", () => {
    expect(read("supabase/functions/billing-create-setup-intent/index.ts")).not.toContain("payment_method_types");
  });

  it("nao cria produtos ou precos Stripe no bootstrap de homologacao", () => {
    const bootstrap = read("supabase/functions/stripe-bootstrap-catalog/index.ts");

    expect(bootstrap).not.toContain("products.create");
    expect(bootstrap).not.toContain("prices.create");
    expect(bootstrap).toContain("getValidatedBillingCatalog");
  });

  it("mantem atualizacao de quantidade sem proporcionalidade", () => {
    const sync = read("supabase/functions/billing-sync-active-clients/index.ts");
    const subscription = read("supabase/functions/billing-create-subscription/index.ts");

    expect(sync).toContain('proration_behavior: "none"');
    expect(subscription).toContain('proration_behavior: "none"');
  });
});
