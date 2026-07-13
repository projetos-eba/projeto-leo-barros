import {
  createClient,
  type SupabaseClient,
} from "npm:@supabase/supabase-js@2.98.0";
import Stripe from "npm:stripe@22.3.1";

export const STRIPE_API_VERSION = "2026-06-24.dahlia";
export const TRIAL_DAYS = 7;
export const ACTIVE_CLIENT_UNIT_CENTS = 199;
export const PROMOTION_CODE_MAX_LENGTH = 64;
export const FORBIDDEN_CLIENT_DISCOUNT_FIELDS = [
  "amountOff",
  "couponId",
  "discountAmount",
  "discountId",
  "percentOff",
  "promotionCodeId",
] as const;

export type BillingPlanSlug = "complete-monthly" | "complete-annual";

export const PLAN_LOOKUP_KEYS: Record<BillingPlanSlug, string> = {
  "complete-monthly": "complete_monthly_brl",
  "complete-annual": "complete_annual_brl",
};

export const ADDON_LOOKUP_KEY = "active_client_monthly_brl";

export const OFFICIAL_STRIPE_PRODUCTS = {
  complete: {
    id: "prod_UrR2wxpxk9UJxV",
    name: "Plano Completo \u2014 Nutri\u00e7\u00e3o + Treinamento",
  },
  activeClientAddon: {
    id: "prod_UrRGM5chV5eXLU",
    name: "Cliente ativo adicional",
  },
} as const;

export const OFFICIAL_STRIPE_PRICES = {
  "complete-monthly": {
    billingScheme: "per_unit",
    currency: "brl",
    id: "price_1TriAiPELBIpM2MneLhOLwW4",
    interval: "month",
    lookupKey: PLAN_LOOKUP_KEYS["complete-monthly"],
    productId: OFFICIAL_STRIPE_PRODUCTS.complete.id,
    unitAmount: 11990,
    usageType: "licensed",
  },
  "complete-annual": {
    billingScheme: "per_unit",
    currency: "brl",
    id: "price_1TriAiPELBIpM2Mn7s4EpKt5",
    interval: "year",
    lookupKey: PLAN_LOOKUP_KEYS["complete-annual"],
    productId: OFFICIAL_STRIPE_PRODUCTS.complete.id,
    unitAmount: 119880,
    usageType: "licensed",
  },
  "active-client-monthly": {
    billingScheme: "per_unit",
    currency: "brl",
    id: "price_1TriNoPELBIpM2MnQRkRINCT",
    interval: "month",
    lookupKey: ADDON_LOOKUP_KEY,
    productId: OFFICIAL_STRIPE_PRODUCTS.activeClientAddon.id,
    unitAmount: ACTIVE_CLIENT_UNIT_CENTS,
    usageType: "licensed",
  },
} as const;

type StripeRuntimeMode = "live" | "test";

function stripeRuntimeModeFromKey(secretKey: string): StripeRuntimeMode | null {
  if (/^(sk|rk)_live_/.test(secretKey)) return "live";
  if (/^(sk|rk)_test_/.test(secretKey)) return "test";
  return null;
}

export function getStripeRuntimeMode(): StripeRuntimeMode | null {
  const secretKey = Deno.env.get("STRIPE_SECRET_KEY")?.trim();
  return secretKey ? stripeRuntimeModeFromKey(secretKey) : null;
}

function allowedOrigins() {
  return (Deno.env.get("BILLING_ALLOWED_ORIGINS")?.trim() ||
    "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function originIsAllowed(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || allowedOrigins().includes(origin);
}

export function corsHeadersForRequest(request?: Request) {
  const origins = allowedOrigins();
  const origin = request?.headers.get("origin");
  const allowedOrigin = origin && origins.includes(origin)
    ? origin
    : origins[0] ?? "http://localhost:3000";

  return {
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": allowedOrigin,
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
    "Vary": "Origin",
  };
}

export const jsonHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin":
    Deno.env.get("BILLING_ALLOWED_ORIGINS")?.split(",")[0]?.trim() ||
    "http://localhost:3000",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
  "Vary": "Origin",
};

