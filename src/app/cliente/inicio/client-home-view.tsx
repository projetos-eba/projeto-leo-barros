import Link from "next/link";
import {
  Activity,
  CalendarClock,
  ChevronRight,
  Clock3,
  Dumbbell,
  HeartPulse,
  Salad,
  Scale,
  ShieldCheck,
  Utensils,
} from "lucide-react";

import type { ClientHomeData } from "@/lib/clients/home-metrics";
import { cn } from "@/lib/utils";

const modules = [
  {
    accent: "#3b97e3",
    buttonLabel: "Acessar painel de dieta",
    description: "Organize sua alimentação, acompanhe metas e mantenha seus hábitos alinhados ao seu plano.",
    href: "/cliente/dieta",
    icon: Utensils,
    image: "/cliente/inicio/capa-dieta.png",
    key: "dieta",
    title: "Dieta",
  },
  {
    accent: "#4ade80",
    buttonLabel: "Acessar painel de treino",
    description: "Veja sua rotina de treinos, acompanhe cargas e evolua com consistência em cada fase.",
    href: "/cliente/treino",
    icon: Dumbbell,
    image: "/cliente/inicio/capa-treino.png",
    key: "treino",
    title: "Treino",
  },
  {
    accent: "#60a5fa",
    buttonLabel: "Acessar painel de saúde",
    description: "Centralize exames, indicadores e atualizações importantes do seu acompanhamento.",
    href: "/cliente/saude",
    icon: HeartPulse,
    image: "/cliente/inicio/capa-saude.png",
    key: "saude",
    title: "Saúde",
  },
] as const;

type ClientHomeViewProps = {
  home: ClientHomeData;
};

type ModuleKey = (typeof modules)[number]["key"];

