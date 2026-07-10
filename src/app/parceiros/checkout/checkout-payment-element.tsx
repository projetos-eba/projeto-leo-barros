"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { BillingPlanSlug } from "@/lib/billing/catalog";

type CheckoutPaymentElementProps = {
  planSlug: BillingPlanSlug;
  publishableKey: string;
};

type SetupIntentResponse = {
  clientSecret?: string;
  error?: { code?: string; message?: string };
};

function PaymentForm({ clientSecret, planSlug }: { clientSecret: string; planSlug: BillingPlanSlug }) {
  const elements = useElements();
  const router = useRouter();
  const stripe = useStripe();
  const [couponCode, setCouponCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!stripe || !elements) return;
    setErrorMessage(null);

    startTransition(async () => {
      const setupResult = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/parceiros/checkout/sucesso`,
        },
        redirect: "if_required",
      });

      if (setupResult.error) {
        setErrorMessage(setupResult.error.message ?? "Nao foi possivel salvar o metodo de pagamento.");
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("billing-create-subscription", {
        body: {
          couponCode: couponCode.trim() || undefined,
          planSlug,
          setupIntentId: setupResult.setupIntent?.id,
        },
      });

      if (error || data?.error) {
        setErrorMessage(data?.error?.message ?? "Nao foi possivel criar a assinatura.");
        return;
      }

      router.replace("/parceiros/checkout/sucesso");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <PaymentElement />
      <div className="grid gap-2">
        <label className="text-[13px] font-semibold text-[#cbd8e1]" htmlFor="coupon">
          Cupom promocional
        </label>
        <Input
          className="border-[#31536a] bg-[#071923] text-[#f1f6fa]"
          id="coupon"
          placeholder="Opcional"
          value={couponCode}
          onChange={(event) => setCouponCode(event.target.value)}
        />
      </div>
      {errorMessage ? (
        <p className="rounded-[8px] border border-[#9d3b3b]/60 bg-[#401b20]/70 p-3 text-[13px] text-[#ffb7ad]">
          {errorMessage}
        </p>
      ) : null}
      <Button
        className="h-11 w-full rounded-[8px] bg-[#2d9cff] text-[#04131f] hover:bg-[#6bbcff]"
        disabled={!stripe || isPending}
        type="button"
        onClick={submit}
      >
        {isPending ? "Confirmando..." : "Iniciar teste gratis"}
      </Button>
      <p className="text-[12px] leading-5 text-[#8ca1af]">
        O trial comeca somente depois que o metodo de pagamento for salvo com sucesso.
      </p>
    </div>
  );
}

export function CheckoutPaymentElement({ planSlug, publishableKey }: CheckoutPaymentElementProps) {
  const [setupIntent, setSetupIntent] = useState<SetupIntentResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);

  function prepareSetupIntent() {
    startTransition(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("billing-create-setup-intent", {
        body: { planSlug },
      });
      setSetupIntent(error ? { error: { message: "Nao foi possivel iniciar o checkout." } } : data);
    });
  }

  if (!setupIntent) {
    return (
      <Button
        className="h-11 w-full rounded-[8px] bg-[#2d9cff] text-[#04131f] hover:bg-[#6bbcff]"
        disabled={isPending}
        type="button"
        onClick={prepareSetupIntent}
      >
        {isPending ? "Preparando..." : "Informar metodo de pagamento"}
      </Button>
    );
  }

  if (setupIntent.error || !setupIntent.clientSecret) {
    return (
      <p className="rounded-[8px] border border-[#b16a06]/55 bg-[#2e2511] p-4 text-[13px] leading-5 text-[#f1c36d]">
        {setupIntent.error?.message ?? "Pagamentos em configuracao."}
      </p>
    );
  }

  return (
    <Elements options={{ clientSecret: setupIntent.clientSecret, locale: "pt-BR" }} stripe={stripePromise}>
      <PaymentForm clientSecret={setupIntent.clientSecret} planSlug={planSlug} />
    </Elements>
  );
}
