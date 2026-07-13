import Link from "next/link";
import { CreditCard, ExternalLink, UsersRound } from "lucide-react";

import { CustomerPortalButton } from "./customer-portal-button";
import { Button } from "@/components/ui/button";
import { getPartnerBillingOverview } from "@/lib/billing/data";
import {
  formatBillingDate,
  getBillingIntervalLabel,
  getSubscriptionStatusLabel,
  getTrialDisplayRows,
  hasPendingBillingIssue,
  isKnownSubscriptionStatus,
} from "@/lib/billing/presentation";
import { formatCurrencyCents } from "@/lib/billing/pricing";

export const dynamic = "force-dynamic";

export default async function PartnerSubscriptionSettingsPage() {
  const billing = await getPartnerBillingOverview();
  const subscription = billing.subscription;
  const financialSummary = billing.financialSummary;
  const trialRows = getTrialDisplayRows(subscription);
  const canAccessDashboard = subscription?.status === "trialing" || subscription?.status === "active";
  const basePlanLabel = billing.plan
    ? `${formatCurrencyCents(financialSummary?.plan_base_amount_cents ?? billing.plan.price_cents)}/${billing.plan.billing_interval === "yearly" ? "ano" : "mes"}`
    : "Sem plano";
  const activeClientCount = financialSummary?.active_client_quantity ?? billing.activeClientCount;
  const addonAmountCents = financialSummary?.active_client_subtotal_cents ?? billing.activeClientCount * billing.addonUnitCents;
  const discountLabel = financialSummary?.discount_amount_cents
    ? `${financialSummary.discount_code ?? "Desconto"} - ${financialSummary.discount_label ?? "Desconto aplicado"} (${formatCurrencyCents(financialSummary.discount_amount_cents)})`
      : financialSummary
        ? "Sem desconto aplicado"
      : subscription?.stripe_subscription_id
        ? "Em processamento"
        : "Sem desconto identificado";
  const synchronizedSubtotalLabel = financialSummary
    ? formatCurrencyCents(financialSummary.subtotal_cents)
    : subscription?.stripe_subscription_id
      ? "Em processamento"
      : "Sem assinatura";
  const totalAfterDiscountLabel = financialSummary
    ? formatCurrencyCents(financialSummary.total_after_discount_cents)
    : subscription && billing.estimate
      ? formatCurrencyCents(billing.estimate.cycleCents)
      : "Sem assinatura";

  if (subscription?.status && !isKnownSubscriptionStatus(subscription.status)) {
    console.warn(JSON.stringify({
      code: "BILLING_SUBSCRIPTION_STATUS_UNMAPPED",
      subscriptionId: subscription.id,
      technicalStatus: subscription.status,
    }));
  }

  if (subscription?.status === "trialing" && (!subscription.trial_start || !subscription.trial_end)) {
    console.error(JSON.stringify({
      code: "BILLING_TRIAL_PERIOD_MISSING",
      subscriptionId: subscription.id,
      technicalStatus: subscription.status,
    }));
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-6 text-[#f1f6fa] md:px-8 lg:px-0 lg:py-[35px]">
      <header className="border-b border-[#244454]/70 pb-6">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5db7ef]">Configuracoes</p>
        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[30px] font-bold leading-[36px] text-[#f4f8fb] md:text-[34px]">Assinatura</h1>
            <p className="mt-2 max-w-2xl text-[15px] leading-[22px] text-[#8ca1af]">
              Acompanhe os dados essenciais do plano e gerencie pagamentos em um ambiente seguro.
            </p>
          </div>
          {canAccessDashboard ? (
            <Button asChild className="h-10 rounded-[8px]">
              <Link href="/parceiros/dashboard">Ir para o painel</Link>
            </Button>
          ) : null}
        </div>
      </header>

      {!billing.stripeConfigured ? (
        <section className="mt-6 rounded-[8px] border border-[#b16a06]/55 bg-[#2e2511] p-5 text-[#f1c36d]">
          <h2 className="text-[16px] font-bold">Pagamentos temporariamente indisponiveis</h2>
          <p className="mt-2 text-[13px] leading-5">
            No momento, nao e possivel abrir informacoes de pagamento. Tente novamente mais tarde.
          </p>
        </section>
      ) : null}

      <section className="mt-7 grid gap-4 md:grid-cols-2">
        <div className="rounded-[8px] border border-[#2b4a5d]/90 bg-[#0d2635]/80 p-5">
          <CreditCard className="size-5 text-[#5db7ef]" />
          <p className="mt-4 text-[13px] text-[#8ca1af]">Status da assinatura</p>
          <p className="mt-1 text-[24px] font-bold text-[#f1f6fa]">{getSubscriptionStatusLabel(subscription?.status)}</p>
        </div>
        <div className="rounded-[8px] border border-[#2b4a5d]/90 bg-[#0d2635]/80 p-5">
          <UsersRound className="size-5 text-[#58d881]" />
          <p className="mt-4 text-[13px] text-[#8ca1af]">Clientes ativos</p>
          <p className="mt-1 text-[24px] font-bold text-[#f1f6fa]">{activeClientCount}</p>
        </div>
      </section>

      <section className="mt-6 rounded-[8px] border border-[#2b4a5d]/90 bg-[#0d2635]/80 p-6">
        <h2 className="text-[18px] font-bold">Dados da assinatura</h2>
        <dl className="mt-5 grid gap-4 text-[14px] sm:grid-cols-2">
          {[
            ["Plano", billing.plan?.name ?? "Sem plano"],
            ["Ciclo", getBillingIntervalLabel(billing.plan?.billing_interval)],
            ["Plano-base", basePlanLabel],
            ["Subtotal", synchronizedSubtotalLabel],
            ["Desconto ativo", discountLabel],
            ["Valor apos desconto", totalAfterDiscountLabel],
            ["Clientes ativos", String(activeClientCount)],
            ["Adicional atual", `${formatCurrencyCents(addonAmountCents)}/mes`],
            ...trialRows,
            ["Proxima renovacao", formatBillingDate(subscription?.current_period_end)],
            ["Cancelamento agendado", subscription?.cancel_at_period_end ? "Sim" : "Nao"],
            ["Pagamento pendente ou falho", hasPendingBillingIssue(subscription?.status) ? "Sim" : "Nao"],
          ].map(([label, value]) => (
            <div className="rounded-[8px] border border-[#294657]/70 bg-[#0b2230] p-4" key={label}>
              <dt className="text-[12px] text-[#8ca1af]">{label}</dt>
              <dd className="mt-1 font-semibold text-[#eaf2f7]">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 rounded-[8px] border border-[#294657]/70 bg-[#0b2230] p-4">
          <div className="flex items-start gap-3">
            <ExternalLink className="mt-0.5 size-5 shrink-0 text-[#5db7ef]" />
            <div>
              <h3 className="text-[15px] font-bold text-[#eaf2f7]">Gerenciar pagamentos</h3>
              <p className="mt-1 max-w-2xl text-[13px] leading-5 text-[#8ca1af]">
                Consulte faturas, formas de pagamento e detalhes completos da cobranca no portal de pagamentos.
              </p>
              <CustomerPortalButton disabled={!billing.stripeConfigured || !subscription?.stripe_customer_id} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
