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

  it("nao cria item adicional no checkout inicial quando a quantidade e zero", () => {
    const subscription = read("supabase/functions/billing-create-subscription/index.ts");

    expect(subscription).toContain("if (quantity > 0) {");
    expect(subscription).toContain("items.push({ price: addonPrice.id, quantity })");
    expect(subscription).not.toContain("{ price: addonPrice.id, quantity },");
  });

  it("protege sincronizacao interna de quantidade com service role", () => {
    const shared = read("supabase/functions/_shared/billing/stripe.ts");
    const sync = read("supabase/functions/billing-sync-active-clients/index.ts");

    expect(shared).toContain("requireServiceRoleRequest");
    expect(shared).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(sync).toContain("requireServiceRoleRequest(request)");
  });

  it("mantem fallback local quando BILLING_ALLOWED_ORIGINS esta vazio", () => {
    const shared = read("supabase/functions/_shared/billing/stripe.ts");

    expect(shared).toContain('Deno.env.get("BILLING_ALLOWED_ORIGINS")?.trim() || "http://localhost:3000"');
  });

  it("coalesce jobs de quantidade por Parceiro antes de chamar Stripe", () => {
    const sync = read("supabase/functions/billing-sync-active-clients/index.ts");

    expect(sync).toContain("const jobsByPartner = new Map<string, string[]>()");
    expect(sync).toContain("for (const [partnerId, jobIds] of jobsByPartner)");
    expect(sync).toContain('.in("id", jobIds)');
  });

  it("resolve Promotion Code no backend e rejeita campos de desconto manipulaveis", () => {
    const shared = read("supabase/functions/_shared/billing/stripe.ts");
    const subscription = read("supabase/functions/billing-create-subscription/index.ts");
    const checkout = read("src/app/parceiros/checkout/checkout-payment-element.tsx");

    expect(checkout).toContain("promotionCode:");
    expect(checkout).not.toContain("couponCode:");
    expect(shared).toContain("PROMOTION_CODE_MAX_LENGTH = 64");
    expect(shared).toContain("FORBIDDEN_CLIENT_DISCOUNT_FIELDS");
    expect(shared).toContain('"couponId"');
    expect(shared).toContain('"promotionCodeId"');
    expect(shared).toContain('"percentOff"');
    expect(shared).toContain('"discountAmount"');
    expect(subscription).toContain("hasForbiddenClientDiscountField(body)");
    expect(subscription).toContain("normalizePromotionCode(body.promotionCode ?? body.couponCode)");
    expect(subscription).toContain("stripe.promotionCodes.list");
    expect(subscription).toContain("discounts: promotionCodeId ? [{ promotion_code: promotionCodeId }] : undefined");
  });
});
