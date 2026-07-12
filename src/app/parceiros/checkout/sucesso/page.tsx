import Link from "next/link";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPartnerBillingOverview } from "@/lib/billing/data";
import { hasPendingBillingIssue } from "@/lib/billing/presentation";

export const dynamic = "force-dynamic";

export default async function PartnerCheckoutSuccessPage() {
  const billing = await getPartnerBillingOverview();
  const status = billing.subscription?.status ?? null;
  const hasEntitlement = status === "trialing" || status === "active";
  const hasFailure = hasPendingBillingIssue(status);
  const Icon = hasEntitlement ? CheckCircle2 : hasFailure ? XCircle : Clock3;

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-5 py-10 text-[#f1f6fa]">
      <section className="w-full max-w-xl rounded-[8px] border border-[#2b4a5d]/90 bg-[#0d2635]/85 p-8 text-center">
        <Icon className={hasEntitlement ? "mx-auto size-12 text-[#58d881]" : hasFailure ? "mx-auto size-12 text-[#ff8f84]" : "mx-auto size-12 text-[#5db7ef]"} />
        <h1 className="mt-5 text-[28px] font-bold">
          {hasEntitlement ? "Teste gratuito ativo" : hasFailure ? "Pagamento nao confirmado" : "Assinatura em processamento"}
        </h1>
        <p className="mt-3 text-[14px] leading-6 text-[#9fb1be]">
          {hasEntitlement
            ? `Seu acesso ja esta liberado. O periodo de teste de ${billing.trialDays} dias fica registrado no estado financeiro da plataforma.`
            : hasFailure
              ? "Nao foi possivel confirmar a assinatura no estado financeiro local. Revise o metodo de pagamento ou tente novamente."
              : "Estamos aguardando a confirmacao dos eventos de pagamento. Esta pagina usa o estado real reconciliado pelo backend."}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="rounded-[8px] bg-[#2d9cff] text-[#04131f] hover:bg-[#6bbcff]">
            <Link href="/parceiros/configuracoes/assinatura">Ver assinatura</Link>
          </Button>
          {hasEntitlement ? (
            <Button asChild className="rounded-[8px]" variant="outline">
              <Link href="/parceiros/dashboard">Entrar no sistema</Link>
            </Button>
          ) : (
            <Button asChild className="rounded-[8px]" variant="outline">
              <Link href="/parceiros/checkout">Tentar novamente</Link>
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}
