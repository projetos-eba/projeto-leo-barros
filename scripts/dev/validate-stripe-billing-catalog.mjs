import fs from "node:fs";
import path from "node:path";
import Stripe from "stripe";

const STRIPE_API_VERSION = "2026-06-24.dahlia";

const products = {
  complete: {
    id: "prod_UrR2wxpxk9UJxV",
    name: "Plano Completo \u2014 Nutri\u00e7\u00e3o + Treinamento",
  },
  activeClientAddon: {
    id: "prod_UrRGM5chV5eXLU",
    name: "Cliente ativo adicional",
  },
};

const prices = {
  monthly: {
    billing_scheme: "per_unit",
    currency: "brl",
    id: "price_1TriAiPELBIpM2MneLhOLwW4",
    interval: "month",
    lookup_key: "complete_monthly_brl",
    product: products.complete.id,
    unit_amount: 11990,
    usage_type: "licensed",
  },
  annual: {
    billing_scheme: "per_unit",
    currency: "brl",
    id: "price_1TriAiPELBIpM2Mn7s4EpKt5",
    interval: "year",
    lookup_key: "complete_annual_brl",
    product: products.complete.id,
    unit_amount: 119880,
    usage_type: "licensed",
  },
  activeClientAddon: {
    billing_scheme: "per_unit",
    currency: "brl",
    id: "price_1TriNoPELBIpM2MnQRkRINCT",
    interval: "month",
    lookup_key: "active_client_monthly_brl",
    product: products.activeClientAddon.id,
    unit_amount: 199,
    usage_type: "licensed",
  },
};

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs.readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/))
      .filter(Boolean)
      .map((match) => [match[1], match[2].trim().replace(/^['"]|['"]$/g, "")]),
  );
}

function loadEnv() {
  return {
    ...readEnvFile(".env"),
    ...readEnvFile(".env.local"),
    ...readEnvFile("supabase/functions/.env"),
    ...process.env,
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function productId(value) {
  return typeof value === "string" ? value : value?.id;
}

async function main() {
  const env = loadEnv();
  assert(env.RUN_STRIPE_E2E === "1", "Defina RUN_STRIPE_E2E=1 para executar chamadas reais ao Stripe de teste.");
  assert(/^pk_test_/.test(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""), "Publishable key Stripe deve ser pk_test.");
  assert(/^(sk|rk)_test_/.test(env.STRIPE_SECRET_KEY ?? ""), "Secret/restricted key Stripe deve ser test.");

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION });
  const reconcileNames = env.BILLING_RECONCILE_PRODUCT_NAMES === "1";
  const evidence = [];

  for (const expected of Object.values(products)) {
    let product = await stripe.products.retrieve(expected.id);
    assert(product.livemode === false, `Produto live detectado: ${expected.id}`);
    assert(product.active === true, `Produto inativo: ${expected.id}`);
    if (product.name !== expected.name && reconcileNames) {
      product = await stripe.products.update(expected.id, { name: expected.name });
    }
    assert(product.name === expected.name, `Nome divergente no produto ${expected.id}`);
    evidence.push({ active: product.active, id: product.id, livemode: product.livemode, object: "product" });
  }

  for (const expected of Object.values(prices)) {
    const price = await stripe.prices.retrieve(expected.id);
    assert(price.livemode === false, `Price live detectado: ${expected.id}`);
    assert(price.active === true, `Price inativo: ${expected.id}`);
    assert(productId(price.product) === expected.product, `Produto divergente no price ${expected.id}`);
    assert(price.unit_amount === expected.unit_amount, `Valor divergente no price ${expected.id}`);
    assert(price.currency === expected.currency, `Moeda divergente no price ${expected.id}`);
    assert(price.recurring?.interval === expected.interval, `Intervalo divergente no price ${expected.id}`);
    assert(price.recurring?.usage_type === expected.usage_type, `Usage type divergente no price ${expected.id}`);
    assert(price.lookup_key === expected.lookup_key, `Lookup key divergente no price ${expected.id}`);
    assert(price.billing_scheme === expected.billing_scheme, `Billing scheme divergente no price ${expected.id}`);

    const lookupMatches = await stripe.prices.list({ active: true, limit: 100, lookup_keys: [expected.lookup_key] });
    assert(lookupMatches.data.every((candidate) => candidate.livemode === false), `Lookup live detectado: ${expected.lookup_key}`);
    assert(lookupMatches.data.length === 1 && lookupMatches.data[0].id === expected.id, `Conflito de lookup key: ${expected.lookup_key}`);
    evidence.push({ active: price.active, id: price.id, livemode: price.livemode, lookup_key: price.lookup_key, object: "price" });
  }

  const manifest = {
    apiVersion: STRIPE_API_VERSION,
    generatedAt: new Date().toISOString(),
    resources: evidence,
  };

  if (env.BILLING_REPORT_DIR) {
    fs.mkdirSync(env.BILLING_REPORT_DIR, { recursive: true });
    fs.writeFileSync(path.join(env.BILLING_REPORT_DIR, "resource-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  }

  console.table(evidence);
}

main().catch((error) => {
  console.error(JSON.stringify({ code: "STRIPE_BILLING_CATALOG_E2E_FAILED", message: error.message }));
  process.exit(1);
});
