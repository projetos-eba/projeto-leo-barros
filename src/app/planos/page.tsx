import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Check, ShieldCheck, Sparkles, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/next-guards";
import { partnerHasActivePlan } from "@/lib/auth/partner-plan-access";
import { BILLING_PLANS, BILLING_TRIAL_DAYS, normalizeBillingPlanSlug } from "@/lib/billing/catalog";
import { annualSavingsPercent, formatCurrencyCents } from "@/lib/billing/pricing";
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
  { description: "O metodo de pagamento e salvo antes do inicio do teste gratuito.", Icon: ShieldCheck, title: "Trial seguro" },
  { description: "A cobranca adicional usa Clientes unicos ativos, sem duplicar escopos.", Icon: UsersRound, title: "Clientes ativos" },
  { description: "Mudancas de quantidade afetam somente o proximo ciclo.", Icon: Check, title: "Sem proporcionalidade" },
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
  ctaHref,
  highlighted = false,
  slug,
}: {
  ctaHref: string;
  highlighted?: boolean;
  slug: keyof typeof BILLING_PLANS;
}) {
  const plan = BILLING_PLANS[slug];
  const isAnnual = slug === "complete-annual";

  return (
    <article
      className={cn(
        "relative flex min-h-[570px] flex-col rounded-[8px] border bg-[#0d2635]/88 p-6 shadow-[0_18px_55px_rgba(1,9,14,0.28)]",
        highlighted ? "border-[#2d9cff] ring-1 ring-[#2d9cff]/40" : "border-[#28485b]",
      )}
    >
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
          {isAnnual ? "R$ 99,90/mes" : "R$ 119,90"}
        </p>
        <p className="mt-2 text-[14px] text-[#94aabb]">
          {isAnnual ? "R$ 1.198,80 cobrados anualmente" : "por mes"}
        </p>
      </div>
      {isAnnual ? (
        <p className="mt-4 inline-flex w-fit rounded-[6px] bg-[#1d8b46]/20 px-3 py-1 text-[13px] font-semibold text-[#76e199]">
          Economize cerca de {annualSavingsPercent().toString().replace(".", ",")}%
        </p>
      ) : null}
      <p className="mt-6 flex items-center gap-2 text-[15px] font-semibold text-[#d9e6ee]">
        <Sparkles className="size-4 text-[#58d881]" />
        {BILLING_TRIAL_DAYS} dias gratis
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
      <div className="mt-6 rounded-[8px] border border-[#31536a] bg-[#0b2230] p-4 text-[13px] leading-5 text-[#b8c8d2]">
        + {formatCurrencyCents(199)}/mes por Cliente ativo
      </div>
      <Button asChild className="mt-auto h-11 rounded-[8px] bg-[#2d9cff] text-[#04131f] hover:bg-[#6bbcff]">
        <Link href={ctaHref}>Comecar teste gratis</Link>
      </Button>
    </article>
  );
}

export default async function PlansPage() {
  const monthlyHref = await resolveCtaHref("complete-monthly");
  const annualHref = await resolveCtaHref("complete-annual");

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
            Nutricao e Treinamento em uma unica plataforma. Experimente todos os recursos gratuitamente por {BILLING_TRIAL_DAYS} dias.
          </p>
        </header>

        <div className="mt-9 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
          <PlanCard ctaHref={monthlyHref} slug="complete-monthly" />
          <PlanCard ctaHref={annualHref} highlighted slug="complete-annual" />
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {planHighlights.map(({ description, Icon, title }) => (
            <div className="rounded-[8px] border border-[#28485b] bg-[#0d2635]/72 p-5" key={title}>
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