export function jsonResponse(
  status: number,
  body: Record<string, unknown>,
  request?: Request,
) {
  return new Response(JSON.stringify(body), {
    headers: corsHeadersForRequest(request),
    status,
  });
}

export function optionsResponse(request: Request) {
  return new Response(null, {
    headers: corsHeadersForRequest(request),
    status: originIsAllowed(request) ? 204 : 403,
  });
}

export function forbiddenOriginResponse(request: Request) {
  return jsonResponse(403, {
    error: {
      code: "ORIGIN_NOT_ALLOWED",
      message: "Origem nao autorizada para billing.",
    },
  }, request);
}

export function stripeNotConfiguredResponse() {
  return jsonResponse(503, {
    error: {
      code: "STRIPE_NOT_CONFIGURED",
      message: "O provedor de pagamento ainda nao esta configurado.",
    },
  });
}

export function getStripeClient() {
  const secretKey = Deno.env.get("STRIPE_SECRET_KEY")?.trim();
  if (!secretKey) return null;

  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION as Stripe.LatestApiVersion,
  });
}

export function assertStripeRuntimeMode(
  livemode: boolean | undefined,
  objectId: string,
) {
  const runtimeMode = getStripeRuntimeMode();
  if (!runtimeMode) throw new Error("STRIPE_KEY_MODE_UNRECOGNIZED");

  const expectedLivemode = runtimeMode === "live";
  if (Boolean(livemode) !== expectedLivemode) {
    throw new Error(`STRIPE_MODE_MISMATCH:${objectId}`);
  }
}

export function getAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_ADMIN_NOT_CONFIGURED");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getAuthenticatedProfile(
  request: Request,
  supabase: SupabaseClient,
) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const { data: userData, error: userError } = await supabase.auth.getUser(
    token,
  );
  if (userError || !userData.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, status, email, display_name")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  return profile;
}

export async function requirePartner(
  request: Request,
  supabase: SupabaseClient,
) {
  const profile = await getAuthenticatedProfile(request, supabase);
  if (!profile || profile.role !== "parceiro" || profile.status !== "active") {
    return {
      error: jsonResponse(403, {
        error: { code: "FORBIDDEN", message: "Acesso nao autorizado." },
      }),
    };
  }

  const { data: partner } = await supabase
    .from("partners")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!partner) {
    return {
      error: jsonResponse(403, {
        error: {
          code: "PARTNER_NOT_FOUND",
          message: "Parceiro nao encontrado.",
        },
      }),
    };
  }

  return { partner, profile };
}

export async function requireAdmin(request: Request, supabase: SupabaseClient) {
  const profile = await getAuthenticatedProfile(request, supabase);
  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    return {
      error: jsonResponse(403, {
        error: { code: "FORBIDDEN", message: "Acesso nao autorizado." },
      }),
    };
  }

  return { profile };
}

export function requireServiceRoleRequest(request: Request) {
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  if (!serviceRoleKey || token !== serviceRoleKey) {
    return {
      error: jsonResponse(403, {
        error: {
          code: "FORBIDDEN",
          message: "Acesso interno nao autorizado.",
        },
      }, request),
    };
  }

  return { ok: true };
}

export function parsePlanSlug(value: unknown): BillingPlanSlug | null {
  return value === "complete-monthly" || value === "complete-annual"
    ? value
    : null;
}

export function hasForbiddenClientDiscountField(body: Record<string, unknown>) {
  return FORBIDDEN_CLIENT_DISCOUNT_FIELDS.some((field) =>
    Object.prototype.hasOwnProperty.call(body, field)
  );
}

