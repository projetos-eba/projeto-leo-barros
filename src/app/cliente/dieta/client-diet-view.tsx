"use client";

import {
  Beef,
  CalendarDays,
  Check,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Clock3,
  Droplets,
  Dumbbell,
  Eye,
  Flame,
  HeartPulse,
  Minus,
  RefreshCw,
  Target,
  Trophy,
  Utensils,
  Wheat,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PointerEvent, ReactNode } from "react";
import { useEffect, useState, useTransition } from "react";

import type { ClientDietData, ClientDietMeal } from "@/lib/clients/diet-metrics";
import { cn } from "@/lib/utils";

import {
  addClientDietWater,
  applyClientDietMealSubstitution,
  saveClientDietMealNote,
  setClientDietMealStatus,
  type ClientDietMealStatus,
} from "./actions";

type ClientDietViewProps = {
  diet: ClientDietData | null;
};

type ModalState =
  | { itemId?: string; meal: ClientDietMeal }
  | null;

const moduleCards = [
  {
    href: "/cliente/dieta",
    icon: Utensils,
    image: "/cliente/inicio/capa-dieta.png",
    key: "dieta",
    title: "Dieta",
  },
  {
    href: "/cliente/treino",
    icon: Dumbbell,
    image: "/cliente/inicio/capa-treino.png",
    key: "treino",
    title: "Treino",
  },
  {
    href: "/cliente/saude",
    icon: HeartPulse,
    image: "/cliente/inicio/capa-saude.png",
    key: "saude",
    title: "Saúde",
  },
] as const;

function formatNumber(value: number, maximumFractionDigits = 0) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits });
}

function macroPercent(value: number, target: number) {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
}

function dayMealScore(meals: ClientDietMeal[]) {
  if (!meals.length) return 0;
  const score = meals.reduce((total, meal) => {
    if (meal.status === "completed") return total + 1;
    if (meal.status === "partial") return total + 0.5;
    return total;
  }, 0);
  return Math.round((score / meals.length) * 100);
}

function statusTone(meal: ClientDietMeal) {
  if (meal.status === "completed") return "success";
  if (meal.status === "partial") return "warning";
  if (meal.status === "skipped") return "danger";
  if (meal.isNext) return "active";
  return "muted";
}

