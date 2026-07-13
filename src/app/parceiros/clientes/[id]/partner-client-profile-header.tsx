"use client";

import { ArrowLeft, CalendarPlus, Dumbbell, FileDown, HeartPulse, Lock, MessageCircle, Phone, Target, Utensils, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { PartnerClientOverviewData } from "@/lib/partners/client-overview-metrics";
import { cn } from "@/lib/utils";

type ClientTab = "avaliacoes" | "cardio" | "dietas" | "exames" | "fotos" | "treinos" | "visao-geral";

const tabs: Array<{ id: ClientTab; label: string }> = [
  { id: "visao-geral", label: "Visão Geral" },
  { id: "avaliacoes", label: "Avaliações" },
  { id: "dietas", label: "Dietas" },
  { id: "treinos", label: "Treinos" },
  { id: "cardio", label: "Cardio" },
  { id: "exames", label: "Exames" },
  { id: "fotos", label: "Fotos" },
];

const futureTabs = ["Anamnese", "Prescrições", "Formulários"];

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
  return (
    <div className="grid min-w-0 grid-cols-[32px_minmax(0,1fr)] items-center gap-3">
      <span className="flex size-8 items-center justify-center rounded-[8px] bg-[#082a43] text-[#68afe9]">{icon}</span>
      <div className="min-w-0">
        <p className="text-[12px] leading-4 text-[#9aa5b6]">{label}</p>
        <p className="truncate text-[14px] font-semibold leading-5 text-white">{value}</p>
      </div>
    </div>
  );
}

function Module({ scope }: { scope: string }) {
  const Icon = moduleIcons[scope as keyof typeof moduleIcons] ?? Target;
  return (
    <span className="inline-flex h-[42px] items-center gap-2 rounded-[10px] border border-[#2f82bf]/45 bg-[rgba(10,44,72,0.35)] px-3 text-[12px] font-semibold text-[#c5e7ff]">
      <Icon className="size-3.5" />
      {moduleLabels[scope] ?? scope}
    </span>
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
      <div className="client-overview-actions flex flex-wrap items-center justify-between gap-3">
        <Link className="inline-flex h-10 items-center gap-2 text-[13px] font-semibold text-[#8fcfff] hover:text-white" href="/parceiros/clientes">
          <ArrowLeft className="size-4" />
          Voltar para Clientes
        </Link>
        <div className="flex flex-wrap gap-3 lg:ml-auto">
          <button className="inline-flex h-12 items-center gap-3 rounded-[12px] border border-[#303746] bg-[#161a22] px-5 text-[15px] font-semibold text-[#f3f4f7]" type="button" onClick={() => window.print()}>
            <FileDown className="size-5" /> Exportar PDF
          </button>
          {whatsappHref ? (
            <a className="inline-flex h-12 items-center gap-3 rounded-[12px] border border-[#1f5f38] bg-[#0c2b1d] px-5 text-[15px] font-semibold text-[#58d881]" href={whatsappHref} rel="noreferrer" target="_blank">
              <MessageCircle className="size-5" /> Mensagem
            </a>
          ) : (
            <button className="inline-flex h-12 cursor-not-allowed items-center gap-3 rounded-[12px] border border-[#303746] bg-[#161a22] px-5 text-[15px] font-semibold text-[#6f7c89]" disabled type="button">
              <MessageCircle className="size-5" /> Mensagem
            </button>
          )}
          <button className="inline-flex h-12 items-center gap-3 rounded-[12px] bg-[#3b97e3] px-5 text-[15px] font-semibold text-white" type="button" onClick={scheduleAppointment}>
            <CalendarPlus className="size-5" /> Agendar consulta
          </button>
        </div>
      </div>

      <header className="client-overview-print-panel mt-6 grid gap-6 lg:mt-2 lg:grid-cols-[120px_minmax(0,1fr)_280px] lg:items-start">
        {overview.client.avatarUrl ? (
          <img alt="" className="size-[120px] rounded-full border-2 border-[#1d7ece]/70 object-cover" src={overview.client.avatarUrl} />
        ) : (
          <span className="flex size-[120px] items-center justify-center rounded-full border-2 border-[#1d7ece]/70 bg-[#fce4e7] text-[40px] font-bold text-[#121722]">
            {overview.client.initial}
          </span>
        )}

        <div className="min-w-0 pt-1">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="truncate text-[30px] font-bold leading-8 text-white">{overview.client.name}</h1>
            <span className="inline-flex h-[26px] items-center gap-2 rounded-[13px] bg-[#0c2b1d] px-4 text-[12px] font-medium text-[#58d881]">
              <span className="size-2 rounded-full bg-[#58d881]" />
              {overview.client.statusLabel}
            </span>
          </div>
          <p className="mt-2 truncate text-[14px] leading-5 text-[#9aa5b6]">{overview.client.email}</p>

          <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <InfoItem icon={<CalendarPlus className="size-4" />} label="Idade" value={overview.client.ageLabel} />
            <InfoItem icon={<Users className="size-4" />} label="Gênero" value={overview.client.genderLabel} />
            <InfoItem icon={<CalendarPlus className="size-4" />} label="Nascimento" value={overview.client.birthDateLabel} />
            <InfoItem icon={<Phone className="size-4" />} label="Telefone" value={overview.client.phoneLabel} />
            <InfoItem icon={<Target className="size-4" />} label="Período do plano" value={overview.client.planPeriodLabel} />
            <InfoItem icon={<Target className="size-4" />} label="Objetivo principal" value={overview.client.objectiveLabel} />
          </div>
        </div>

        <div className="lg:pt-0">
          <p className="text-[11px] font-semibold uppercase leading-[14px] tracking-[0.05em] text-[#9aa5b6]">Módulos ativos</p>
          <div className="mt-[107px] flex flex-wrap gap-2 lg:justify-end">
            {overview.client.serviceScopes.map((scope) => <Module key={scope} scope={scope} />)}
            {overview.client.serviceScopes.length === 0 ? (
              <span className="inline-flex h-[42px] items-center rounded-[10px] border border-[#303746] px-3 text-[12px] text-[#8b92a3]">Sem módulo ativo</span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="client-overview-tabs mt-7 flex min-w-0 gap-7 overflow-x-auto border-b border-[#303746]">
        {tabs.map((tab) => (
          <Link
            className={cn(
              "relative inline-flex h-[47px] shrink-0 items-center px-4 text-[14px] font-semibold transition hover:text-white",
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
        {futureTabs.map((tab) => (
          <button className="inline-flex h-[47px] shrink-0 cursor-not-allowed items-center gap-2 text-[14px] font-semibold text-[#6f7c89]" disabled key={tab} type="button">
            <Lock className="size-3.5" />
            {tab}
          </button>
        ))}
      </div>
    </>
  );
}