export function normalizePromotionCode(value: unknown) {
  if (value === undefined || value === null) return { code: null };
  if (typeof value !== "string") {
    return {
      error: {
        code: "INVALID_PROMOTION_CODE",
        message: "Codigo promocional invalido ou indisponivel.",
      },
    };
  }

  const code = value.trim();
  if (!code) return { code: null };
  if (code.length > PROMOTION_CODE_MAX_LENGTH) {
    return {
      error: {
        code: "PROMOTION_CODE_TOO_LONG",
        message: "Codigo promocional invalido ou indisponivel.",
      },
    };
  }

  return { code };
}

export async function activeClientCount(
  supabase: SupabaseClient,
  partnerId: string,
) {
  const { data, error } = await supabase.rpc("billing_active_client_count", {
    target_partner_id: partnerId,
  });
  if (error) throw error;
  return typeof data === "number" ? data : 0;
}

export async function resolvePartnerStripeCustomer(
  stripe: Stripe,
  partnerAccess: {
    partner: { id: string };
    profile: { display_name: string; email: string; id: string };
  },
) {
  const customers = await stripe.customers.search({
    limit: 1,
    query: `metadata['partner_id']:'${partnerAccess.partner.id}'`,
  });
  const existing = customers.data[0];
  if (existing) {
    assertStripeRuntimeMode(existing.livemode, existing.id);
    return existing.id;
  }

  const customer = await stripe.customers.create({
    email: partnerAccess.profile.email,
    metadata: {
      partner_id: partnerAccess.partner.id,
      profile_id: partnerAccess.profile.id,
    },
    name: partnerAccess.profile.display_name,
  }, {
    idempotencyKey: `customer:${partnerAccess.partner.id}`,
  });
  assertStripeRuntimeMode(customer.livemode, customer.id);
  return customer.id;
}

export function describeCoupon(coupon: Stripe.Coupon) {
  if (typeof coupon.percent_off === "number") {
    return `${coupon.percent_off}% de desconto`;
  }

  if (typeof coupon.amount_off === "number") {
    return `${
      new Intl.NumberFormat("pt-BR", {
        currency: (coupon.currency ?? "brl").toUpperCase(),
        style: "currency",
      }).format(coupon.amount_off / 100)
    } de desconto`;
  }

  return "Desconto aplicado";
}

export type BillingFinancialSummaryInput = {
  activeClientQuantity: number;
  currency?: string | null;
  discountAmountCents?: number | null;
  invoiceId?: string | null;
  planSlug: BillingPlanSlug;
  source: "stripe_preview" | "stripe_webhook" | "manual_reconcile";
  stripeEventCreatedAt?: string | null;
  stripeSubscriptionId?: string | null;
  totalAfterDiscountCents?: number | null;
  promotion?: {
    code?: string | null;
    couponId?: string | null;
    duration?: string | null;
    label?: string | null;
    promotionCodeId?: string | null;
  } | null;
};

export function stripeInvoiceDiscountCents(
  invoice: {
    total_discount_amounts?: Array<{ amount?: number | null }> | null;
  },
) {
  return invoice.total_discount_amounts?.reduce(
    (total, discount) => total + (discount.amount ?? 0),
    0,
  ) ?? 0;
}

export function buildBillingFinancialSummary(
  input: BillingFinancialSummaryInput,
) {
  const planBaseAmountCents = OFFICIAL_STRIPE_PRICES[input.planSlug].unitAmount;
  const activeClientSubtotalCents = input.activeClientQuantity *
    ACTIVE_CLIENT_UNIT_CENTS;
  const localSubtotalCents = planBaseAmountCents + activeClientSubtotalCents;
  const discountAmountCents = Math.max(0, input.discountAmountCents ?? 0);
  const totalAfterDiscountCents = Math.max(
    0,
    input.totalAfterDiscountCents ?? localSubtotalCents - discountAmountCents,
  );

  return {
    active_client_quantity: input.activeClientQuantity,
    active_client_subtotal_cents: activeClientSubtotalCents,
    active_client_unit_amount_cents: ACTIVE_CLIENT_UNIT_CENTS,
    currency: (input.currency ?? "brl").toLowerCase(),
    discount_amount_cents: discountAmountCents,
    discount_code: input.promotion?.code ?? null,
    discount_duration: input.promotion?.duration ?? null,
    discount_label: input.promotion?.label ?? null,
    plan_base_amount_cents: planBaseAmountCents,
    source: input.source,
    stripe_coupon_id: input.promotion?.couponId ?? null,
    stripe_event_created_at: input.stripeEventCreatedAt ?? null,
    stripe_invoice_id: input.invoiceId ?? null,
    stripe_promotion_code_id: input.promotion?.promotionCodeId ?? null,
    stripe_subscription_id: input.stripeSubscriptionId ?? null,
    subtotal_cents: localSubtotalCents,
    synced_at: new Date().toISOString(),
    total_after_discount_cents: totalAfterDiscountCents,
  };
}

