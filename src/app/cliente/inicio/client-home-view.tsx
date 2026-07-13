import Link from "next/link";
import {
  ChevronRight,
  Droplets,
  Dumbbell,
  Flame,
  HeartPulse,
  Utensils,
} from "lucide-react";

import type { ClientHomeData } from "@/lib/clients/home-metrics";
import { DEFAULT_PLATFORM_NAME } from "@/lib/branding/platform-branding-contract";
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
  platformName?: string;
};

type ModuleKey = (typeof modules)[number]["key"];

function ModuleScopeCards({ home, moduleKey }: { home: ClientHomeData; moduleKey: ModuleKey }) {
  const appointment = home.nextAppointment;
  const metricCardClass = "rounded-[14px] border border-[#6fa8d6]/20 bg-[#111b26]/82 p-4 shadow-[0_18px_42px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md";

  if (moduleKey === "dieta") {
    return (
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <div className={metricCardClass}>
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#d7e2ec]">
            <Flame className="size-4 text-[#facc15]" />
            <span>Calorias do dia</span>
          </div>
          <p className="mt-2 text-[20px] font-bold text-white">1.850 kcal</p>
          <p className="mt-1 text-[12px] text-[#8ea0ae]">Meta: 2.700 kcal</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[69%] rounded-full bg-[#3b97e3]" />
          </div>
        </div>
        <div className={metricCardClass}>
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#d7e2ec]">
            <Droplets className="size-4 text-[#8fcfff]" />
            <span>Água</span>
          </div>
          <p className="mt-2 text-[20px] font-bold text-white">2,5L / 3,5L</p>
          <p className="mt-1 text-[12px] text-[#8ea0ae]">Restam 1,0L hoje</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[71%] rounded-full bg-[#3b97e3]" />
          </div>
        </div>
      </div>
    );
  }

  if (moduleKey === "treino") {
    return (
      <div className="mt-7 grid gap-3">
        <div className={metricCardClass}>
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#d7e2ec]">
            <Dumbbell className="size-4 text-[#4ade80]" />
            <span>Treino do dia</span>
          </div>
          <p className="mt-2 text-[20px] font-bold text-white">Força e hipertrofia</p>
          <p className="mt-1 text-[12px] text-[#8ea0ae]">Sessão sugerida para manter consistência.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-7 grid gap-3">
      <div className={metricCardClass}>
        <div className="flex items-center gap-2 text-[13px] font-semibold text-[#d7e2ec]">
          <HeartPulse className="size-4 text-[#60a5fa]" />
          <span>Próxima atualização</span>
        </div>
        <p className="mt-2 text-[20px] font-bold text-white">{appointment?.dateLabel ?? "Sem agenda"}</p>
        <p className="mt-1 text-[12px] text-[#8ea0ae]">
          {appointment ? `${appointment.timeLabel} - ${appointment.title}` : "Aguardando próxima atualização."}
        </p>
      </div>
    </div>
  );
}

export function ClientHomeView({ home, platformName = DEFAULT_PLATFORM_NAME }: ClientHomeViewProps) {
  const renewal = home.subscription;

  return (
    <div className="min-h-[calc(100vh-81px)] bg-[#07141d] text-[#f9fafb]">
      <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-5 pb-14 pt-8 sm:px-8 lg:px-12 lg:pb-12 lg:pt-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(250px,340px)] lg:items-start">
          <div>
            <h1 className="text-[38px] font-bold leading-tight text-white sm:text-[48px]">
              Olá, {home.client.firstName}
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] font-medium leading-6 text-[#b9c0d0] sm:text-[16px]">
              Bem-vindo ao seu painel central. Escolha por onde deseja iniciar hoje e acompanhe sua evolução entre dieta, treino e saúde.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="relative overflow-hidden rounded-[14px] border border-[#365062]/80 bg-[#101b25] p-4 shadow-[0_26px_70px_rgba(0,0,0,0.26)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5fb6ff]/70 to-transparent" />
              <div className="absolute -right-10 -top-10 size-28 rounded-full bg-[#3b97e3]/10 blur-2xl" />
              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <p className="text-[12px] font-bold uppercase text-white">Plano vence em</p>
                  <p className="mt-2 text-[12px] font-semibold text-[#8ea0ae]">
                    {renewal?.statusLabel ?? "Acompanhamento ativo"}
                  </p>
                </div>
                <div className="grid min-w-[86px] grid-cols-[1fr_auto] overflow-hidden rounded-[12px] border border-white/10 bg-white/[0.07] text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <span className="flex min-h-[62px] items-center justify-center px-3 text-[30px] font-bold leading-none text-[#e1e2ec]">
                    {renewal?.renewalDayLabel ?? "--"}
                  </span>
                  <span className="flex min-h-[62px] flex-col items-center justify-center border-l border-white/10 px-3">
                    <span className="text-[11px] font-bold uppercase text-[#cae7ff]">{renewal?.renewalMonthLabel ?? "mês"}</span>
                    <span className="mt-1 text-[11px] font-bold text-[#9fb1c0]">{renewal?.renewalYearLabel ?? "----"}</span>
                  </span>
                </div>
              </div>
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

                <div className="relative z-10 flex h-full min-h-[420px] flex-col p-6 sm:p-7 lg:min-h-[600px] lg:p-8">
                  <div className="client-module-chrome mb-auto flex items-center justify-between gap-3">
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

                  <div className="client-module-content max-w-[520px]">
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
            <p className="text-[20px] font-bold leading-none text-[#dce8f1]">{platformName}</p>
            <p className="mt-1 text-[9px] font-semibold uppercase text-[#6f8495]">Saúde | Nutrição | Performance</p>
          </div>
          <p className="max-w-[420px] text-[13px] font-semibold leading-6">
            © 2026 Plataforma {platformName}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
