"use client";

<<<<<<< HEAD
import { ArrowLeft, CalendarPlus, Dumbbell, FileDown, HeartPulse, MessageCircle, Phone, Target, Utensils, Users } from "lucide-react";
=======
import { ArrowLeft, CalendarPlus, FileDown, MessageCircle, Phone, Target, Users } from "lucide-react";
>>>>>>> origin/main
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { PartnerClientOverviewData } from "@/lib/partners/client-overview-metrics";
import { cn } from "@/lib/utils";

<<<<<<< HEAD
type ClientTab = "anamnese" | "avaliacoes" | "cardio" | "dietas" | "exames" | "formularios" | "fotos" | "prescricoes" | "treinos" | "visao-geral";
=======
type ClientTab =
  | "anamnese"
  | "avaliacoes"
  | "cardio"
  | "dietas"
  | "exames"
  | "formularios"
  | "fotos"
  | "planos-financeiro"
  | "prescricoes"
  | "treinos"
  | "visao-geral";
>>>>>>> origin/main

const tabs: Array<{ id: ClientTab; label: string }> = [
  { id: "visao-geral", label: "Visão Geral" },
  { id: "anamnese", label: "Anamnese" },
  { id: "avaliacoes", label: "Avaliações" },
  { id: "prescricoes", label: "Prescrições" },
  { id: "formularios", label: "Formulários" },
  { id: "dietas", label: "Dietas" },
  { id: "treinos", label: "Treinos" },
  { id: "cardio", label: "Cardio" },
  { id: "exames", label: "Exames" },
  { id: "prescricoes", label: "Prescrições" },
  { id: "fotos", label: "Fotos" },
  { id: "formularios", label: "Formulários" },
  { id: "anamnese", label: "Anamnese" },
  { id: "planos-financeiro", label: "Planos & Financeiro" },
];

<<<<<<< HEAD
const moduleIcons = {
  cardio: HeartPulse,
  dieta: Utensils,
  saude: Target,
  treino: Dumbbell,
};

