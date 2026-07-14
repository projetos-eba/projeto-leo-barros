"use client";

import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";

import { CheckoutPaymentElement } from "./checkout-payment-element";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BillingCheckoutSummary, BillingPromotionPreview } from "@/lib/billing/preview";
import { formatCurrencyCents } from "@/lib/billing/pricing";
import { createClient } from "@/lib/supabase/client";

type CheckoutExperienceProps = {
  configured: boolean;
  initialSummary: BillingCheckoutSummary;
  paymentUnavailable: ReactNode;
  planName: string;
  publishableKey: string;
  trustContent: ReactNode;
};

type PromotionStatus =
  | { kind: "idle" }
  | { kind: "applied"; message: string }
  | { kind: "error"; message: string };

function promoErrorMessage(code?: string, fallback?: string) {
  if (code === "INVALID_PROMOTION_CODE") return "Codigo promocional invalido ou indisponivel.";
  if (code === "PROMOTION_PREVIEW_FAILED") return "Este codigo nao pode ser aplicado ao plano selecionado.";
  if (code === "PROMOTION_CODE_REQUIRED") return "Informe um codigo promocional.";
  return fallback ?? "Nao foi possivel validar o codigo. Tente novamente.";
}

export function CheckoutExperience({
  configured,
  initialSummary,
  paymentUnavailable,
  planName,
  publishableKey,
  trustContent,
}: CheckoutExperienceProps) {
  const [promotionCode, setPromotionCode] = useState("");
  const [appliedPreview, setAppliedPreview] = useState<BillingPromotionPreview | null>(null);
  const [status, setStatus] = useState<PromotionStatus>({ kind: "idle" });
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function applyPromotion(event?: { preventDefault: () => void }) {
    event?.preventDefault();
    const normalizedCode = promotionCode.trim();
    setStatus({ kind: "idle" });
    if (!normalizedCode) {
      setAppliedPreview(null);
      setShowPromotionForm(true);
      setStatus({ kind: "error", message: "Informe um codigo promocional." });
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("billing-preview-subscription", {
        body: {
          planSlug: initialSummary.planSlug,
          promotionCode: normalizedCode,
        },
      });

      if (error || data?.error) {
        setAppliedPreview(null);
        setStatus({
          kind: "error",
          message: promoErrorMessage(data?.error?.code, data?.error?.message),
        });
        return;
      }

      setAppliedPreview(data as BillingPromotionPreview);
      setPromotionCode((data as BillingPromotionPreview).promotion.code);
      setShowPromotionForm(false);
      setStatus({ kind: "applied", message: "Codigo promocional aplicado." });
    });
  }

  function removePromotion() {
    setAppliedPreview(null);
    setPromotionCode("");
    setShowPromotionForm(false);
    setStatus({ kind: "idle" });
  }

  return (
    <section className="mt-7 grid items-start gap-6 xl:grid-cols-[minmax(620px,1fr)_420px]">
      <div className="min-w-0 rounded-[8px] border border-[#2b4a5d]/90 bg-[#0d2635]/80 p-6 md:p-8">
        <h2 className="mb-5 text-[18px] font-bold text-[#eaf2f7]">Pagamento</h2>
        {!configured ? (
          paymentUnavailable
        ) : (
          <CheckoutPaymentElement
            planSlug={initialSummary.planSlug}
            promotionCode={appliedPreview?.promotion.code ?? ""}
            publishableKey={publishableKey}
          />
        )}

        {trustContent}
      </div>

      <aside className="rounded-[8px] border border-[#2b4a5d]/90 bg-[#0d2635]/80 p-6">
        <h2 className="text-[18px] font-bold text-[#eaf2f7]">Resumo</h2>
        <div className="mt-5 space-y-4 text-[14px]">
          <div className="flex justify-between gap-4">
            <span className="text-[#9fb1be]">{initialSummary.billingInterval === "yearly" ? "Plano anual" : "Plano mensal"}</span>
            <span className="font-semibold text-[#f1f6fa]">{formatCurrencyCents(initialSummary.planCents)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[#9fb1be]">Clientes ativos</span>
            <span className="font-semibold text-[#f1f6fa]">
              {initialSummary.activeClientCount > 0 ? `${initialSummary.activeClientCount} x ${formatCurrencyCents(initialSummary.addonUnitCents)}` : "0"}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[#9fb1be]">Adicional mensal</span>
            <span className="font-semibold text-[#f1f6fa]">{formatCurrencyCents(initialSummary.addonCents)}</span>
          </div>
          <div className="border-t border-[#31536a] pt-4">
            {showPromotionForm || status.kind === "error" ? (
              <form className="grid gap-2" onSubmit={applyPromotion}>
                <label className="text-[13px] font-semibold text-[#cbd8e1]" htmlFor="promotion-code">
                  Codigo promocional
                </label>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_96px]">
                  <Input
                    className="h-10 border-[#31536a] bg-[#071923] text-[#f1f6fa]"
                    disabled={isPending}
                    id="promotion-code"
                    maxLength={64}
                    placeholder="Inserir cupom"
                    value={promotionCode}
                    onChange={(event) => {
                      setPromotionCode(event.target.value);
                      if (appliedPreview) {
                        setAppliedPreview(null);
                        setStatus({ kind: "idle" });
                      }
                    }}
                  />
                  <Button className="h-10 rounded-[8px]" disabled={isPending} type="submit" variant="outline">
                    {isPending ? "..." : "Aplicar"}
                  </Button>
                </div>
                {status.kind === "error" ? (
                  <p className="flex items-center gap-2 rounded-[8px] border border-[#9d3b3b]/60 bg-[#401b20]/70 p-3 text-[13px] text-[#ffb7ad]">
                    <XCircle className="size-4 shrink-0" />
                    {status.message}
                  </p>
                ) : null}
              </form>
            ) : appliedPreview ? null : (
              <button
                className="text-[14px] font-semibold text-[#5db7ef] underline-offset-4 hover:underline"
                type="button"
                onClick={() => setShowPromotionForm(true)}
              >
                Inserir codigo promocional
              </button>
            )}
            {status.kind === "applied" ? (
              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-[8px] border border-[#2c704a]/70 bg-[#102c22] p-3 text-[13px] text-[#9ee6b8]">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4" />
                  {status.message}
                </span>
                <button className="font-semibold text-[#d6ffe2] underline-offset-4 hover:underline" type="button" onClick={removePromotion}>
                  Remover codigo
                </button>
              </div>
            ) : null}
          </div>
          {appliedPreview ? (
            <>
              <div className="flex justify-between gap-4">
                <span className="font-semibold text-[#cbd8e1]">Subtotal</span>
                <span className="font-semibold text-[#f1f6fa]">{formatCurrencyCents(appliedPreview.subtotalCents)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#9ee6b8]">{appliedPreview.promotion.code} - {appliedPreview.promotion.label}</span>
                <span className="font-semibold text-[#9ee6b8]">- {formatCurrencyCents(appliedPreview.promotion.discountCents)}</span>
              </div>
            </>
          ) : null}
          <div className={appliedPreview ? "border-t border-[#31536a] pt-4" : "border-t border-[#31536a] pt-4"}>
            <div className="flex justify-between gap-4">
              <span className="font-bold text-[#eaf2f7]">Primeira cobranca apos o periodo de teste</span>
              <span className="font-bold text-[#f1f6fa]">
                {formatCurrencyCents(appliedPreview?.totalAfterDiscountCents ?? initialSummary.cycleCents)}
              </span>
            </div>
            {initialSummary.billingInterval === "yearly" && !appliedPreview ? (
              <p className="mt-2 text-[12px] text-[#8ca1af]">
                Equivalente mensal estimado: {formatCurrencyCents(initialSummary.monthlyEquivalentCents)}.
              </p>
            ) : null}
          </div>
        </div>
        <p className="mt-5 text-[12px] leading-5 text-[#8ca1af]">
          Plano selecionado: {planName}.
        </p>
        <Button asChild className="mt-6 w-full rounded-[8px]" variant="outline">
          <Link href="/planos">Alterar plano</Link>
        </Button>
      </aside>
    </section>
  );
}