function shiftIsoDate(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function todayIsoDate() {
  const date = new Date();
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "rounded-[14px] border border-[#213444] bg-[linear-gradient(146deg,rgba(17,31,43,0.96)_0%,rgba(8,18,27,0.94)_100%)] shadow-[0_22px_70px_rgba(0,0,0,0.28)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function EmptyDiet() {
  return (
    <div className="min-h-[calc(100vh-81px)] bg-[#07141d] px-5 py-10 text-white sm:px-8 lg:px-12">
      <Panel className="mx-auto max-w-[920px] p-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-[14px] bg-[#12385a] text-[#8fcfff]">
          <Utensils className="size-7" />
        </div>
        <h1 className="mt-5 text-[30px] font-bold">Minha Dieta</h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-6 text-[#9fb1c0]">
          Seu plano alimentar ainda não foi publicado. Assim que o acompanhamento estiver disponível, sua rotina aparecerá aqui.
        </p>
        <Link
          className="mt-6 inline-flex h-11 items-center justify-center rounded-[10px] bg-[#2d9cff] px-5 text-[14px] font-bold text-white"
          href="/cliente/inicio"
        >
          Voltar para Home
        </Link>
      </Panel>
    </div>
  );
}

function ModuleSelector() {
  return (
    <nav aria-label="Módulos do cliente" className="mx-auto grid w-full max-w-[870px] grid-cols-3 gap-2 sm:gap-4">
      {moduleCards.map((module) => {
        const Icon = module.icon;
        const active = module.key === "dieta";
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "group inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-[12px] border px-2 text-[13px] font-bold transition sm:h-[66px] sm:gap-3 sm:text-[18px]",
              active
                ? "border-[#168bff] bg-[#082d52] text-[#eaf6ff] shadow-[0_0_18px_rgba(22,139,255,0.45)]"
                : "border-[#24465f]/85 bg-[#071c2a]/80 text-[#8fa2b4] hover:border-[#3b97e3] hover:text-[#d8e8f4]",
            )}
            href={module.href}
            key={module.key}
          >
            <Icon className={cn("size-4 shrink-0 sm:size-6", active ? "text-[#91b9d6]" : "text-[#6f879b]")} />
            <span className="truncate">{module.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function MacroBadge({ color, icon, label, target, value }: { color: "blue" | "green" | "red" | "yellow"; icon: ReactNode; label: string; target?: number; value: number }) {
  const colorClass = {
    blue: "border-[#1f8dff]/35 text-[#6fc0ff]",
    green: "border-[#4ade80]/35 text-[#68e49a]",
    red: "border-[#f87171]/35 text-[#ff8585]",
    yellow: "border-[#facc15]/35 text-[#ffd45a]",
  }[color];
  return (
    <div className="rounded-[10px] border border-[#223646] bg-[#0d1822]/75 px-4 py-3">
      <div className={cn("flex items-center gap-2 text-[12px] font-semibold", colorClass)}>
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-[20px] font-bold text-white">
        {formatNumber(value, 1)}
        <span className="ml-1 text-[12px] text-[#93a6b5]">{label === "Calorias" ? "kcal" : "g"}</span>
      </p>
      {target !== undefined ? <p className="mt-1 text-[11px] text-[#7f91a1]">Meta {formatNumber(target, 1)}{label === "Calorias" ? " kcal" : "g"}</p> : null}
    </div>
  );
}

function MealStatusActions({
  disabled,
  meal,
  onChange,
}: {
  disabled?: boolean;
  meal: ClientDietMeal;
  onChange: (status: ClientDietMealStatus) => void;
}) {
  const actions: Array<{ label: string; status: ClientDietMealStatus; tone: "blue" | "green" | "red" }> = [
    { label: "Realizei", status: "completed", tone: "green" },
    { label: "Parcial", status: "partial", tone: "blue" },
    { label: "Pulei", status: "skipped", tone: "red" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {actions.map((action) => {
        const active = meal.status === action.status;
        const nextStatus: ClientDietMealStatus = active ? "pending" : action.status;
        const className = action.tone === "green"
          ? active ? "border-[#35c46d] bg-[#123d2a] text-[#9df3b8]" : "border-[#25543a] bg-[#0d1e18] text-[#9df3b8] hover:border-[#35c46d]"
          : action.tone === "blue"
            ? active ? "border-[#2d9cff] bg-[#12385a] text-[#9fd4ff]" : "border-[#263949] bg-[#0d1822] text-[#c8d6e1] hover:border-[#2d9cff]"
            : active ? "border-[#f87171] bg-[#3a171b] text-[#ffadad]" : "border-[#3a2228] bg-[#1c1216] text-[#ffadad] hover:border-[#f87171]";
        return (
          <button
            className={cn("inline-flex h-11 items-center justify-center rounded-[9px] border px-2 text-[12px] font-bold transition disabled:opacity-55 sm:text-[13px]", className)}
            disabled={disabled}
            key={action.status}
            type="button"
            onClick={() => onChange(nextStatus)}
          >
            {active ? "Reabrir" : action.label}
          </button>
        );
      })}
    </div>
  );
}

function MealNoteForm({
  diet,
  meal,
  onSave,
}: {
  diet: ClientDietData;
  meal: ClientDietMeal;
  onSave: (formData: FormData) => void;
}) {
  const [note, setNote] = useState(meal.notes ?? "");

  useEffect(() => {
    setNote(meal.notes ?? "");
  }, [meal.id, meal.notes]);

  return (
    <details className="rounded-[10px] border border-[#213444] bg-[#081522]/70">
      <summary className="cursor-pointer px-3 py-2 text-[12px] font-bold text-[#9fb1c0]">Observação para o profissional</summary>
      <form
        className="grid gap-2 px-3 pb-3"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          onSave(formData);
        }}
      >
        <input name="mealId" type="hidden" value={meal.id} />
        <input name="logDate" type="hidden" value={diet.selectedDate.iso} />
        <textarea
          className="min-h-[72px] resize-y rounded-[8px] border border-[#263949] bg-[#09131c] p-3 text-[13px] text-white outline-none placeholder:text-[#718394] focus:border-[#2d9cff]"
          maxLength={1000}
          name="notes"
          placeholder="Ex.: fiz metade, troquei o horário, senti fome..."
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <button className="h-9 justify-self-end rounded-[8px] bg-[#12385a] px-4 text-[12px] font-bold text-[#9fd4ff] hover:bg-[#174a75]" type="submit">
          Salvar observação
        </button>
      </form>
    </details>
  );
}

function NextMealCard({
  diet,
  isFocusLocked,
  meal,
  nextMeal,
  onMealFocus,
  onModal,
  onReleaseFocus,
}: {
  diet: ClientDietData;
  isFocusLocked: boolean;
  meal: ClientDietMeal | null;
  nextMeal: ClientDietMeal | null;
  onMealFocus: (mealId: string) => void;
  onModal: (state: ModalState) => void;
  onReleaseFocus: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!meal || !diet.plan) return null;
  const activeMeal = meal;

  function refreshAfter(action: Promise<{ error?: string; ok: boolean }>) {
    startTransition(async () => {
      const result = await action;
      if (!result.ok) window.alert(result.error ?? "Não foi possível completar a ação.");
      router.refresh();
    });
  }

  return (
    <Panel className="relative min-h-[430px] overflow-hidden border-[#18425f]/75 bg-[#031d2d] p-5 shadow-[0_14px_28px_rgba(0,17,29,0.55)] sm:p-7 lg:min-h-[610px]">
      <img alt="" className="absolute inset-x-0 top-0 h-[220px] w-full object-cover opacity-55 sm:h-[280px] lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:w-[56%] lg:opacity-90" src={activeMeal.imageSrc} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,29,45,0.42)_0%,#031d2d_220px),linear-gradient(90deg,rgba(5,37,60,0.98)_0%,rgba(5,37,60,0.88)_42%,rgba(0,22,36,0.28)_100%)] lg:bg-[linear-gradient(90deg,rgba(5,37,60,0.98)_0%,rgba(5,37,60,0.92)_48%,rgba(0,22,36,0.18)_100%)]" />
      <div className="relative z-10 flex min-h-full max-w-[680px] flex-col">
        <span className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#2b9dff] sm:text-[14px]">Próxima refeição</span>
        <h2 className="mt-3 text-[34px] font-extrabold leading-tight text-white sm:text-[40px]">
          {activeMeal.title} <span className="text-[22px] font-bold text-[#bfd0de] sm:text-[28px]">· {activeMeal.timeLabel}</span>
        </h2>
        <p className="mt-2 text-[15px] font-medium text-[#91a6b7] sm:text-[16px]">É a sua próxima ação de hoje.</p>
        {isFocusLocked ? (
          <div className="mt-4 flex flex-col gap-3 rounded-[12px] border border-[#2d9cff]/35 bg-[#0b2235]/85 p-3 text-[13px] font-semibold text-[#b8dfff] sm:flex-row sm:items-center sm:justify-between">
            <span>Refeição mantida em foco para registrar observação ou ajuste.</span>
            {nextMeal ? (
              <button
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-[8px] border border-[#3b97e3]/60 px-3 text-[12px] font-bold text-white transition hover:bg-[#12385a]"
                type="button"
                onClick={onReleaseFocus}
              >
                Ver próxima refeição
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 grid max-w-[430px] gap-3">
          {activeMeal.items.slice(0, 5).map((item) => (
            <div className="flex items-center justify-between gap-4 text-[14px] sm:text-[15px]" key={item.id}>
              <span className="flex min-w-0 items-center gap-3 text-[#b8c8d6] before:size-2 before:shrink-0 before:rounded-full before:bg-[#168bff] before:content-['']">
                <span className="truncate">{item.name}</span>
              </span>
              <span className="shrink-0 text-[#8398ab]">{item.amountLabel}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MacroBadge color="blue" icon={<Flame className="size-4" />} label="Calorias" value={activeMeal.totals.kcal} />
          <MacroBadge color="green" icon={<Beef className="size-4" />} label="Proteína" value={activeMeal.totals.protein} />
          <MacroBadge color="yellow" icon={<Wheat className="size-4" />} label="Carbo" value={activeMeal.totals.carbs} />
          <MacroBadge color="red" icon={<Droplets className="size-4" />} label="Gordura" value={activeMeal.totals.fat} />
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.85fr)]">
          <button
            className="inline-flex h-14 items-center justify-center gap-3 rounded-[10px] bg-[#087bff] px-5 text-[16px] font-extrabold text-white shadow-[0_10px_18px_rgba(8,123,255,0.35)] transition hover:bg-[#168bff] disabled:opacity-60"
            disabled={pending}
            type="button"
            onClick={() => {
              onMealFocus(activeMeal.id);
              refreshAfter(setClientDietMealStatus(activeMeal.id, diet.selectedDate.iso, activeMeal.status === "completed" ? "pending" : "completed"));
            }}
          >
            {activeMeal.status === "completed" ? "Reabrir refeição" : "Registrar refeição"}
            <ChevronRight className="size-5" />
          </button>
          <button
            className="inline-flex h-14 items-center justify-center gap-2 rounded-[10px] border border-[#263949] bg-[#071f31]/78 px-4 text-[14px] font-bold text-[#d8e8f4] transition hover:border-[#3b97e3]"
            type="button"
            onClick={() => onModal({ meal: activeMeal })}
          >
            <Eye className="size-4" />
            Ver detalhes
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-[#263949] bg-[#071f31]/78 px-4 text-[13px] font-bold text-[#c8d6e1] transition hover:border-[#3b97e3]"
            type="button"
            onClick={() => onModal({ meal: activeMeal })}
          >
            <RefreshCw className="size-4" />
            Substituições
          </button>
          <MealNoteForm diet={diet} meal={activeMeal} onSave={(formData) => refreshAfter(saveClientDietMealNote(formData))} />
        </div>
      </div>
    </Panel>
  );
}

function ProgressCard({ diet, meals }: { diet: ClientDietData; meals: ClientDietMeal[] }) {
  const { consumed, targets } = diet.progress;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const adherencePct = dayMealScore(meals);
  const ringRadius = 82;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - adherencePct / 100);
  const registeredMeals = meals.filter((meal) => meal.status !== "pending").length;
  const completedMeals = meals.filter((meal) => meal.status === "completed" || meal.status === "partial").length;
  const proteinPct = macroPercent(consumed.protein, targets.protein);
  const carbsPct = macroPercent(consumed.carbs, targets.carbs);
  const fatPct = macroPercent(consumed.fat, targets.fat);
  const macrosPct = Math.round((proteinPct + carbsPct + fatPct) / 3);

  function adjustWater(amountMl: number) {
    startTransition(async () => {
      const result = await addClientDietWater(diet.selectedDate.iso, amountMl);
      if (!result.ok) window.alert(result.error ?? "Não foi possível atualizar água.");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4">
      <Panel className="p-4 sm:p-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(190px,0.95fr)_minmax(0,1fr)]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-[#12385a] text-[#5bb8ff]">
                <Clock3 className="size-4" />
              </span>
              <h2 className="text-[18px] font-extrabold text-white">Aderência hoje</h2>
            </div>
            <div className="mx-auto mt-5 grid size-[210px] place-items-center rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(22,139,255,0.18),rgba(5,23,36,0.95)_62%)] sm:size-[230px]">
              <svg aria-label={`${adherencePct}% de aderência hoje`} className="absolute size-[210px] -rotate-90 sm:size-[230px]" viewBox="0 0 210 210">
                <circle cx="105" cy="105" fill="none" r={ringRadius} stroke="#173348" strokeWidth="16" />
              <circle
                cx="105"
                cy="105"
                fill="none"
                r={ringRadius}
                stroke="#2d9cff"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                strokeWidth="16"
              />
            </svg>
              <div className="relative grid text-center">
                <p className="text-[48px] font-extrabold leading-none text-white">{adherencePct}%</p>
                <p className="mt-3 text-[13px] font-bold text-[#58d78a]">● Muito bom</p>
              </div>
            </div>
          </div>

          <div className="grid content-start gap-3">
            <AdherenceFact icon={<Utensils className="size-4" />} label="Refeições" value={`${completedMeals} / ${meals.length}`} />
            <AdherenceFact icon={<Droplets className="size-4" />} label="Hidratação" value={diet.hydration.label} />
            <AdherenceFact icon={<Target className="size-4" />} label="Macros" value={`${macrosPct}%`} />
            <AdherenceFact icon={<ClipboardCheck className="size-4" />} label="Registros" value={`${registeredMeals} ações`} />
          </div>
        </div>
        <div className="mt-5 grid gap-3 border-t border-[#213444] pt-4 sm:grid-cols-3">
          <MacroProgress color="green" label="Proteína" target={targets.protein} value={consumed.protein} />
          <MacroProgress color="yellow" label="Carbo" target={targets.carbs} value={consumed.carbs} />
          <MacroProgress color="red" label="Gordura" target={targets.fat} value={consumed.fat} />
        </div>
      </Panel>

      <Panel className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Droplets className="size-5 text-[#2d9cff]" />
              <h2 className="text-[20px] font-bold text-white">Hidratação</h2>
            </div>
            <p className="mt-3 text-[26px] font-bold text-white">{diet.hydration.label}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex h-9 items-center justify-center gap-1 rounded-full border border-[#263949] px-4 text-[13px] font-bold text-[#c8d6e1] transition hover:border-[#3b97e3] disabled:opacity-45"
              disabled={pending || diet.hydration.currentMl <= 0}
              type="button"
              onClick={() => adjustWater(-250)}
            >
              <Minus className="size-3.5" /> - 250ml
            </button>
            <button
              className="inline-flex h-9 items-center justify-center rounded-full bg-[#1f8dff] px-5 text-[13px] font-bold text-white disabled:opacity-60"
              disabled={pending}
              type="button"
              onClick={() => adjustWater(250)}
            >
              + 250ml
            </button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {diet.hydration.cups.map((filled, index) => (
            <span
              className={cn(
                "block h-9 w-5 rounded-b-[7px] rounded-t-[3px] border-2",
                filled ? "border-[#1f8dff] bg-[#1f8dff]/80" : "border-[#405465] bg-transparent",
              )}
              key={`${filled}-${index}`}
            />
          ))}
        </div>
        <p className="mt-4 text-center text-[13px] font-medium text-[#9fb1c0]">Faltam {diet.hydration.remainingCups} copos para bater sua meta.</p>
      </Panel>
    </div>
  );
}

function AdherenceFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 rounded-[10px] border border-[#12304a]/70 bg-[#061d2e]/72 px-3 py-3">
      <span className="flex size-8 items-center justify-center rounded-full bg-[#12385a] text-[#4ab1ff]">{icon}</span>
      <span className="truncate text-[13px] font-bold text-[#91a3b5]">{label}</span>
      <span className="text-[14px] font-extrabold text-[#eaf2fa]">{value}</span>
    </div>
  );
}

function MacroProgress({ color, label, target, value }: { color: "green" | "red" | "yellow"; label: string; target: number; value: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const bar = color === "green" ? "bg-[#68e6cf]" : color === "yellow" ? "bg-[#facc15]" : "bg-[#f87171]";
  return (
    <div className="rounded-[10px] border border-[#213444] bg-[#0b1620] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className={cn("text-[13px] font-bold", color === "green" ? "text-[#68e49a]" : color === "yellow" ? "text-[#ffd45a]" : "text-[#ff8585]")}>{label}</p>
        <p className="text-[12px] font-semibold text-[#9fb1c0]">{pct}%</p>
      </div>
      <p className="mt-1 text-[18px] font-bold text-white">{formatNumber(value, 1)}<span className="text-[12px] text-[#8ea0ae]"> / {formatNumber(target, 1)}g</span></p>
      <div className="mt-3 h-2 rounded-full bg-[#243441]">
        <div className={cn("h-full rounded-full", bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MealTimeline({ meals }: { meals: ClientDietMeal[] }) {
  return (
    <Panel className="px-3 py-3 sm:overflow-x-auto sm:px-7 sm:py-4">
      <div className="grid grid-cols-5 items-start gap-2 sm:flex sm:min-w-[720px] sm:items-center sm:justify-between sm:gap-4">
        {meals.map((meal, index) => {
          const tone = statusTone(meal);
          return (
            <div className="flex min-w-0 flex-1 items-start justify-center gap-2 sm:items-center sm:gap-4" key={meal.id}>
              <div className="grid min-w-0 justify-items-center text-center sm:min-w-[86px]">
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-full border text-[12px] font-extrabold shadow-[0_0_18px_rgba(0,0,0,0.18)] sm:size-11 sm:text-[13px]",
                    tone === "success" && "border-[#3bd37d] bg-[#12422c] text-[#7df0a8]",
                    tone === "warning" && "border-[#f0be23] bg-[#3d2f12] text-[#ffd45a]",
                    tone === "danger" && "border-[#f87171] bg-[#3a171b] text-[#ffadad]",
                    tone === "active" && "border-[#168bff] bg-[#0d57a6] text-[#9fd4ff] shadow-[0_0_22px_rgba(22,139,255,0.36)]",
                    tone === "muted" && "border-[#405465] bg-[#10202d] text-[#718394]",
                  )}
                >
                  {tone === "success" ? <Check className="size-4 sm:size-5" /> : tone === "active" ? <Target className="size-4 sm:size-5" /> : <Circle className="size-3 sm:size-4" />}
                </span>
                <p className="mt-2 w-full truncate text-[11px] font-extrabold text-white sm:text-[13px]">{meal.title}</p>
                <p className={cn("text-[11px] font-bold sm:text-[12px]", tone === "success" ? "text-[#58d78a]" : tone === "active" ? "text-[#2b9dff]" : tone === "warning" ? "text-[#f0be23]" : "text-[#718394]")}>
                  {meal.timeLabel}
                </p>
                <p className="hidden text-[11px] font-semibold text-[#7f91a1] sm:block">{meal.statusLabel}</p>
              </div>
              {index < meals.length - 1 ? (
                <div className="hidden h-px flex-1 border-t border-dashed border-[#31506a] sm:block" />
              ) : null}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function MealPlan({
  diet,
  meals,
  onModal,
  selectedMenuOption,
  setSelectedMenuOption,
}: {
  diet: ClientDietData;
  meals: ClientDietMeal[];
  onModal: (state: ModalState) => void;
  selectedMenuOption: number;
  setSelectedMenuOption: (value: number) => void;
}) {
  return (
    <Panel className="p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[26px] font-extrabold text-white sm:text-[28px]">Plano do dia</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {diet.menuOptions.length > 1 ? (
            <label className="flex items-center gap-2 text-[12px] font-semibold text-[#9fb1c0]">
              Opção
              <select
                className="h-10 rounded-[9px] border border-[#263949] bg-[#09131c] px-3 text-[13px] font-bold text-white outline-none focus:border-[#2d9cff]"
                value={selectedMenuOption}
                onChange={(event) => setSelectedMenuOption(Number(event.target.value))}
              >
                {diet.menuOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          ) : null}
          <p className="text-[13px] font-semibold text-[#79bff4]">{diet.plan?.statusLabel}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        {meals.map((meal) => (
          <MealRow diet={diet} key={meal.id} meal={meal} onModal={onModal} />
        ))}
      </div>
    </Panel>
  );
}

function MealRow({ diet, meal, onModal }: { diet: ClientDietData; meal: ClientDietMeal; onModal: (state: ModalState) => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const tone = statusTone(meal);

  function run(action: Promise<{ error?: string; ok: boolean }>) {
    startTransition(async () => {
      const result = await action;
      if (!result.ok) window.alert(result.error ?? "Não foi possível completar a ação.");
      router.refresh();
    });
  }

  return (
    <details
      className={cn(
        "group overflow-hidden rounded-[10px] border bg-[#061d2e]/78 transition",
        meal.isNext ? "border-[#168bff] shadow-[0_0_0_1px_rgba(22,139,255,0.25)]" : "border-[#213444]",
      )}
      open={meal.isNext || meal.status === "partial"}
    >
      <summary className="grid cursor-pointer list-none grid-cols-2 gap-3 px-3 py-3 marker:hidden sm:grid-cols-[minmax(0,1fr)_86px_92px_92px_92px_32px] sm:items-center sm:px-4">
        <div className="col-span-2 flex min-w-0 items-center gap-3 sm:col-span-1">
          <span
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-full border",
              tone === "success" && "border-[#3bd37d] bg-[#12422c] text-[#7df0a8]",
              tone === "warning" && "border-[#f0be23] bg-[#3d2f12] text-[#ffd45a]",
              tone === "danger" && "border-[#f87171] bg-[#3a171b] text-[#ffadad]",
              tone === "active" && "border-[#168bff] bg-[#0d57a6] text-[#9fd4ff]",
              tone === "muted" && "border-[#405465] bg-[#10202d] text-[#718394]",
            )}
          >
            {tone === "success" ? <Check className="size-4" /> : tone === "active" ? <Target className="size-4" /> : <Circle className="size-3" />}
          </span>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="truncate text-[17px] font-extrabold text-white">{meal.title}</h3>
              <span className="text-[12px] font-semibold text-[#718394]">{meal.timeLabel}</span>
            </div>
            <p className="text-[11px] font-bold text-[#7f91a1]">{meal.statusLabel}</p>
          </div>
        </div>
        <span className="rounded-[8px] bg-[#0b1620]/75 px-2 py-1 text-[12px] font-bold text-[#c7d3df] sm:justify-self-end sm:bg-transparent sm:px-0 sm:py-0 sm:text-[13px]">{formatNumber(meal.totals.kcal)} kcal</span>
        <span className="rounded-[8px] bg-[#10231c]/70 px-2 py-1 text-[12px] font-extrabold text-[#58d78a] sm:justify-self-end sm:bg-transparent sm:px-0 sm:py-0 sm:text-[13px]">{formatNumber(meal.totals.protein, 1)} g</span>
        <span className="rounded-[8px] bg-[#2c2412]/70 px-2 py-1 text-[12px] font-extrabold text-[#f0be23] sm:justify-self-end sm:bg-transparent sm:px-0 sm:py-0 sm:text-[13px]">{formatNumber(meal.totals.carbs, 1)} g</span>
        <span className="rounded-[8px] bg-[#2b1419]/70 px-2 py-1 text-[12px] font-extrabold text-[#ff6d7b] sm:justify-self-end sm:bg-transparent sm:px-0 sm:py-0 sm:text-[13px]">{formatNumber(meal.totals.fat, 1)} g</span>
        <ChevronRight className="hidden size-5 rotate-90 justify-self-end text-[#8fa3b5] transition group-open:-rotate-90 sm:block" />
      </summary>

      <div className="grid gap-4 border-t border-[#11354d] p-3 sm:grid-cols-[minmax(0,1fr)_290px_270px] sm:p-4">
        <div className="rounded-[10px] border border-[#12304a] bg-[#041929]/68">
          <div className="grid grid-cols-[minmax(0,1fr)_86px] gap-3 border-b border-[#12304a] px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#718394]">
            <span>Alimento</span>
            <span className="text-right">Porção</span>
          </div>
          <div className="grid gap-0">
            {meal.items.map((item) => (
              <div className="grid grid-cols-[minmax(0,1fr)_86px] gap-3 border-b border-[#12304a]/55 px-4 py-3 last:border-b-0" key={item.id}>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[#c8d6e1]">{item.name}</p>
                  {item.replacementLabel ? <p className="mt-1 text-[11px] font-semibold text-[#8fcfff]">{item.replacementLabel}</p> : null}
                </div>
                <span className="text-right text-[13px] font-bold text-[#91a3b5]">{item.amountLabel}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[10px] border border-[#12304a] bg-[#041929]/68 p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#718394]">Resumo da refeição</p>
          <div className="mt-4 grid gap-3 text-[12px] font-semibold">
            <MealSummaryLine color="#2d9cff" label="Calorias" value={`${formatNumber(meal.totals.kcal)} kcal`} />
            <MealSummaryLine color="#58d78a" label="Proteína" value={`${formatNumber(meal.totals.protein, 1)} g`} />
            <MealSummaryLine color="#f0be23" label="Carboidrato" value={`${formatNumber(meal.totals.carbs, 1)} g`} />
            <MealSummaryLine color="#ff6d7b" label="Gordura" value={`${formatNumber(meal.totals.fat, 1)} g`} />
          </div>
        </div>

        <div className="rounded-[10px] border border-[#12304a] bg-[#041929]/68 p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#718394]">Ações da refeição</p>
          <div className="mt-4 grid gap-3">
            {meal.completedAtLabel && meal.status === "completed" ? (
              <p className="text-[11px] font-semibold text-[#7df0a8]">Registrada às {meal.completedAtLabel}</p>
            ) : null}
            <MealStatusActions
              disabled={pending}
              meal={meal}
              onChange={(status) => run(setClientDietMealStatus(meal.id, diet.selectedDate.iso, status))}
            />
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-[#263949] text-[12px] font-bold text-[#c8d6e1] transition hover:border-[#3b97e3]" type="button" onClick={() => onModal({ meal })}>
              <RefreshCw className="size-4" />
              Substituições
            </button>
          </div>
        </div>

        <div className="sm:col-span-3">
          <MealNoteForm diet={diet} meal={meal} onSave={(formData) => run(saveClientDietMealNote(formData))} />
        </div>
      </div>
    </details>
  );
}

function MealSummaryLine({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-[#91a3b5]">
        <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="font-extrabold text-[#eaf2fa]">{value}</span>
    </div>
  );
}

function smoothLinePath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;

    const previous = points[index - 1];
    const beforePrevious = points[index - 2] ?? previous;
    const next = points[index + 1] ?? point;
    const controlOneX = previous.x + (point.x - beforePrevious.x) / 6;
    const controlOneY = previous.y + (point.y - beforePrevious.y) / 6;
    const controlTwoX = point.x - (next.x - previous.x) / 6;
    const controlTwoY = point.y - (next.y - previous.y) / 6;

    return `${path} C ${controlOneX} ${controlOneY}, ${controlTwoX} ${controlTwoY}, ${point.x} ${point.y}`;
  }, "");
}

function WeekEvolution({ diet }: { diet: ClientDietData }) {
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(14);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const chartWidth = 720;
  const chartHeight = 210;
  const visiblePoints = diet.week.points.slice(-rangeDays);
  const chartPoints = visiblePoints.length ? visiblePoints : diet.week.points.slice(-1);
  const points = chartPoints.map((point, index) => {
    const x = chartPoints.length <= 1 ? chartWidth / 2 : 42 + (index * (chartWidth - 84)) / (chartPoints.length - 1);
    const y = chartHeight - 28 - (Math.max(0, Math.min(100, point.percent)) / 100) * (chartHeight - 56);
    return { ...point, x, y };
  });
  const linePath = smoothLinePath(points);
  const selectedRegisteredMeals = chartPoints.reduce((total, point) => total + point.completedMeals, 0);
  const selectedTotalMeals = chartPoints.reduce((total, point) => total + point.totalMeals, 0);
  const averageAdherence = selectedTotalMeals > 0 ? Math.round((selectedRegisteredMeals / selectedTotalMeals) * 100) : 0;
  const rangeAdherenceDays = chartPoints.filter((point) => point.completedMeals > 0).length;
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const highlightedPoint = points[activePointIndex ?? points.length - 1];
  const activePoint = activePointIndex === null ? null : points[activePointIndex];
  const targetPercent = 80;
  const targetY = chartHeight - 28 - (targetPercent / 100) * (chartHeight - 56);
  const zoneTopY = chartHeight - 28 - (100 / 100) * (chartHeight - 56);
  const tooltipLeft = activePoint ? Math.min(82, Math.max(18, (activePoint.x / chartWidth) * 100)) : 50;
  const tooltipTop = activePoint ? Math.min(66, Math.max(14, (activePoint.y / chartHeight) * 100 - 12)) : 18;

  function activateNearestPoint(event: PointerEvent<HTMLDivElement>) {
    if (!points.length) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * chartWidth;
    const nearestIndex = points.reduce((nearest, point, index) => (
      Math.abs(point.x - x) < Math.abs(points[nearest].x - x) ? index : nearest
    ), 0);
    setActivePointIndex(nearestIndex);
  }

  return (
    <Panel className="p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[20px] font-extrabold leading-tight text-white sm:text-[28px]">Evolução e consistência</h2>
        <div className="grid shrink-0 grid-cols-3 gap-1 rounded-[10px] bg-[#050f19]/70 p-1">
          {[
            { label: "7D", value: 7 },
            { label: "14D", value: 14 },
            { label: "30D", value: 30 },
          ].map((range) => (
            <button
              aria-pressed={rangeDays === range.value}
              className={cn(
                "h-8 min-w-11 rounded-[8px] border px-2 text-[11px] font-extrabold transition sm:h-9 sm:min-w-14 sm:px-4 sm:text-[12px]",
                rangeDays === range.value ? "border-[#2e9bff] bg-[#087bff] text-white shadow-[0_10px_18px_rgba(8,123,255,0.35)]" : "border-[#1d4561] bg-[#061e31]/72 text-[#afc1d1]",
              )}
              key={range.value}
              type="button"
              onClick={() => setRangeDays(range.value as 7 | 14 | 30)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:mt-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0 rounded-[10px] border border-[#21475f]/75 bg-[#061c2d]/72 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[14px] font-extrabold text-[#dce8f2] sm:text-[15px]">Aderência ao plano (%)</p>
              <p className="mt-1 text-[11px] font-semibold text-[#7f91a1]">Refeições realizadas no período.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden rounded-full border border-[#2d9cff]/35 bg-[#061e31] px-2.5 py-1 text-[11px] font-extrabold text-[#8fcfff] sm:inline-flex">
                Meta 80%
              </span>
              <span className="rounded-full border border-[#1d4561] bg-[#061e31] px-2.5 py-1 text-[11px] font-extrabold text-[#8fcfff]">
                {averageAdherence}%
              </span>
            </div>
          </div>
          <div className="relative mt-4 overflow-hidden rounded-[8px] bg-[#061726] p-3 sm:mt-5">
            <div
              className="relative h-[184px] touch-pan-y sm:h-[230px]"
              role="img"
              aria-label={`Aderência média de ${averageAdherence}% nos últimos ${rangeDays} dias`}
              onPointerLeave={() => setActivePointIndex(null)}
              onPointerMove={activateNearestPoint}
            >
              <svg
                aria-hidden="true"
                className="absolute inset-0 h-full w-full overflow-visible"
                preserveAspectRatio="none"
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              >
                <defs>
                  <linearGradient id="diet-adherence-area" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#48afff" stopOpacity="0.38" />
                    <stop offset="58%" stopColor="#168bff" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#168bff" stopOpacity="0.03" />
                  </linearGradient>
                  <linearGradient id="diet-adherence-line" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#78c8ff" />
                    <stop offset="55%" stopColor="#2d9cff" />
                    <stop offset="100%" stopColor="#84d4ff" />
                  </linearGradient>
                  <filter id="diet-adherence-glow" height="180%" width="180%" x="-40%" y="-40%">
                    <feGaussianBlur result="blur" stdDeviation="2.4" />
                    <feColorMatrix in="blur" result="glow" type="matrix" values="0 0 0 0 0.15 0 0 0 0 0.6 0 0 0 0 1 0 0 0 0.42 0" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <rect fill="rgba(45,156,255,0.07)" height={targetY - zoneTopY} rx="10" width={chartWidth - 84} x="42" y={zoneTopY} />
                {[0, 20, 40, 60, 80, 100].map((tick) => {
                  const y = chartHeight - 28 - (tick / 100) * (chartHeight - 56);
                  return (
                    <line
                      key={tick}
                      stroke={tick === 80 ? "#72c7ff" : "#1d4b68"}
                      strokeDasharray={tick === 80 ? "8 8" : "5 10"}
                      strokeOpacity={tick === 80 ? 0.95 : 0.5}
                      x1="42"
                      x2={chartWidth - 42}
                      y1={y}
                      y2={y}
                    />
                  );
                })}
                {linePath ? <path d={`${linePath} L ${lastPoint?.x ?? 42} ${chartHeight - 28} L ${firstPoint?.x ?? 42} ${chartHeight - 28} Z`} fill="url(#diet-adherence-area)" /> : null}
                {linePath ? <path d={linePath} fill="none" filter="url(#diet-adherence-glow)" stroke="url(#diet-adherence-line)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" /> : null}
              </svg>
              {[0, 20, 40, 60, 80, 100].map((tick) => {
                const y = chartHeight - 28 - (tick / 100) * (chartHeight - 56);
                return (
                  <span
                    className="absolute left-0 -translate-y-1/2 text-[10px] font-semibold leading-none text-[#8fa3b5] sm:text-[11px]"
                    key={tick}
                    style={{ top: `${(y / chartHeight) * 100}%` }}
                  >
                    {tick}%
                  </span>
                );
              })}
              {highlightedPoint ? (
                <span
                  aria-hidden="true"
                  className="absolute w-px -translate-x-1/2 border-l border-dashed border-[#9bd7ff]/55"
                  style={{
                    bottom: `${((chartHeight - (chartHeight - 28)) / chartHeight) * 100}%`,
                    left: `${(highlightedPoint.x / chartWidth) * 100}%`,
                    top: `${((zoneTopY - 6) / chartHeight) * 100}%`,
                  }}
                />
              ) : null}
              {points.map((point, index) => (
                <button
                  aria-label={`${point.label}: ${point.percent}% de aderência, ${point.completedMeals} de ${point.totalMeals} refeições`}
                  className={cn(
                    "absolute z-[2] size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#78c8ff] bg-[#061726] shadow-[0_0_0_4px_rgba(72,175,255,0.12)] transition",
                    index === (activePointIndex ?? points.length - 1) && "size-[18px] bg-[#e6f7ff] shadow-[0_0_0_7px_rgba(72,175,255,0.18),0_0_18px_rgba(72,175,255,0.6)]",
                  )}
                  key={point.date}
                  style={{ left: `${(point.x / chartWidth) * 100}%`, top: `${(point.y / chartHeight) * 100}%` }}
                  type="button"
                  onFocus={() => setActivePointIndex(index)}
                  onPointerEnter={() => setActivePointIndex(index)}
                />
              ))}
              {activePoint ? (
                <div
                  className="pointer-events-none absolute z-10 min-w-[132px] rounded-[10px] border border-[#2d9cff]/70 bg-[#051726]/95 px-3 py-2 text-left shadow-[0_16px_34px_rgba(0,0,0,0.35)]"
                  style={{ left: `${tooltipLeft}%`, top: `${tooltipTop}%`, transform: "translate(-50%, -50%)" }}
                >
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#8fcfff]">{activePoint.label}</p>
                  <p className="mt-1 text-[22px] font-extrabold leading-none text-white">{activePoint.percent}%</p>
                  <p className="mt-1 text-[11px] font-semibold text-[#9fb1c0]">
                    {activePoint.completedMeals}/{activePoint.totalMeals} refeições
                  </p>
                </div>
              ) : null}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[#7f92a5] sm:grid-cols-7 md:grid-cols-14">
              {chartPoints.map((point) => (
                <span className="truncate" key={point.date}>{point.label.split(" ").at(-1)}</span>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-[14px] font-extrabold text-[#dce8f2]">Consistência de registros</p>
              <p className="text-[11px] font-bold text-[#8fa3b5]">Baixa <span className="mx-1 inline-flex gap-1 align-middle">{[0, 1, 2, 3].map((item) => <span className={cn("inline-block size-3 rounded-[3px]", item === 3 ? "bg-[#168bff]" : "bg-[#0e5a99]/70")} key={item} />)}</span> Alta</p>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1 md:grid-cols-14">
              {chartPoints.map((point) => (
                <span
                  aria-label={`${point.label}: ${point.percent}% de aderência`}
                  className={cn(
                    "h-5 rounded-[4px] border border-[#22475d]/50",
                    point.percent >= 80 ? "bg-[#168bff]" : point.percent >= 50 ? "bg-[#0e72c6]/85" : point.percent > 0 ? "bg-[#0e5a99]/60" : "bg-[#0a2234]",
                  )}
                  key={point.date}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 xl:grid-cols-1">
          <SummaryCard color="orange" icon={<Flame className="size-6" />} label="dias com registro" value={`${rangeAdherenceDays}`} />
          <SummaryCard color="cyan" icon={<Trophy className="size-6" />} label="aderência média" value={`${averageAdherence}%`} />
          <SummaryCard color="blue" icon={<ClipboardCheck className="size-6" />} label="refeições registradas" value={`${selectedRegisteredMeals} / ${selectedTotalMeals}`} />
        </div>
      </div>
    </Panel>
  );
}

function SummaryCard({ color, icon, label, value }: { color: "blue" | "cyan" | "orange"; icon: ReactNode; label: string; value: string }) {
  const colors = {
    blue: "bg-[#0d3154] text-[#65bdff]",
    cyan: "bg-[#103f45] text-[#6deaf3]",
    orange: "bg-[#422713] text-[#ffb05c]",
  }[color];
  return (
    <Panel className="flex min-w-0 flex-col items-center gap-2 p-3 text-center sm:flex-row sm:gap-4 sm:p-5 sm:text-left">
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full sm:size-14", colors)}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold leading-tight text-[#9fb1c0] sm:text-[13px]">{label}</p>
        <p className="mt-1 text-[17px] font-bold leading-tight text-white sm:text-[22px]">{value}</p>
      </div>
    </Panel>
  );
}

function ProfessionalGuidance() {
  const tips = [
    {
      icon: <Droplets className="size-8" />,
      text: "Aumente seu consumo de água ao longo do dia para otimizar seus resultados.",
      title: "Hidratação em dia",
      tone: "text-[#168bff]",
    },
    {
      icon: <Flame className="size-8" />,
      text: "Faça sua refeição 60 a 90 min antes do treino para mais energia e rendimento.",
      title: "Pré-treino inteligente",
      tone: "text-[#f0be23]",
    },
    {
      icon: <Target className="size-8" />,
      text: "Mantenha o foco também nos fins de semana. Pequenas escolhas, grandes resultados.",
      title: "Consistência no fim de semana",
      tone: "text-[#ff6d7b]",
    },
  ];

  return (
    <Panel className="p-4 sm:p-6">
      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)] xl:items-center">
        <div>
          <h2 className="text-[20px] font-extrabold text-white sm:text-[22px]">Orientações do profissional</h2>
          <div className="mt-5 flex items-center gap-4">
            <span className="grid size-[60px] shrink-0 place-items-center rounded-full bg-[#e0b08e] text-[18px] font-extrabold text-[#1d2a35]">LB</span>
            <p className="text-[13px] font-semibold leading-5 text-[#8fa3b5]">Fique atento às recomendações abaixo para potencializar seus resultados.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {tips.map((tip) => (
            <div className="grid grid-cols-[42px_minmax(0,1fr)] gap-4 rounded-[8px] border border-[#21475f]/65 bg-[#061d2e]/62 p-4" key={tip.title}>
              <span className={cn("grid size-10 place-items-center", tip.tone)}>{tip.icon}</span>
              <div className="min-w-0">
                <h3 className="text-[14px] font-extrabold text-[#45afff] sm:text-[16px]">{tip.title}</h3>
                <p className="mt-2 text-[12px] font-medium leading-5 text-[#8fa3b5]">{tip.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function MealModal({ diet, modal, onClose }: { diet: ClientDietData; modal: ModalState; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedItemId, setSelectedItemId] = useState(modal?.itemId ?? modal?.meal.items[0]?.id ?? "");

  useEffect(() => {
    setSelectedItemId(modal?.itemId ?? modal?.meal.items[0]?.id ?? "");
  }, [modal]);

  if (!modal) return null;
  const activeModal = modal;
  const selectedItem = activeModal.meal.items.find((item) => item.id === selectedItemId) ?? activeModal.meal.items[0] ?? null;

  function apply(foodId: string) {
    if (!selectedItem) return;
    const formData = new FormData();
    formData.set("mealId", activeModal.meal.id);
    formData.set("itemId", selectedItem.id);
    formData.set("foodId", foodId);
    formData.set("logDate", diet.selectedDate.iso);

    startTransition(async () => {
      const result = await applyClientDietMealSubstitution(formData);
      if (!result.ok) {
        window.alert(result.error ?? "Não foi possível aplicar a substituição.");
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 px-4 py-4 backdrop-blur-sm sm:grid sm:place-items-center sm:py-8">
      <div className="mx-auto w-full max-w-[560px] rounded-[14px] border border-[#263949] bg-[#0b1620] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-bold uppercase text-[#5bb8ff]">{activeModal.meal.title}</p>
            <h2 className="mt-1 text-[24px] font-bold text-white">Substituições do dia</h2>
            <p className="mt-1 text-[13px] text-[#9fb1c0]">A troca vale apenas para {diet.selectedDate.shortLabel} e não altera a prescrição original.</p>
          </div>
          <button aria-label="Fechar" className="flex size-9 items-center justify-center rounded-[8px] text-[#9fb1c0] hover:bg-white/5 hover:text-white" type="button" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-[13px] font-semibold text-[#c8d6e1]">
            Alimento que deseja trocar
            <select
              className="h-11 rounded-[9px] border border-[#263949] bg-[#09131c] px-3 text-white outline-none focus:border-[#2d9cff]"
              value={selectedItemId}
              onChange={(event) => setSelectedItemId(event.target.value)}
            >
              {activeModal.meal.items.map((item) => (
                <option key={item.id} value={item.id}>{item.originalName}</option>
              ))}
            </select>
          </label>

          <div className="grid gap-2">
            {selectedItem ? diet.suggestions
              .filter((item) => item.name !== selectedItem.originalName)
              .slice()
              .sort((a, b) => {
                const scoreA = Math.abs(a.kcal - selectedItem.kcal) + Math.abs(a.protein - selectedItem.protein) * 4 + Math.abs(a.carbs - selectedItem.carbs) + Math.abs(a.fat - selectedItem.fat) * 3;
                const scoreB = Math.abs(b.kcal - selectedItem.kcal) + Math.abs(b.protein - selectedItem.protein) * 4 + Math.abs(b.carbs - selectedItem.carbs) + Math.abs(b.fat - selectedItem.fat) * 3;
                return scoreA - scoreB;
              })
              .slice(0, 5)
              .map((item) => {
                const kcalDiff = item.kcal - selectedItem.kcal;
                return (
                  <div className="grid gap-3 rounded-[10px] border border-[#213444] bg-[#09131c] p-3 sm:grid-cols-[1fr_auto] sm:items-center" key={item.id}>
                    <div>
                      <p className="text-[14px] font-bold text-white">{item.name}</p>
                      <p className="mt-1 text-[12px] text-[#9fb1c0]">{item.label} · {item.macroLabel}</p>
                      <p className={cn("mt-2 text-[12px] font-semibold", Math.abs(kcalDiff) <= 40 ? "text-[#68e49a]" : "text-[#ffd45a]")}>
                        {kcalDiff === 0 ? "Mesmas calorias" : `${kcalDiff > 0 ? "+" : ""}${formatNumber(kcalDiff)} kcal vs. item atual`}
                      </p>
                    </div>
                    <button className="h-10 rounded-[8px] bg-[#1f8dff] px-4 text-[13px] font-bold text-white disabled:opacity-60" disabled={pending} type="button" onClick={() => apply(item.id)}>
                      Aplicar hoje
                    </button>
                  </div>
                );
              }) : null}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button className="h-10 rounded-[8px] border border-[#263949] px-4 text-[13px] font-bold text-[#c8d6e1]" type="button" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanIdentityCard({ diet }: { diet: ClientDietData }) {
  if (!diet.plan) return null;

  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[16px] font-semibold text-[#afc0cf] sm:text-[18px]">{diet.plan.title}</p>
        <span className="inline-flex h-7 items-center gap-2 rounded-full border border-[#1fa563]/70 bg-[#0c3b25]/80 px-3 text-[12px] font-extrabold text-[#5ddc8d]">
          <Check className="size-3.5" />
          {diet.plan.statusLabel}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <PlanFact icon={<Clock3 className="size-3.5" />} label="Atualizado em" value={diet.plan.updatedLabel} />
        <PlanFact icon={<CalendarDays className="size-3.5" />} label="Revisão" value={diet.plan.reviewLabel} />
        <PlanFact icon={<ClipboardCheck className="size-3.5" />} label="Versão" value={diet.plan.versionLabel} />
      </div>
    </section>
  );
}

function PlanFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <span className="inline-flex h-[42px] items-center gap-2 rounded-[10px] border border-[#1d4561]/90 bg-[#061e31]/72 px-3 text-[12px] font-extrabold text-[#afc1d1] sm:px-4 sm:text-[13px]">
      <span className="text-[#2b9dff]">{icon}</span>
      <span className="text-[#7f91a2]">{label}</span>
      <span>{value}</span>
    </span>
  );
}

function DateNavigator({ diet }: { diet: ClientDietData }) {
  const previousDate = shiftIsoDate(diet.selectedDate.iso, -1);
  const nextDate = shiftIsoDate(diet.selectedDate.iso, 1);
  const today = todayIsoDate();

  return (
    <nav aria-label="Navegação por data da dieta" className="grid grid-cols-2 gap-2 sm:grid-cols-[auto_minmax(190px,254px)_auto_auto] sm:items-center">
      <Link
        className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#263949] bg-[#0d1822] px-4 text-[13px] font-bold text-[#c8d6e1] transition hover:border-[#2d9cff]"
        href={`/cliente/dieta?date=${previousDate}`}
      >
        Ontem
      </Link>
      <div className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-[#168bff] bg-[#061e31]/72 px-4 text-center text-[13px] font-bold text-[#afc1d1] sm:col-span-1 sm:text-[14px]">
        <CalendarDays className="size-4 text-[#8fcfff]" />
        {diet.selectedDate.label}
      </div>
      <Link
        className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#263949] bg-[#0d1822] px-4 text-[13px] font-bold text-[#c8d6e1] transition hover:border-[#2d9cff]"
        href={`/cliente/dieta?date=${today}`}
      >
        Hoje
      </Link>
      <Link
        className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#263949] bg-[#0d1822] px-4 text-[13px] font-bold text-[#c8d6e1] transition hover:border-[#2d9cff]"
        href={`/cliente/dieta?date=${nextDate}`}
      >
        Amanhã
      </Link>
    </nav>
  );
}

export function ClientDietView({ diet }: ClientDietViewProps) {
  const [modal, setModal] = useState<ModalState>(null);
  const [focusedMealId, setFocusedMealId] = useState<string | null>(null);
  const [selectedMenuOption, setSelectedMenuOption] = useState(diet?.menuOptions[0]?.value ?? 1);

  useEffect(() => {
    setFocusedMealId(null);
  }, [diet?.selectedDate.iso, selectedMenuOption]);

  if (!diet?.plan) return <EmptyDiet />;
  const activeMeals = diet.meals.filter((meal) => meal.menuOption === selectedMenuOption);
  const defaultNextMeal = activeMeals.find((meal) => meal.isNext) ?? activeMeals.find((meal) => meal.status !== "completed") ?? activeMeals[0] ?? null;
  const focusedMeal = focusedMealId ? activeMeals.find((meal) => meal.id === focusedMealId) ?? null : null;
  const activeNextMeal = focusedMeal ?? defaultNextMeal;
  const isNextMealFocusLocked = Boolean(focusedMeal && defaultNextMeal && focusedMeal.id !== defaultNextMeal.id);

  return (
    <div className="min-h-[calc(100vh-81px)] bg-[#001624] text-[#f9fafb]">
      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-5 pb-14 pt-6 sm:px-8 lg:px-6">
        <ModuleSelector />

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-3">
            <h1 className="text-[36px] font-extrabold leading-tight text-white sm:text-[42px]">Minha Dieta</h1>
            <PlanIdentityCard diet={diet} />
          </div>
          <DateNavigator diet={diet} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(420px,0.88fr)]">
          <NextMealCard
            diet={diet}
            isFocusLocked={isNextMealFocusLocked}
            meal={activeNextMeal}
            nextMeal={defaultNextMeal}
            onMealFocus={setFocusedMealId}
            onModal={setModal}
            onReleaseFocus={() => setFocusedMealId(null)}
          />
          <ProgressCard diet={diet} meals={activeMeals} />
        </div>

        <MealTimeline meals={activeMeals} />

        <MealPlan
          diet={diet}
          meals={activeMeals}
          selectedMenuOption={selectedMenuOption}
          setSelectedMenuOption={setSelectedMenuOption}
          onModal={setModal}
        />
        <WeekEvolution diet={diet} />
        <ProfessionalGuidance />
      </main>
      <MealModal diet={diet} modal={modal} onClose={() => setModal(null)} />
    </div>
  );
}
