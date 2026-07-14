import { CreditCard, Info, LockKeyhole, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { CheckoutExperience } from "./checkout-experience";
import { normalizeBillingPlanSlug } from "@/lib/billing/catalog";
import { getBillableActiveClientCount, getPublicBillingCatalog, requirePartnerBillingContext, stripeIsConfigured } from "@/lib/billing/data";
import { estimateBillingCentsFromCatalog } from "@/lib/billing/pricing";

export const dynamic = "force-dynamic";

export default async function PartnerCheckoutPage({
  searchParams,
}: {
  searchParams?: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const planSlug = normalizeBillingPlanSlug(params?.plan);
  const catalog = await getPublicBillingCatalog();
  const plan = catalog.plans[planSlug];
  const { partnerId } = await requirePartnerBillingContext();
  const activeClientCount = await getBillableActiveClientCount(partnerId);
  const estimate = estimateBillingCentsFromCatalog({
    activeClientCount,
    addonUnitCents: catalog.addon.priceCents,
    billingInterval: plan.billingInterval,
    planPriceCents: plan.priceCents,
  });
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  const configured = stripeIsConfigured() && plan.isAvailable && catalog.addon.isAvailable;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-6 text-[#f1f6fa] md:px-8 lg:px-0 lg:py-[35px]">
      <header className="border-b border-[#244454]/70 pb-6">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5db7ef]">Checkout</p>
        <h1 className="mt-2 text-[30px] font-bold leading-[36px] text-[#f4f8fb] md:text-[34px]">
          Iniciar teste gratis
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-[22px] text-[#8ca1af]">
          Salve um metodo de pagamento para iniciar {plan.trialDays} dias gratuitos de periodo de teste. A assinatura sera ativada apos a confirmacao do pagamento.
        </p>
      </header>

      <CheckoutExperience
        configured={configured}
        initialSummary={{
          activeClientCount,
          addonCents: estimate.addonCents,
          addonUnitCents: catalog.addon.priceCents,
          billingInterval: plan.billingInterval,
          cycleCents: estimate.cycleCents,
          monthlyEquivalentCents: estimate.monthlyEquivalentCents,
          planCents: estimate.planCents,
          planSlug,
        }}
        paymentUnavailable={(
          <div className="rounded-[8px] border border-[#b16a06]/55 bg-[#2e2511] p-5 text-[#f1c36d]">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 size-5" />
              <div>
                <h2 className="text-[16px] font-bold">Pagamentos em configuracao</h2>
                <p className="mt-2 text-[13px] leading-5">
                  No momento, nao e possivel iniciar o pagamento. Tente novamente mais tarde.
                </p>
              </div>
            </div>
          </div>
        )}
        planName={plan.name}
        publishableKey={publishableKey}
        trustContent={(
          <div className="mt-7 grid gap-4 border-t border-[#244454]/70 pt-5 text-[13px] text-[#9fb1be] md:grid-cols-3">
            <TrustItem
              icon={<ShieldCheck className="size-4 text-[#58d881]" />}
              title="Pagamento seguro"
              description="Seus dados de pagamento sao protegidos durante todo o processo."
            />
            <TrustItem
              icon={<CreditCard className="size-4 text-[#5db7ef]" />}
              title="Processado pela Stripe"
              description="O pagamento e processado pela Stripe, plataforma especializada em pagamentos digitais."
            />
            <TrustItem
              icon={<LockKeyhole className="size-4 text-[#5db7ef]" />}
              title="Dados protegidos"
              description="Os dados do cartao sao enviados diretamente ao provedor de pagamento e nao ficam armazenados na plataforma."
            />
          </div>
        )}
      />
    </main>
  );
}

function TrustItem({
  description,
  icon,
  title,
}: {
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-[#071923]">
        {icon}
      </span>
      <span>
        <span className="block font-semibold text-[#d9e7f0]">{title}</span>
        <span className="mt-1 block leading-5 text-[#8ca1af]">{description}</span>
      </span>
    </div>
  );
}