function ModuleScopeCards({ home, moduleKey }: { home: ClientHomeData; moduleKey: ModuleKey }) {
  const metric = home.latestMetrics;
  const appointment = home.nextAppointment;

  if (moduleKey === "dieta") {
    return (
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[14px] border border-white/5 bg-[#181c26]/70 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.18)] backdrop-blur-md">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#d7e2ec]">
            <Salad className="size-4 text-[#4ade80]" />
            <span>Plano alimentar</span>
          </div>
          <p className="mt-2 text-[20px] font-bold text-white">{home.client.objectiveLabel}</p>
          <p className="mt-1 text-[12px] text-[#8ea0ae]">Estratégia ativa para a jornada atual.</p>
        </div>
        <div className="rounded-[14px] border border-white/5 bg-[#181c26]/70 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.18)] backdrop-blur-md">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#d7e2ec]">
            <Scale className="size-4 text-[#8fcfff]" />
            <span>{metric?.weightLabel ?? "Medição pendente"}</span>
          </div>
          <p className="mt-2 text-[12px] text-[#8ea0ae]">
            {metric ? `Atualizado em ${metric.measuredAtLabel}` : "Sem registro recente."}
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[72%] rounded-full bg-[#3b97e3]" />
          </div>
        </div>
      </div>
    );
  }

  if (moduleKey === "treino") {
    return (
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[14px] border border-white/5 bg-[#181c26]/70 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.18)] backdrop-blur-md">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#d7e2ec]">
            <Dumbbell className="size-4 text-[#4ade80]" />
            <span>Treino do dia</span>
          </div>
          <p className="mt-2 text-[20px] font-bold text-white">Força e hipertrofia</p>
          <p className="mt-1 text-[12px] text-[#8ea0ae]">Sessão sugerida para manter consistência.</p>
        </div>
        <div className="rounded-[14px] border border-white/5 bg-[#181c26]/70 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.18)] backdrop-blur-md">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#d7e2ec]">
            <Clock3 className="size-4 text-[#facc15]" />
            <span>60 min previstos</span>
          </div>
          <p className="mt-2 text-[12px] text-[#8ea0ae]">Aquecimento, carga moderada e finalização.</p>
          <div className="mt-3 flex gap-1.5">
            <span className="h-1.5 flex-1 rounded-full bg-[#facc15]" />
            <span className="h-1.5 flex-1 rounded-full bg-[#4ade80]" />
            <span className="h-1.5 flex-1 rounded-full bg-[#ef4444]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-7 grid gap-3 sm:grid-cols-2">
      <div className="rounded-[14px] border border-white/5 bg-[#181c26]/70 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.18)] backdrop-blur-md">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-[#d7e2ec]">
          <ShieldCheck className="size-4 text-[#8fcfff]" />
          <span>Indicadores</span>
        </div>
        <p className="mt-2 text-[20px] font-bold text-white">{metric?.bodyFatLabel ?? "Acompanhar saúde"}</p>
        <p className="mt-1 text-[12px] text-[#8ea0ae]">
          {metric ? `Última medição em ${metric.measuredAtLabel}` : "Atualizações aparecerão aqui."}
        </p>
      </div>
      <div className="rounded-[14px] border border-white/5 bg-[#181c26]/70 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.18)] backdrop-blur-md">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-[#d7e2ec]">
          <Activity className="size-4 text-[#60a5fa]" />
          <span>Próximo check-in</span>
        </div>
        <p className="mt-2 text-[20px] font-bold text-white">{appointment?.timeLabel ?? "Sem agenda"}</p>
        <p className="mt-1 text-[12px] text-[#8ea0ae]">
          {appointment ? appointment.dateLabel : "Aguardando próxima atualização."}
        </p>
      </div>
    </div>
  );
}

export function ClientHomeView({ home }: ClientHomeViewProps) {
  const appointment = home.nextAppointment;
  const renewal = home.subscription;
  const activeModules = Object.values(home.modules).filter(Boolean).length;

  return (
    <div className="min-h-[calc(100vh-81px)] bg-[#07141d] text-[#f9fafb]">
      <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-5 pb-14 pt-8 sm:px-8 lg:px-12 lg:pb-12 lg:pt-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,560px)] lg:items-start">
          <div>
            <p className="text-[13px] font-semibold uppercase text-[#73b8ef]">Jornada integrada</p>
            <h1 className="mt-3 text-[38px] font-bold leading-tight text-white sm:text-[48px]">
              Olá, {home.client.firstName}
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] font-medium leading-6 text-[#b9c0d0] sm:text-[16px]">
              Bem-vindo ao seu painel central. Escolha por onde deseja iniciar hoje e acompanhe sua evolução entre dieta, treino e saúde.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative overflow-hidden rounded-[14px] border border-[#365062]/80 bg-[#101b25] p-4 shadow-[0_26px_70px_rgba(0,0,0,0.26)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5fb6ff]/70 to-transparent" />
              <div className="absolute -right-10 -top-10 size-28 rounded-full bg-[#3b97e3]/10 blur-2xl" />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-bold uppercase text-white">Plano vence em</p>
                  <p className="mt-2 text-[12px] font-semibold text-[#8ea0ae]">
                    {renewal?.statusLabel ?? "Acompanhamento ativo"}
                  </p>
                </div>
                <div className="flex h-[58px] w-[58px] flex-col items-center justify-center rounded-[12px] border border-white/10 bg-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <span className="text-[24px] font-bold leading-none text-[#e1e2ec]">
                    {renewal?.daysUntilRenewal ?? "--"}
                  </span>
                  <span className="mt-1 text-[9px] font-bold uppercase text-[#cae7ff]">dias</span>
                </div>
              </div>
              <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-[#243341]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#3b97e3] to-[#7fd0ff]"
                  style={{ width: `${Math.max(18, Math.min(100, ((renewal?.daysUntilRenewal ?? 0) / 30) * 100))}%` }}
                />
              </div>
              <div className="relative mt-4 flex items-center justify-between gap-3 text-[12px]">
                <span className="font-semibold text-[#c7d4df]">
                  {renewal ? renewal.renewalDateLabel : home.client.objectiveLabel}
                </span>
                <span className="rounded-full border border-[#3b97e3]/25 bg-[#3b97e3]/10 px-2.5 py-1 font-bold uppercase text-[#9dd6ff]">
                  {activeModules} módulos
                </span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[14px] border border-[#365062]/80 bg-[#101b25] p-4 shadow-[0_26px_70px_rgba(0,0,0,0.26)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7dd3fc]/70 to-transparent" />
              <div className="absolute -right-8 bottom-0 size-24 rounded-full bg-[#60a5fa]/10 blur-2xl" />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-bold uppercase text-white">Próxima atualização</p>
                  <p className="mt-2 text-[12px] font-semibold text-[#8ea0ae]">
                    {appointment ? appointment.title : "Agenda em aberto"}
                  </p>
                </div>
                <CalendarClock className="size-5 text-[#8fcfff]" />
              </div>
              {appointment ? (
                <div className="relative mt-4 flex items-center gap-4">
                  <div className="flex h-[64px] w-[64px] shrink-0 flex-col items-center justify-center rounded-[14px] border border-[#1d7ece] bg-[#1d7ece]/25 shadow-[0_12px_32px_rgba(29,126,206,0.22)]">
                    <span className="text-[15px] font-bold uppercase text-[#cae7ff]">{appointment.monthLabel}</span>
                    <span className="text-[26px] font-bold leading-none text-[#e1e2ec]">{appointment.dayLabel}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[24px] font-bold text-[#e1e2ec]">{appointment.timeLabel}</p>
                    <p className="mt-1 truncate text-[12px] text-[#94a3b8]">{appointment.dateLabel}</p>
                    <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#9dd6ff]">
                      Ver detalhes
                      <ChevronRight className="size-3" />
                    </p>
                  </div>
                </div>
              ) : (
                <p className="relative mt-5 text-[14px] leading-6 text-[#94a3b8]">
                  Nenhuma atualização agendada no momento.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="client-module-grid">
          {modules.map((module) => {
            const Icon = module.icon;
            const active = home.modules[module.key];

            return (
              <article
                className="client-module-card group relative min-h-[420px] overflow-hidden rounded-[14px] border border-[#1b212c]/80 bg-[#111923] shadow-[0_25px_50px_rgba(0,0,0,0.25)] lg:min-h-[600px]"
                key={module.key}
              >
                <img
                  alt=""
                  className={cn(
                    "absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]",
                    module.key === "treino" ? "object-[42%_center]" : "object-center",
                  )}
                  src={module.image}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111720] via-[#111720]/75 to-[#111720]/20" />
                <div className="absolute inset-0 bg-[#07141d]/10" />

                <div className="relative z-10 flex h-full min-h-[420px] flex-col justify-end p-6 sm:p-7 lg:min-h-[600px] lg:p-8">
                  <div className="mb-auto flex items-center justify-between gap-3">
                    <div
                      className="flex size-14 items-center justify-center rounded-full border border-white/10 bg-[#161a23]/60 text-white shadow-[0_14px_30px_rgba(0,0,0,0.22)] backdrop-blur-md lg:size-16"
                      style={{ boxShadow: `0 0 34px ${module.accent}22` }}
                    >
                      <Icon className="size-7" />
                    </div>
                    <span
                      className={cn(
                        "rounded-full border px-3 py-1 text-[11px] font-bold uppercase backdrop-blur-md",
                        active
                          ? "border-[#4ade80]/30 bg-[#4ade80]/15 text-[#c7f9dd]"
                          : "border-white/10 bg-white/10 text-[#c8d2dc]",
                      )}
                    >
                      {active ? "Ativo" : "Em breve"}
                    </span>
                  </div>

                  <div className="max-w-[520px]">
                    <h2 className="text-[34px] font-bold leading-tight text-white lg:text-[40px]">
                      {module.title}
                    </h2>
                    <div className="client-module-reveal">
                      <p className="mt-3 max-w-[560px] text-[15px] font-medium leading-6 text-[#d2dae4]">
                        {module.description}
                      </p>

                      <ModuleScopeCards moduleKey={module.key} home={home} />

                      <Link
                        className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#3b97e3] px-5 text-[15px] font-bold text-white shadow-[0_18px_35px_rgba(59,151,227,0.22)] transition hover:bg-[#4aa8f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8fcfff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111720] sm:w-auto sm:min-w-[260px]"
                        href={module.href}
                      >
                        {module.buttonLabel}
                        <ChevronRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-[#1b2b37] bg-[#17232c]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-5 py-9 text-[#8da0b1] sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <div>
            <p className="text-[20px] font-bold leading-none text-[#dce8f1]">Leonardo Barros</p>
            <p className="mt-1 text-[9px] font-semibold uppercase text-[#6f8495]">Saúde | Nutrição | Performance</p>
          </div>
          <p className="max-w-[420px] text-[13px] font-semibold leading-6">
            © 2026 Plataforma Leonardo Barros. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
