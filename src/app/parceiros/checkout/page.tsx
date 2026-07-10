import Link from "next/link";
import { CreditCard, Info, ShieldCheck, UsersRound } from "lucide-react";

import { CheckoutPaymentElement } from "./checkout-payment-element";
import { Button } from "@/components/ui/button";
import { BILLING_PLANS, BILLING_TRIAL_DAYS, normalizeBillingPlanSlug } from "@/lib/billing/catalog";
import { getBillableActiveClientCount, requirePartnerBillingContext, stripeIsConfigured } from "@/lib/billing/data";
import { estimateBillingCents, formatCurrencyCents } from "@/lib/billing/pricing";

export const dynamic = "force-dynamic";

export default async function PartnerCheckoutPage({
  searchParams,
}: {
  searchParams?: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const planSlug = normalizeBillingPlanSlug(params?.plan);
  const plan = BILLING_PLANS[planSlug];
  const { partnerId } = await requirePartnerBillingContext();
  const activeClientCount = await getBillableActiveClientCount(partnerId);
  const estimate = estimateBillingCents({ activeClientCount, planSlug });
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  const configured = stripeIsConfigured();

  return (
    <main className="min-h-screen bg-[#0b1720] px-5 py-6 font-['Rethink_Sans',sans-serif] text-[#f1f6fa] md:px-8 lg:px-[43px] lg:py-[35px]">
      <header className="border-b border-[#244454]/70 pb-6">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5db7ef]">Checkout</p>
        <h1 className="mt-2 text-[30px] font-bold leading-[36px] text-[#f4f8fb] md:text-[34px]">
          Iniciar teste gratis
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-[22px] text-[#8ca1af]">
          Salve um metodo de pagamento para iniciar {BILLING_TRIAL_DAYS} dias gratuitos. A assinatura e criada no backend apos a confirmacao do SetupIntent.
        </p>
      </header>

      <section className="mt-7 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-[8px] border border-[#2b4a5d]/90 bg-[#0d2635]/80 p-6">
          {!configured ? (
            <div className="rounded-[8px] border border-[#b16a06]/55 bg-[#2e2511] p-5 text-[#f1c36d]">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 size-5" />
                <div>
                  <h2 className="text-[16px] font-bold">Pagamentos em configuracao</h2>
                  <p className="mt-2 text-[13px] leading-5">
                    A estrutura de assinatura esta preparada, mas o provedor de pagamento ainda nao foi habilitado neste ambiente.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <CheckoutPaymentElement planSlug={planSlug} publishableKey={publishableKey} />
          )}

          <div className="mt-6 grid gap-3 text-[13px] text-[#9fb1be]">
            <p className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#58d881]" /> Metodo salvo via Stripe Payment Element.</p>
            <p className="flex items-center gap-2"><CreditCard className="size-4 text-[#5db7ef]" /> Cartao nao trafega pelo backend do Projeto Leo Barros.</p>
            <p className="flex items-center gap-2"><UsersRound className="size-4 text-[#5db7ef]" /> Quantidade recalculada no banco: {activeClientCount} Clientes ativos.</p>
          </div>
        </div>

        <aside className="rounded-[8px] border border-[#2b4a5d]/90 bg-[#0d2635]/80 p-6">
          <h2 className="text-[18px] font-bold text-[#eaf2f7]">Resumo</h2>
          <div className="mt-5 space-y-4 text-[14px]">
            <div className="flex justify-between gap-4">
              <span className="text-[#9fb1be]">{plan.billingInterval === "yearly" ? "Plano anual" : "Plano mensal"}</span>
              <span className="font-semibold text-[#f1f6fa]">{formatCurrencyCents(estimate.planCents)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#9fb1be]">Clientes ativos ({activeClientCount} x R$ 1,99)</span>
              <span className="font-semibold text-[#f1f6fa]">{formatCurrencyCents(estimate.addonCents)}</span>
            </div>
            <div className="border-t border-[#31536a] pt-4">
              <div className="flex justify-between gap-4">
                <span className="font-bold text-[#eaf2f7]">Proximo ciclo apos trial</span>
                <span className="font-bold text-[#f1f6fa]">{formatCurrencyCents(estimate.cycleCents)}</span>
              </div>
              {plan.billingInterval === "yearly" ? (
                <p className="mt-2 text-[12px] text-[#8ca1af]">
                  Equivalente mensal estimado: {formatCurrencyCents(estimate.monthlyEquivalentCents)}.
                </p>
              ) : null}
            </div>
          </div>
          <Button asChild className="mt-6 w-full rounded-[8px]" variant="outline">
            <Link href="/planos">Alterar plano</Link>
          </Button>
        </aside>
      </section>
    </main>
  );
}
