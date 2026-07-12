import { CreditCard, ReceiptText, UsersRound } from "lucide-react";

import { CustomerPortalButton } from "./customer-portal-button";
import { getPartnerBillingOverview } from "@/lib/billing/data";
import {
  formatBillingDate,
  getBillingIntervalLabel,
  getPaymentKindLabel,
  getPaymentStatusLabel,
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
  const trialRows = getTrialDisplayRows(subscription);

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
        <h1 className="mt-2 text-[30px] font-bold leading-[36px] text-[#f4f8fb] md:text-[34px]">Assinatura</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-[22px] text-[#8ca1af]">
          Gerencie plano, Clientes ativos faturaveis, faturas e estado financeiro do Parceiro.
        </p>
      </header>

      {!billing.stripeConfigured ? (
        <section className="mt-6 rounded-[8px] border border-[#b16a06]/55 bg-[#2e2511] p-5 text-[#f1c36d]">
          <h2 className="text-[16px] font-bold">Stripe ainda nao configurado</h2>
          <p className="mt-2 text-[13px] leading-5">
            A pagina usa catalogo local seguro. Portal de pagamentos, cobrancas reais e webhooks dependem das credenciais Stripe.
          </p>
        </section>
      ) : null}

      <section className="mt-7 grid gap-4 md:grid-cols-3">
        <div className="rounded-[8px] border border-[#2b4a5d]/90 bg-[#0d2635]/80 p-5">
          <CreditCard className="size-5 text-[#5db7ef]" />
          <p className="mt-4 text-[13px] text-[#8ca1af]">Status da assinatura</p>
          <p className="mt-1 text-[24px] font-bold text-[#f1f6fa]">{getSubscriptionStatusLabel(subscription?.status)}</p>
        </div>
        <div className="rounded-[8px] border border-[#2b4a5d]/90 bg-[#0d2635]/80 p-5">
          <UsersRound className="size-5 text-[#58d881]" />
          <p className="mt-4 text-[13px] text-[#8ca1af]">Clientes ativos</p>
          <p className="mt-1 text-[24px] font-bold text-[#f1f6fa]">{billing.activeClientCount}</p>
        </div>
        <div className="rounded-[8px] border border-[#2b4a5d]/90 bg-[#0d2635]/80 p-5">
          <ReceiptText className="size-5 text-[#5db7ef]" />
          <p className="mt-4 text-[13px] text-[#8ca1af]">Estimativa proximo ciclo</p>
          <p className="mt-1 text-[24px] font-bold text-[#f1f6fa]">
            {billing.estimate ? formatCurrencyCents(billing.estimate.cycleCents) : "R$ 0,00"}
          </p>
        </div>
      </section>

      <section className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-[8px] border border-[#2b4a5d]/90 bg-[#0d2635]/80 p-6">
          <h2 className="text-[18px] font-bold">Dados da assinatura</h2>
          <dl className="mt-5 grid gap-4 text-[14px] sm:grid-cols-2">
            {[
              ["Plano", billing.plan?.name ?? "Sem plano"],
              ["Ciclo de cobranca", getBillingIntervalLabel(billing.plan?.billing_interval)],
              ...trialRows,
              ["Proxima renovacao", formatBillingDate(subscription?.current_period_end)],
              ["Cancelamento agendado", subscription?.cancel_at_period_end ? "Sim" : "Nao"],
              ["Preco por Cliente ativo", formatCurrencyCents(billing.addonUnitCents)],
              ["Pagamento pendente ou falho", hasPendingBillingIssue(subscription?.status) ? "Sim" : "Nao"],
            ].map(([label, value]) => (
              <div className="rounded-[8px] border border-[#294657]/70 bg-[#0b2230] p-4" key={label}>
                <dt className="text-[12px] text-[#8ca1af]">{label}</dt>
                <dd className="mt-1 font-semibold text-[#eaf2f7]">{value}</dd>
              </div>
            ))}
          </dl>
          <CustomerPortalButton disabled={!billing.stripeConfigured || !subscription?.stripe_customer_id} />
        </div>

        <aside className="rounded-[8px] border border-[#2b4a5d]/90 bg-[#0d2635]/80 p-6">
          <h2 className="text-[18px] font-bold">Historico de cobrancas</h2>
          <div className="mt-5 space-y-3">
            {billing.payments.length === 0 ? (
              <p className="rounded-[8px] border border-dashed border-[#31536a] p-5 text-center text-[13px] text-[#8ca1af]">
                Sem cobrancas registradas.
              </p>
            ) : billing.payments.map((payment) => (
              <div className="rounded-[8px] border border-[#294657]/70 bg-[#0b2230] p-4 text-[13px]" key={payment.id}>
                <div className="flex justify-between gap-3">
                  <span className="font-semibold text-[#eaf2f7]">{formatCurrencyCents(payment.amount_cents)}</span>
                  <span className="text-[#9fb1be]">{getPaymentStatusLabel(payment.status)}</span>
                </div>
                <p className="mt-2 text-[#8ca1af]">{formatBillingDate(payment.due_at)} - {getPaymentKindLabel(payment.payment_kind)}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
