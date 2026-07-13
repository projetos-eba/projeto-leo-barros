"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ChevronDown, CreditCard } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClient } from "@/lib/supabase/client";
import type { BillingPlanSlug } from "@/lib/billing/catalog";
import { stripeElementsAppearance } from "@/lib/billing/stripe-appearance";

type CheckoutPaymentElementProps = {
  planSlug: BillingPlanSlug;
  promotionCode: string;
  publishableKey: string;
};

type SetupIntentResponse = {
  clientSecret?: string;
  error?: { code?: string; message?: string };
  setupIntentId?: string;
};

const CARD_PAYMENT_METHOD = "card";

function createCheckoutAttemptId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function PaymentForm({
  planSlug,
  promotionCode,
  setupIntentId,
}: {
  planSlug: BillingPlanSlug;
  promotionCode: string;
  setupIntentId: string;
}) {
  const elements = useElements();
  const router = useRouter();
  const stripe = useStripe();
  const [confirmedSetupIntentId, setConfirmedSetupIntentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function createSubscription(confirmedId: string) {
    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke("billing-create-subscription", {
      body: {
        planSlug,
        promotionCode: promotionCode.trim() || undefined,
        setupIntentId: confirmedId,
      },
    });

    if (error || data?.error) {
      setErrorMessage(data?.error?.message ?? "Nao foi possivel criar a assinatura.");
      return false;
    }

    router.replace("/parceiros/checkout/sucesso");
    router.refresh();
    return true;
  }

  async function submit() {
    if (!stripe || !elements || isSubmitting) return;
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      let confirmedId = confirmedSetupIntentId;

      if (!confirmedId) {
        const setupResult = await stripe.confirmSetup({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/parceiros/checkout/sucesso`,
          },
          redirect: "if_required",
        });

        if (setupResult.error) {
          if (setupResult.error.code === "setup_intent_unexpected_state") {
            setConfirmedSetupIntentId(setupIntentId);
            await createSubscription(setupIntentId);
            return;
          }

          setErrorMessage(setupResult.error.message ?? "Nao foi possivel salvar o metodo de pagamento.");
          return;
        }

        confirmedId = setupResult.setupIntent?.id ?? setupIntentId;
        setConfirmedSetupIntentId(confirmedId);
      }

      await createSubscription(confirmedId);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full min-w-0 space-y-5">
      <div className="w-full min-w-0">
        <PaymentElement className="w-full" options={{ layout: "tabs" }} />
      </div>
      {errorMessage ? (
        <p className="rounded-[8px] border border-[#9d3b3b]/60 bg-[#401b20]/70 p-3 text-[13px] text-[#ffb7ad]">
          {errorMessage}
        </p>
      ) : null}
      <Button
        className="h-11 w-full rounded-[8px] bg-[#2d9cff] text-[#04131f] hover:bg-[#6bbcff]"
        disabled={!stripe || isSubmitting}
        type="button"
        onClick={submit}
      >
        {isSubmitting ? "Confirmando..." : "Iniciar periodo de teste gratis"}
      </Button>
      <p className="text-[12px] leading-5 text-[#8ca1af]">
        O periodo de teste comeca somente depois que o metodo de pagamento for salvo com sucesso.
      </p>
    </div>
  );
}

export function CheckoutPaymentElement({ planSlug, promotionCode, publishableKey }: CheckoutPaymentElementProps) {
  const [checkoutAttemptId, setCheckoutAttemptId] = useState(createCheckoutAttemptId);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [setupIntent, setSetupIntent] = useState<SetupIntentResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);

  function prepareSetupIntent() {
    if (setupIntent || isPending) return;
    startTransition(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("billing-create-setup-intent", {
        body: { checkoutAttemptId, planSlug },
      });
      if (error) {
        setCheckoutAttemptId(createCheckoutAttemptId());
        setSetupIntent({ error: { message: "Nao foi possivel iniciar o checkout." } });
        return;
      }

      setSetupIntent(data);
    });
  }

  function selectMethod(value: string) {
    setSelectedMethod(value);
    if (value === CARD_PAYMENT_METHOD) {
      prepareSetupIntent();
    }
  }

  const isCardSelected = selectedMethod === CARD_PAYMENT_METHOD;
  const canRenderPaymentElement = isCardSelected && setupIntent?.clientSecret && !setupIntent.error;

  return (
    <div className="space-y-4">
      <RadioGroup value={selectedMethod} onValueChange={selectMethod}>
        <label
          className={[
            "block cursor-pointer rounded-[8px] border bg-[#071923]/65 transition-colors",
            isCardSelected ? "border-[#2d9cff] shadow-[0_0_0_1px_rgba(45,156,255,0.35)]" : "border-[#31536a] hover:border-[#4f7891]",
          ].join(" ")}
          htmlFor="payment-method-card"
        >
          <span className="flex min-h-[72px] items-center gap-4 px-4 py-3">
            <RadioGroupItem
              className="border-[#9fb1be] text-[#2d9cff] data-[state=checked]:border-[#2d9cff]"
              id="payment-method-card"
              value={CARD_PAYMENT_METHOD}
            />
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#31536a] bg-[#0d2635]">
              <CreditCard className="size-5 text-[#d9e7f0]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-semibold text-[#f1f6fa]">Cartao de credito ou debito</span>
              <span className="mt-1 block text-[13px] leading-5 text-[#8ca1af]">Aprovacao imediata apos a confirmacao.</span>
            </span>
            <ChevronDown
              className={[
                "size-5 shrink-0 text-[#8ca1af] transition-transform",
                isCardSelected ? "rotate-180" : "",
              ].join(" ")}
            />
          </span>
        </label>
      </RadioGroup>

      {isCardSelected ? (
        <div className="rounded-[8px] border border-[#31536a] bg-[#071923]/45 p-4">
          {isPending && !setupIntent ? (
            <p className="text-[13px] leading-5 text-[#9fb1be]">Preparando campos de pagamento...</p>
          ) : setupIntent?.error || (setupIntent && !setupIntent.clientSecret) ? (
            <p className="rounded-[8px] border border-[#b16a06]/55 bg-[#2e2511] p-4 text-[13px] leading-5 text-[#f1c36d]">
              {setupIntent.error?.message ?? "Pagamentos em configuracao."}
            </p>
          ) : canRenderPaymentElement && setupIntent.setupIntentId ? (
            <Elements
              options={{
                appearance: stripeElementsAppearance,
                clientSecret: setupIntent.clientSecret,
                locale: "pt-BR",
              }}
              stripe={stripePromise}
            >
              <PaymentForm planSlug={planSlug} promotionCode={promotionCode} setupIntentId={setupIntent.setupIntentId} />
            </Elements>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
