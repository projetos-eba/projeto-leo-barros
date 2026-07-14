import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Check, CreditCard, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/next-guards";
import { partnerHasActivePlan } from "@/lib/auth/partner-plan-access";
import { normalizeBillingPlanSlug } from "@/lib/billing/catalog";
import { getPublicBillingCatalog, type PublicBillingAddon, type PublicBillingPlan } from "@/lib/billing/data";
import {
  annualSavingsPercentFromPrices,
  formatCurrencyCents,
  monthlyEquivalentCents,
} from "@/lib/billing/pricing";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const benefits = [
  "Nutricao",
  "Treinamento",
  "Gestao de Clientes",
  "Recursos completos da plataforma",
];

const planHighlights: Array<{ description: string; Icon: LucideIcon; title: string }> = [
  {
    description: "Seus pagamentos sao realizados em ambiente protegido e com tecnologia de seguranca avancada.",
    Icon: ShieldCheck,
    title: "Pagamento seguro",
  },
  {
    description: "Os pagamentos sao processados pela Stripe, plataforma global especializada em pagamentos digitais.",
    Icon: CreditCard,
    title: "Processado pela Stripe",
  },
  {
    description: "Os dados do cartao sao enviados diretamente ao provedor de pagamento e nao ficam armazenados na plataforma.",
    Icon: LockKeyhole,
    title: "Dados protegidos",
  },
];

async function resolveCtaHref(planSlug: string) {
  const selectedPlan = normalizeBillingPlanSlug(planSlug);
  const { profile } = await getCurrentProfile();

  if (!profile) {
    return `/login/parceiros?next=/parceiros/checkout?plan=${selectedPlan}`;
  }

  if (profile.role !== "parceiro") {
    return profile.role === "admin" ? "/admin/dashboard" : "/cliente/inicio";
  }

  const supabase = await createClient();
  const hasActivePlan = await partnerHasActivePlan({ profileId: profile.id, supabase });

  return hasActivePlan
    ? "/parceiros/configuracoes/assinatura"
    : `/parceiros/checkout?plan=${selectedPlan}`;
}

