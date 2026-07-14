import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function compact(source: string) {
  return source.replace(/\s+/g, " ");
}

describe("stripe edge contract", () => {
  it("usa a versao Stripe homologada no dominio Next e nas Edge Functions", () => {
    expect(read("src/lib/billing/catalog.ts")).toContain('STRIPE_API_VERSION = "2026-06-24.dahlia"');
    expect(read("supabase/functions/_shared/billing/stripe.ts")).toContain('STRIPE_API_VERSION = "2026-06-24.dahlia"');
  });

  it("nao fixa payment_method_types card-only no SetupIntent", () => {
    expect(read("supabase/functions/billing-create-setup-intent/index.ts")).not.toContain("payment_method_types");
  });

  it("escopa SetupIntent por tentativa de checkout e nao por parceiro/plano permanente", () => {
    const setupIntent = read("supabase/functions/billing-create-setup-intent/index.ts");
    const checkout = read("src/app/parceiros/checkout/checkout-payment-element.tsx");

    expect(setupIntent).toContain("checkoutAttemptId");
    expect(setupIntent).toContain("checkout_attempt_id");
    expect(setupIntent).toContain("setup-intent:${partnerAccess.partner.id}:${planSlug}:${checkoutAttemptId}");
    expect(setupIntent).not.toContain("setup-intent:${partnerAccess.partner.id}:${planSlug}`");
    expect(checkout).toContain("createCheckoutAttemptId");
    expect(checkout).toContain("confirmedSetupIntentId");
    expect(checkout).toContain('setupResult.error.code === "setup_intent_unexpected_state"');
    expect(checkout).toContain("await createSubscription(setupIntentId)");
    expect(checkout).toContain("if (!confirmedId)");
  });

  it("nao cria produtos ou precos Stripe no bootstrap de homologacao", () => {
    const bootstrap = read("supabase/functions/stripe-bootstrap-catalog/index.ts");

    expect(bootstrap).not.toContain("products.create");
    expect(bootstrap).not.toContain("prices.create");
    expect(bootstrap).toContain("getValidatedBillingCatalog");
    expect(bootstrap).toContain("upsertCatalogProduct");
    expect(bootstrap).toContain("upsertCatalogPrice");
    expect(bootstrap).toContain('from("billing_plans").upsert');
    expect(bootstrap).toContain('from("billing_plan_addons")');
    expect(bootstrap).toContain('slug: "complete-monthly"');
    expect(bootstrap).toContain('slug: "complete-annual"');
    expect(bootstrap).toContain('slug: "active-client-monthly"');
  });

  it("sincroniza catalogo Stripe por webhook modular e checkout resolve Price local", () => {
    const webhook = read("supabase/functions/stripe-webhook/index.ts");
    const shared = read("supabase/functions/_shared/billing/stripe.ts");
    const classifier = read("supabase/functions/_shared/billing/catalog-classifier.ts");
    const repository = read("supabase/functions/_shared/billing/catalog-repository.ts");
    const subscription = read("supabase/functions/billing-create-subscription/index.ts");
    const preview = read("supabase/functions/billing-preview-subscription/index.ts");

    expect(webhook).toContain('"product.created"');
    expect(webhook).toContain('"product.updated"');
    expect(webhook).toContain('"product.deleted"');
    expect(webhook).toContain('"price.created"');
    expect(webhook).toContain('"price.updated"');
    expect(webhook).toContain('"price.deleted"');
    expect(webhook).toContain("handleStripeProductCatalogEvent");
    expect(webhook).toContain("handleStripePriceCatalogEvent");
    expect(webhook).toContain("eventType: event.type");
    expect(classifier).toContain("isLeoBillingCatalogProduct");
    expect(classifier).toContain("isLeoBillingCatalogPrice");
    expect(classifier).toContain('"hml-plan"');
    expect(classifier).toContain("BILLING_ALLOW_HML_CATALOG_FIXTURES");
    expect(repository).toContain("ignored_out_of_order");
    expect(repository).toContain('if (input.catalogRole === "hml-plan") return');
    expect(repository).toContain('if (input.kind.kind === "fixture") return');
    expect(repository).toContain("stripeObjectId: product.id");
    expect(repository).toContain("stripeObjectId: price.id");
    expect(repository).toContain('from("billing_prices").upsert');
    expect(repository).toContain('from("billing_plans")');
    expect(shared).toContain("resolveLocalCheckoutCatalog");
    expect(subscription).toContain("resolveLocalCheckoutCatalog");
    expect(preview).toContain("resolveLocalCheckoutCatalog");
    expect(classifier).not.toContain("product.name === OFFICIAL_STRIPE_PRODUCTS");
    expect(subscription).not.toContain("getValidatedBillingCatalog(stripe)");
    expect(preview).not.toContain("getValidatedBillingCatalog(stripe)");
  });

  it("permite que planos mensal e anual compartilhem o mesmo Product Stripe", () => {
    const migration = read("supabase/migrations/20260713172000_billing_plans_allow_shared_stripe_product.sql");

    expect(migration).toContain("drop index if exists public.billing_plans_stripe_product_key");
    expect(migration).toContain("billing_plans_stripe_product_idx");
    expect(migration).not.toContain("create unique index");
  });

  it("aceita Stripe live coerente com a chave e rejeita mistura de modos", () => {
    const shared = read("supabase/functions/_shared/billing/stripe.ts");
    const webhook = read("supabase/functions/stripe-webhook/index.ts");

    expect(shared).toContain('return "live"');
    expect(shared).toContain('return "test"');
    expect(shared).toContain("STRIPE_MODE_MISMATCH");
    expect(shared).not.toContain("LIVE_MODE_OBJECT");
    expect(webhook).toContain("assertStripeRuntimeMode(event.livemode, event.id)");
    expect(webhook).not.toContain("LIVE_MODE_OBJECT");
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
    const shared = compact(read("supabase/functions/_shared/billing/stripe.ts"));

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
    const compactSubscription = compact(subscription);
    const preview = read("supabase/functions/billing-preview-subscription/index.ts");
    const webhook = read("supabase/functions/stripe-webhook/index.ts");
    const checkout = read("src/app/parceiros/checkout/checkout-payment-element.tsx");
    const experience = read("src/app/parceiros/checkout/checkout-experience.tsx");

    expect(checkout).toContain("promotionCode:");
    expect(checkout).not.toContain("couponCode:");
    expect(checkout).toContain("Cartao de credito ou debito");
    expect(checkout).toContain("CARD_PAYMENT_METHOD");
    expect(checkout).not.toContain("Informar metodo de pagamento");
    expect(experience).toContain("Inserir codigo promocional");
    expect(experience).toContain('supabase.functions.invoke("billing-preview-subscription"');
    expect(preview).toContain("stripe.invoices.createPreview");
    expect(preview).toContain("hasForbiddenClientDiscountField(body)");
    expect(preview).toContain("normalizePromotionCode(body.promotionCode)");
    expect(preview).not.toContain("setupIntentId");
    expect(shared).toContain("PROMOTION_CODE_MAX_LENGTH = 64");
    expect(shared).toContain("FORBIDDEN_CLIENT_DISCOUNT_FIELDS");
    expect(shared).toContain('"couponId"');
    expect(shared).toContain('"promotionCodeId"');
    expect(shared).toContain('"percentOff"');
    expect(shared).toContain('"discountAmount"');
    expect(subscription).toContain("hasForbiddenClientDiscountField(body)");
    expect(compactSubscription).toContain("normalizePromotionCode( body.promotionCode ?? body.couponCode, )");
    expect(compactSubscription).toContain("resolveActivePromotionCode( stripe, promotionCodeText, )");
    expect(compactSubscription).toContain("discounts: promotionCodeId ? [{ promotion_code: promotionCodeId }] : undefined");
    expect(subscription).toContain("partner_subscription_financial_summaries");
    expect(subscription).toContain("stripe.invoices.createPreview");
    expect(webhook).toContain("syncFinancialSummaryFromStripeSubscription");
    expect(webhook).toContain("partner_subscription_financial_summaries");
    expect(webhook).toContain("stripe.invoices.createPreview");
    expect(webhook).toContain("persistedSummary?.discount_code");
  });
});
