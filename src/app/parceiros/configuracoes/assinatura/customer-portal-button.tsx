"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function CustomerPortalButton({ disabled }: { disabled: boolean }) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openPortal() {
    setErrorMessage(null);
    startTransition(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("billing-customer-portal", {
        body: {},
      });

      if (error || data?.error || !data?.url) {
        setErrorMessage(data?.error?.message ?? "Nao foi possivel abrir o portal de pagamentos.");
        return;
      }

      window.location.assign(data.url);
    });
  }

  return (
    <div className="mt-6">
      <Button className="rounded-[8px]" disabled={disabled || isPending} type="button" onClick={openPortal}>
        {isPending ? "Abrindo..." : "Abrir portal de pagamentos"}
      </Button>
      {errorMessage ? <p className="mt-3 text-[12px] text-[#ffb7ad]">{errorMessage}</p> : null}
    </div>
  );
}