function PlanCard({
  addon,
  ctaHref,
  highlighted = false,
  monthlyPriceCents,
  plan,
}: {
  addon: PublicBillingAddon;
  ctaHref: string;
  highlighted?: boolean;
  monthlyPriceCents: number;
  plan: PublicBillingPlan;
}) {
  const isAnnual = plan.slug === "complete-annual";
  const planAvailable = plan.isAvailable && addon.isAvailable;
  const equivalentMonthly = monthlyEquivalentCents({
    billingInterval: plan.billingInterval,
    priceCents: plan.priceCents,
  });
  const savings = annualSavingsPercentFromPrices({
    annualPriceCents: plan.priceCents,
    monthlyPriceCents,
  });

  return (
    <article
      className={cn(
        "relative flex min-h-[570px] flex-col rounded-[8px] border bg-[#0d2635]/88 p-6 shadow-[0_18px_55px_rgba(1,9,14,0.28)]",
        highlighted ? "border-[#2d9cff] ring-1 ring-[#2d9cff]/40" : "border-[#28485b]",
      )}
    >
      <div className="flex flex-1 flex-col">
        {highlighted ? (
          <div className="absolute right-4 top-4 rounded-full border border-[#2d9cff]/55 bg-[#0a2c48] px-3 py-1 text-[12px] font-bold text-[#9fd2ff]">
            Mais vantajoso
          </div>
        ) : null}
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5db7ef]">
          Plano Completo
        </p>
        <h2 className="mt-3 text-[25px] font-bold leading-[31px] text-[#f5f9fc]">
          {isAnnual ? "Anual" : "Mensal"}
        </h2>
        <div className="mt-8">
          <p className="text-[38px] font-bold leading-none text-white">
            {plan.isAvailable
              ? isAnnual
                ? `${formatCurrencyCents(equivalentMonthly)}/mes`
                : formatCurrencyCents(plan.priceCents)
              : "Indisponivel"}
          </p>
          <p className="mt-2 text-[14px] text-[#94aabb]">
            {plan.isAvailable
              ? isAnnual
                ? `${formatCurrencyCents(plan.priceCents)} cobrados anualmente`
                : "por mes"
              : "Plano temporariamente indisponivel"}
          </p>
        </div>
        {isAnnual && savings > 0 ? (
          <p className="mt-4 inline-flex w-fit rounded-[6px] bg-[#1d8b46]/20 px-3 py-1 text-[13px] font-semibold text-[#76e199]">
            Economize cerca de {savings.toString().replace(".", ",")}%
          </p>
        ) : null}
        <p className="mt-6 flex items-center gap-2 text-[15px] font-semibold text-[#d9e6ee]">
          <Sparkles className="size-4 text-[#58d881]" />
          {plan.trialDays} dias gratis
        </p>
        <ul className="mt-6 grid gap-3 text-[14px] text-[#b7c7d2]">
          {benefits.map((benefit) => (
            <li className="flex items-center gap-3" key={benefit}>
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#123548] text-[#67d982]">
                <Check className="size-3.5" />
              </span>
              {benefit}
            </li>
          ))}
        </ul>
      </div>
      <footer className="mt-6 flex flex-col gap-4">
        <div className="rounded-[8px] border border-[#31536a] bg-[#0b2230] p-4 text-[13px] leading-5 text-[#b8c8d2]">
          {addon.isAvailable
            ? `+ ${formatCurrencyCents(addon.priceCents)}/mes por Cliente ativo`
            : "Adicional temporariamente indisponivel"}
        </div>
        {planAvailable ? (
          <Button asChild className="h-11 rounded-[8px] bg-[#2d9cff] text-[#04131f] hover:bg-[#6bbcff]">
            <Link href={ctaHref}>Comecar teste gratis</Link>
          </Button>
        ) : (
          <Button className="h-11 rounded-[8px]" disabled variant="outline">
            Plano temporariamente indisponivel
          </Button>
        )}
      </footer>
    </article>
  );
}

export default async function PlansPage() {
  const catalog = await getPublicBillingCatalog();
  const monthlyHref = await resolveCtaHref("complete-monthly");
  const annualHref = await resolveCtaHref("complete-annual");
  const trialDays = Math.max(
    catalog.plans["complete-monthly"].trialDays,
    catalog.plans["complete-annual"].trialDays,
  );

  return (
    <main className="min-h-screen bg-[#0b1720] px-5 py-10 font-['Rethink_Sans',sans-serif] text-[#f1f6fa] md:px-8 lg:px-12">
      <section className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5db7ef]">
            Planos
          </p>
          <h1 className="mt-3 text-[38px] font-bold leading-[44px] text-white md:text-[48px] md:leading-[56px]">
            Escolha o plano ideal para sua operacao
          </h1>
          <p className="mt-4 text-[18px] leading-7 text-[#a9bcc9]">
            Nutricao e Treinamento em uma unica plataforma. Experimente todos os recursos gratuitamente por {trialDays} dias.
          </p>
        </header>

        <div className="mt-9 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
          <PlanCard
            addon={catalog.addon}
            ctaHref={monthlyHref}
            monthlyPriceCents={catalog.plans["complete-monthly"].priceCents}
            plan={catalog.plans["complete-monthly"]}
          />
          <PlanCard
            addon={catalog.addon}
            ctaHref={annualHref}
            highlighted
            monthlyPriceCents={catalog.plans["complete-monthly"].priceCents}
            plan={catalog.plans["complete-annual"]}
          />
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {planHighlights.map(({ description, Icon, title }) => (
            <div className="flex h-full flex-col rounded-[8px] border border-[#28485b] bg-[#0d2635]/72 p-5" key={title}>
              <Icon className="size-5 text-[#5db7ef]" />
              <h2 className="mt-4 text-[16px] font-bold text-[#eaf2f7]">{title}</h2>
              <p className="mt-2 text-[13px] leading-5 text-[#94aabb]">{description}</p>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}