export async function resolveActivePromotionCode(stripe: Stripe, code: string) {
  const promotionCodes = await stripe.promotionCodes.list({
    active: true,
    code,
    expand: ["data.promotion.coupon"],
    limit: 1,
  });
  const promotionCode = promotionCodes.data[0] ?? null;
  if (!promotionCode) return null;
  assertStripeRuntimeMode(promotionCode.livemode, promotionCode.id);
  return promotionCode;
}

export async function resolvePriceByLookupKey(
  stripe: Stripe,
  lookupKey: string,
) {
  const prices = await stripe.prices.list({
    active: true,
    expand: ["data.product"],
    limit: 1,
    lookup_keys: [lookupKey],
  });
  return prices.data[0] ?? null;
}

function productId(value: string | Stripe.Product | Stripe.DeletedProduct) {
  return typeof value === "string" ? value : value.id;
}

async function validateProduct(
  stripe: Stripe,
  expected:
    typeof OFFICIAL_STRIPE_PRODUCTS[keyof typeof OFFICIAL_STRIPE_PRODUCTS],
  reconcileName: boolean,
) {
  const product = await stripe.products.retrieve(expected.id);
  assertStripeRuntimeMode(product.livemode, expected.id);
  if (!product.active) throw new Error(`INACTIVE_PRODUCT:${expected.id}`);

  if (product.name !== expected.name) {
    if (!reconcileName) throw new Error(`PRODUCT_NAME_MISMATCH:${expected.id}`);
    return await stripe.products.update(expected.id, { name: expected.name });
  }

  return product;
}

function validateLiveProduct(
  product: string | Stripe.Product | Stripe.DeletedProduct,
  expectedName: string,
) {
  if (typeof product === "string") {
    throw new Error(`PRICE_PRODUCT_NOT_EXPANDED:${product}`);
  }
  if ("deleted" in product && product.deleted) {
    throw new Error(`DELETED_PRODUCT:${product.id}`);
  }
  assertStripeRuntimeMode(product.livemode, product.id);
  if (!product.active) throw new Error(`INACTIVE_PRODUCT:${product.id}`);
  if (product.name !== expectedName) {
    throw new Error(`PRODUCT_NAME_MISMATCH:${product.id}`);
  }
  return product;
}

async function validatePrice(
  stripe: Stripe,
  expected: typeof OFFICIAL_STRIPE_PRICES[keyof typeof OFFICIAL_STRIPE_PRICES],
) {
  const price = await stripe.prices.retrieve(expected.id);
  assertStripeRuntimeMode(price.livemode, expected.id);

  const lookupMatches = await stripe.prices.list({
    active: true,
    limit: 100,
    lookup_keys: [expected.lookupKey],
  });
  lookupMatches.data.forEach((candidate) =>
    assertStripeRuntimeMode(candidate.livemode, candidate.id)
  );
  const activeIds = lookupMatches.data.map((candidate) => candidate.id);
  if (activeIds.length !== 1 || activeIds[0] !== expected.id) {
    throw new Error(`LOOKUP_KEY_CONFLICT:${expected.lookupKey}`);
  }

  if (
    !price.active ||
    productId(price.product) !== expected.productId ||
    price.unit_amount !== expected.unitAmount ||
    price.currency !== expected.currency ||
    price.recurring?.interval !== expected.interval ||
    price.recurring?.usage_type !== expected.usageType ||
    price.lookup_key !== expected.lookupKey ||
    price.billing_scheme !== expected.billingScheme
  ) {
    throw new Error(`PRICE_DIVERGENCE:${expected.id}`);
  }

  return price;
}

