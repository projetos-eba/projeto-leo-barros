import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function PartnerCheckoutSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b1720] px-5 py-10 text-[#f1f6fa]">
      <section className="w-full max-w-xl rounded-[8px] border border-[#2b4a5d]/90 bg-[#0d2635]/85 p-8 text-center">
        <CheckCircle2 className="mx-auto size-12 text-[#58d881]" />
        <h1 className="mt-5 text-[28px] font-bold">Assinatura em processamento</h1>
        <p className="mt-3 text-[14px] leading-6 text-[#9fb1be]">
          Quando o Stripe confirmar os eventos, o estado local sera reconciliado pelo webhook. Em ambiente sem credenciais reais, acompanhe a estrutura em Assinatura.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="rounded-[8px] bg-[#2d9cff] text-[#04131f] hover:bg-[#6bbcff]">
            <Link href="/parceiros/configuracoes/assinatura">Ver assinatura</Link>
          </Button>
          <Button asChild className="rounded-[8px]" variant="outline">
            <Link href="/parceiros/dashboard">Ir para dashboard</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