const moduleLabels: Record<string, string> = {
  cardio: "Cardio",
  dieta: "Dieta",
  saude: "Saúde",
  treino: "Treino",
};

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
=======
function InfoItem({ className, icon, label, value }: { className?: string; icon: React.ReactNode; label: string; value: string }) {
>>>>>>> origin/main
  return (
    <div className={cn("grid min-w-0 grid-cols-[26px_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[32px_minmax(0,1fr)] sm:gap-3", className)}>
      <span className="flex size-[26px] items-center justify-center rounded-[7px] bg-[#082a43] text-[#68afe9] sm:size-8 sm:rounded-[8px]">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-[10px] leading-3 text-[#9aa5b6] sm:text-[12px] sm:leading-4">{label}</p>
        <p className="truncate text-[12px] font-semibold leading-4 text-white sm:text-[14px] sm:leading-5">{value}</p>
      </div>
    </div>
  );
}

function ContractedPlan({ overview }: { overview: PartnerClientOverviewData }) {
  const plan = overview.plan;

  return (
    <section className="min-w-0 rounded-[10px] border border-[#2f82bf]/45 bg-[rgba(10,44,72,0.26)] p-3 sm:p-4">
      <p className="text-[10px] font-semibold uppercase leading-3 tracking-[0.05em] text-[#9aa5b6] sm:text-[11px] sm:leading-[14px]">Plano clínico atual</p>
      <p className="mt-1 truncate text-[14px] font-bold leading-5 text-white sm:text-[15px]">{plan?.name ?? "Sem plano vigente"}</p>
      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#8fcfff] sm:text-[12px]">
        {plan ? `Atualização: ${plan.renewalLabel}` : "Vincule um plano clínico para acompanhar entregas."}
      </p>
    </section>
  );
}

export function PartnerClientProfileHeader({
  activeTab,
  onScheduleAppointment,
  overview,
}: {
  activeTab: ClientTab;
  onScheduleAppointment?: () => void;
  overview: PartnerClientOverviewData;
}) {
  const router = useRouter();
  const tabHref = (tab: ClientTab) =>
    tab === "visao-geral"
      ? `/parceiros/clientes/${overview.client.id}`
      : `/parceiros/clientes/${overview.client.id}?tab=${tab}`;
  const whatsappHref = overview.client.phoneDigits
    ? `https://wa.me/${overview.client.phoneDigits}?text=${encodeURIComponent(`Olá, ${overview.client.name}! Passando para acompanhar seu plano.`)}`
    : null;
  const scheduleAppointment = () => {
    if (onScheduleAppointment) {
      onScheduleAppointment();
      return;
    }

    router.push(`/parceiros/agenda?clientId=${overview.client.id}`);
  };

  return (
    <>
      <div className="client-overview-actions flex">
        <Link className="inline-flex h-8 items-center gap-2 text-[12px] font-semibold text-[#8fcfff] hover:text-white sm:h-10 sm:text-[13px]" href="/parceiros/clientes">
          <ArrowLeft className="size-4" />
          Voltar para Clientes
        </Link>
      </div>

      <header className="client-overview-print-panel mt-3 grid min-w-0 gap-4 sm:mt-5 lg:mt-2 lg:grid-cols-[120px_minmax(0,1fr)_280px] lg:items-start lg:gap-6">
        <div className="grid min-w-0 grid-cols-[82px_minmax(0,1fr)] items-center gap-3 sm:block lg:contents">
          {overview.client.avatarUrl ? (
            <img alt="" className="size-[82px] rounded-full border-2 border-[#1d7ece]/70 object-cover sm:size-[120px]" src={overview.client.avatarUrl} />
          ) : (
            <span className="flex size-[82px] items-center justify-center rounded-full border-2 border-[#1d7ece]/70 bg-[#fce4e7] text-[28px] font-bold text-[#121722] sm:size-[120px] sm:text-[40px]">
              {overview.client.initial}
            </span>
          )}

          <div className="min-w-0 sm:hidden">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="min-w-0 truncate text-[25px] font-bold leading-8 text-white">{overview.client.name}</h1>
            </div>
            <span className="mt-1 inline-flex h-5 items-center gap-1.5 rounded-full bg-[#0c2b1d] px-2.5 text-[10px] font-medium text-[#58d881]">
              <span className="size-1.5 rounded-full bg-[#58d881]" />
              {overview.client.statusLabel}
            </span>
            <p className="mt-1 truncate text-[12px] leading-4 text-[#9aa5b6]">{overview.client.email}</p>
          </div>
        </div>

        <div className="min-w-0 pt-1">
          <div className="hidden min-w-0 flex-wrap items-center gap-4 sm:flex">
            <p className="min-w-0 max-w-full truncate text-[30px] font-bold leading-8 text-white">{overview.client.name}</p>
            <span className="inline-flex h-[26px] items-center gap-2 rounded-[13px] bg-[#0c2b1d] px-4 text-[12px] font-medium text-[#58d881]">
              <span className="size-2 rounded-full bg-[#58d881]" />
              {overview.client.statusLabel}
            </span>
          </div>
          <p className="mt-2 hidden truncate text-[14px] leading-5 text-[#9aa5b6] sm:block">{overview.client.email}</p>

          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 sm:mt-7 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            <InfoItem icon={<CalendarPlus className="size-4" />} label="Idade" value={overview.client.ageLabel} />
            <InfoItem icon={<Users className="size-4" />} label="Gênero" value={overview.client.genderLabel} />
            <InfoItem icon={<CalendarPlus className="size-4" />} label="Nascimento" value={overview.client.birthDateLabel} />
            <InfoItem icon={<Phone className="size-4" />} label="Telefone" value={overview.client.phoneLabel} className="sm:col-span-1" />
            <InfoItem className="col-span-2 sm:col-span-1" icon={<Target className="size-4" />} label="Período do plano" value={overview.client.planPeriodLabel} />
            <InfoItem className="col-span-2 sm:col-span-1" icon={<Target className="size-4" />} label="Objetivo principal" value={overview.client.objectiveLabel} />
          </div>
        </div>

        <div className="min-w-0 lg:pt-[102px]">
          <ContractedPlan overview={overview} />
        </div>
      </header>

      <div className="client-overview-actions mt-4 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-3 lg:justify-end">
        <button aria-label="Exportar PDF" className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] border border-[#303746] bg-[#101923] px-2 text-[11px] font-semibold text-[#d8e5ee] sm:h-10 sm:gap-2 sm:px-4 sm:text-[13px]" type="button" onClick={() => window.print()}>
          <FileDown className="size-4" /> PDF
        </button>
        {whatsappHref ? (
          <a className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] border border-[#1f5f38] bg-[#0c2b1d] px-2 text-[11px] font-semibold text-[#58d881] sm:h-10 sm:gap-2 sm:px-4 sm:text-[13px]" href={whatsappHref} rel="noreferrer" target="_blank">
            <MessageCircle className="size-4" /> Mensagem
          </a>
        ) : (
          <button className="inline-flex h-9 cursor-not-allowed items-center justify-center gap-1.5 rounded-[8px] border border-[#303746] bg-[#101923] px-2 text-[11px] font-semibold text-[#6f7c89] sm:h-10 sm:gap-2 sm:px-4 sm:text-[13px]" disabled type="button">
            <MessageCircle className="size-4" /> Mensagem
          </button>
        )}
        <button aria-label="Agendar consulta" className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] bg-[#2d9cff] px-2 text-[11px] font-semibold text-white sm:h-10 sm:gap-2 sm:px-4 sm:text-[13px]" type="button" onClick={scheduleAppointment}>
          <CalendarPlus className="size-4" /> Agenda
        </button>
      </div>

      <div className="client-overview-tabs mt-4 flex min-w-0 gap-2 overflow-x-auto border-b border-[#303746] pb-px sm:mt-7 sm:gap-7">
        {tabs.map((tab) => (
          <Link
            className={cn(
              "relative inline-flex h-10 shrink-0 items-center rounded-t-[8px] px-3 text-[12px] font-semibold transition hover:text-white sm:h-[47px] sm:px-4 sm:text-[14px]",
              activeTab === tab.id
                ? "text-white after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-[#3b97e3]"
                : "text-[#8fcfff]",
            )}
            href={tabHref(tab.id)}
            key={tab.id}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </>
  );
}