async function validatePriceByLookupKey(
  stripe: Stripe,
  expected: typeof OFFICIAL_STRIPE_PRICES[keyof typeof OFFICIAL_STRIPE_PRICES],
  expectedProductName: string,
) {
  const lookupMatches = await stripe.prices.list({
    active: true,
    expand: ["data.product"],
    limit: 100,
    lookup_keys: [expected.lookupKey],
  });
  lookupMatches.data.forEach((candidate) =>
    assertStripeRuntimeMode(candidate.livemode, candidate.id)
  );
  if (lookupMatches.data.length !== 1) {
    throw new Error(`LOOKUP_KEY_CONFLICT:${expected.lookupKey}`);
  }

  const price = lookupMatches.data[0];
  if (
    !price.active ||
    price.unit_amount !== expected.unitAmount ||
    price.currency !== expected.currency ||
    price.recurring?.interval !== expected.interval ||
    price.recurring?.usage_type !== expected.usageType ||
    price.lookup_key !== expected.lookupKey ||
    price.billing_scheme !== expected.billingScheme
  ) {
    throw new Error(`PRICE_DIVERGENCE:${price.id}`);
  }

  const product = validateLiveProduct(price.product, expectedProductName);
  return { price, product };
}

export async function getValidatedBillingCatalog(
  stripe: Stripe,
  options: { reconcileProductNames?: boolean } = {},
) {
  const runtimeMode = getStripeRuntimeMode();
  if (runtimeMode === "live") {
    const monthly = await validatePriceByLookupKey(
      stripe,
      OFFICIAL_STRIPE_PRICES["complete-monthly"],
      OFFICIAL_STRIPE_PRODUCTS.complete.name,
    );
    const annual = await validatePriceByLookupKey(
      stripe,
      OFFICIAL_STRIPE_PRICES["complete-annual"],
      OFFICIAL_STRIPE_PRODUCTS.complete.name,
    );
    const activeClientAddon = await validatePriceByLookupKey(
      stripe,
      OFFICIAL_STRIPE_PRICES["active-client-monthly"],
      OFFICIAL_STRIPE_PRODUCTS.activeClientAddon.name,
    );

    if (monthly.product.id !== annual.product.id) {
      throw new Error("PLAN_PRODUCT_MISMATCH");
    }

    return {
      addonPrice: activeClientAddon.price,
      planPrices: {
        "complete-monthly": monthly.price,
        "complete-annual": annual.price,
      },
      products: {
        activeClientAddon: activeClientAddon.product,
        complete: monthly.product,
      },
    };
  }

  await validateProduct(
    stripe,
    OFFICIAL_STRIPE_PRODUCTS.complete,
    Boolean(options.reconcileProductNames),
  );
  await validateProduct(
    stripe,
    OFFICIAL_STRIPE_PRODUCTS.activeClientAddon,
    Boolean(options.reconcileProductNames),
  );

  const monthly = await validatePrice(
    stripe,
    OFFICIAL_STRIPE_PRICES["complete-monthly"],
  );
  const annual = await validatePrice(
    stripe,
    OFFICIAL_STRIPE_PRICES["complete-annual"],
  );
  const activeClientAddon = await validatePrice(
    stripe,
    OFFICIAL_STRIPE_PRICES["active-client-monthly"],
  );

  return {
    addonPrice: activeClientAddon,
    planPrices: {
      "complete-monthly": monthly,
      "complete-annual": annual,
    },
    products: {
      activeClientAddon: { id: productId(activeClientAddon.product) },
      complete: { id: productId(monthly.product) },
    },
  };
}
