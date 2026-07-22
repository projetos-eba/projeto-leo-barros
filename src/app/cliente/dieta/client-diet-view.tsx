"use client";

import {
  Camera,
  Beef,
  Check,
  ChevronRight,
  Droplets,
  Dumbbell,
  Flame,
  HeartPulse,
  Minus,
  RefreshCw,
  Utensils,
  Wheat,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ChangeEvent, ReactNode } from "react";
import { useEffect, useRef, useState, useTransition } from "react";

import type { ClientDietData, ClientDietMeal } from "@/lib/clients/diet-metrics";
import { cn } from "@/lib/utils";

import {
  addClientDietWater,
  applyClientDietMealSubstitution,
  attachClientDietMealPhoto,
  markClientDietMeal,
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
        <h1 className="mt-5 text-[30px] font-bold">Painel de Dieta</h1>
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
    <div className="grid gap-4 lg:grid-cols-3">
      {moduleCards.map((module) => {
        const Icon = module.icon;
        const active = module.key === "dieta";
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative min-h-[138px] overflow-hidden rounded-[14px] border bg-[#101a25] p-5 transition duration-300 hover:-translate-y-0.5",
              active
                ? "border-[#1f8dff] shadow-[0_0_0_1px_rgba(31,141,255,0.35),0_18px_55px_rgba(31,141,255,0.2)]"
                : "border-[#2a3946] hover:border-[#4b6072]",
            )}
            href={module.href}
            key={module.key}
          >
            <img
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-55 transition duration-500 group-hover:scale-[1.04]"
              src={module.image}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07141d]/95 via-[#07141d]/65 to-[#07141d]/20" />
            <div className="relative flex h-full flex-col justify-between">
              <span className={cn("flex size-12 items-center justify-center rounded-[10px]", active ? "bg-[#0d57a6] text-[#8fcfff]" : "bg-white/10 text-[#c6d3df]")}>
                <Icon className="size-6" />
              </span>
              <div className="mt-7 flex items-center justify-between gap-4">
                <h2 className="text-[26px] font-bold text-white">{module.title}</h2>
                <ChevronRight className={cn("size-5 transition", active ? "text-[#8fcfff]" : "text-[#8ea0ae]")} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
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

function NextMealCard({ diet, meal, onModal }: { diet: ClientDietData; meal: ClientDietMeal | null; onModal: (state: ModalState) => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!meal || !diet.plan) return null;
  const activeMeal = meal;

  function refreshAfter(action: Promise<{ error?: string; ok: boolean }>) {
    startTransition(async () => {
      const result = await action;
      if (!result.ok) window.alert(result.error ?? "Não foi possível completar a ação.");
      router.refresh();
    });
  }

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file || !diet.plan) return;
    const formData = new FormData();
    formData.set("mealId", activeMeal.id);
    formData.set("planId", diet.plan.id);
    formData.set("logDate", diet.selectedDate.iso);
    formData.set("photo", file);
    refreshAfter(attachClientDietMealPhoto(formData));
    event.currentTarget.value = "";
  }

  return (
    <Panel className="relative overflow-hidden border-[#1f8dff]/70 p-6 shadow-[0_0_0_1px_rgba(31,141,255,0.2),0_24px_80px_rgba(31,141,255,0.16)]">
      <img alt="" className="absolute inset-y-0 right-0 hidden h-full w-[50%] object-cover opacity-80 lg:block" src={activeMeal.imageSrc} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_48%,rgba(31,141,255,0.34),transparent_24%),linear-gradient(90deg,#091722_0%,rgba(9,23,34,0.95)_48%,rgba(9,23,34,0.58)_100%)]" />
      <div className="relative z-10 max-w-[670px]">
        <span className="rounded-[8px] bg-[#0876d8] px-3 py-1 text-[11px] font-bold uppercase text-white">Agora</span>
        <p className="mt-6 text-[14px] font-medium text-[#c8d6e1]">Sua próxima refeição</p>
        <h2 className="mt-2 text-[36px] font-bold leading-tight text-white">
          {activeMeal.title} <span className="text-[22px] text-[#d9e8f5]">• {activeMeal.timeLabel}</span>
        </h2>
        <p className="mt-2 text-[14px] font-medium text-[#98aaba]">É a sua próxima ação de hoje.</p>

        <div className="mt-7 grid max-w-[430px] gap-2">
          {activeMeal.items.slice(0, 5).map((item) => (
            <div className="flex items-center justify-between gap-4 text-[13px]" key={item.id}>
              <span className="flex items-center gap-2 text-[#e8f2fa] before:size-2 before:rounded-full before:bg-[#1f8dff] before:content-['']">{item.name}</span>
              <span className="text-[#9fb1c0]">{item.amountLabel}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-4">
          <MacroBadge color="blue" icon={<Flame className="size-4" />} label="Calorias" value={activeMeal.totals.kcal} />
          <MacroBadge color="green" icon={<Beef className="size-4" />} label="Proteína" value={activeMeal.totals.protein} />
          <MacroBadge color="yellow" icon={<Wheat className="size-4" />} label="Carbo" value={activeMeal.totals.carbs} />
          <MacroBadge color="red" icon={<Droplets className="size-4" />} label="Gordura" value={activeMeal.totals.fat} />
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-[#1f8dff] px-4 text-[14px] font-bold text-white transition hover:bg-[#43a4ff] disabled:opacity-60"
            disabled={pending}
            type="button"
            onClick={() => refreshAfter(markClientDietMeal(activeMeal.id, diet.selectedDate.iso, activeMeal.status !== "completed"))}
          >
            <Check className="size-4" />
            {activeMeal.status === "completed" ? "Reabrir refeição" : "Registrar como realizada"}
          </button>
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-[#263949] bg-[#0d1822]/80 px-4 text-[14px] font-bold text-[#d8e8f4] transition hover:border-[#3b97e3]"
            type="button"
            onClick={() => onModal({ meal: activeMeal })}
          >
            <RefreshCw className="size-4" />
            Ver substituições
          </button>
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-[#263949] bg-[#0d1822]/80 px-4 text-[14px] font-bold text-[#d8e8f4] transition hover:border-[#3b97e3]"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="size-4" />
            Anexar foto
          </button>
          <input ref={fileInputRef} accept="image/jpeg,image/png,image/webp" className="hidden" type="file" onChange={handlePhoto} />
        </div>
      </div>
    </Panel>
  );
}

function ProgressCard({ diet }: { diet: ClientDietData }) {
  const { consumed, targets } = diet.progress;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const ringRadius = 68;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - diet.progress.kcalPercent / 100);

  function adjustWater(amountMl: number) {
    startTransition(async () => {
      const result = await addClientDietWater(diet.selectedDate.iso, amountMl);
      if (!result.ok) window.alert(result.error ?? "Não foi possível atualizar água.");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4">
      <Panel className="p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-[#12385a] text-[#5bb8ff]">
            <ChevronRight className="size-5 -rotate-45" />
          </span>
          <div>
            <h2 className="text-[20px] font-bold text-white">Seu progresso hoje</h2>
            <p className="text-[13px] font-semibold text-[#57d68a]">Você está no caminho certo!</p>
          </div>
        </div>
        <div className="mt-7 grid items-center gap-7 sm:grid-cols-[170px_1fr]">
          <div className="relative grid aspect-square place-items-center">
            <svg aria-label={`${diet.progress.kcalPercent}% da meta calórica`} className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 170 170">
              <circle cx="85" cy="85" fill="none" r={ringRadius} stroke="#223441" strokeWidth="20" />
              <circle
                cx="85"
                cy="85"
                fill="none"
                r={ringRadius}
                stroke="#68e6cf"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                strokeWidth="20"
              />
            </svg>
            <div className="relative grid size-[128px] place-items-center rounded-full bg-[radial-gradient(circle_at_35%_25%,#1e445f_0%,#111d28_62%,#09131c_100%)] text-center shadow-[inset_0_0_28px_rgba(31,141,255,0.16)]">
              <div>
                <p className="text-[34px] font-bold leading-none text-white">{formatNumber(consumed.kcal)}</p>
                <p className="mt-1 text-[12px] font-semibold text-[#9fb1c0]">/ {formatNumber(targets.kcal)} kcal</p>
                <p className="text-[11px] text-[#7f91a1]">consumidas</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#c6d3df]">Faltam</p>
            <p className="mt-1 text-[30px] font-bold text-white">{formatNumber(diet.progress.remainingKcal)} kcal</p>
            <p className="mt-1 text-[13px] text-[#9fb1c0]">para sua meta diária.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <MacroProgress color="green" label="Proteína" target={targets.protein} value={consumed.protein} />
          <MacroProgress color="yellow" label="Carbo" target={targets.carbs} value={consumed.carbs} />
          <MacroProgress color="red" label="Gordura" target={targets.fat} value={consumed.fat} />
        </div>
      </Panel>

      <Panel className="p-6">
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
    <Panel className="p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[24px] font-bold text-white">Plano do dia</h2>
          <p className="mt-1 text-[13px] text-[#9fb1c0]">Acompanhe e registre cada refeição.</p>
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

      <div className="mt-6 grid gap-4">
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  function run(action: Promise<{ error?: string; ok: boolean }>) {
    startTransition(async () => {
      const result = await action;
      if (!result.ok) window.alert(result.error ?? "Não foi possível completar a ação.");
      router.refresh();
    });
  }

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file || !diet.plan) return;
    const formData = new FormData();
    formData.set("mealId", meal.id);
    formData.set("planId", diet.plan.id);
    formData.set("logDate", diet.selectedDate.iso);
    formData.set("photo", file);
    run(attachClientDietMealPhoto(formData));
    event.currentTarget.value = "";
  }

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[14px] border bg-[#0a1620]/80 transition",
        meal.isNext ? "border-[#1f8dff] shadow-[0_0_0_1px_rgba(31,141,255,0.22),0_12px_40px_rgba(31,141,255,0.14)]" : "border-[#213444]",
      )}
    >
      <div className="grid gap-3 border-b border-[#213444] bg-[#081522] px-4 py-4 lg:grid-cols-[minmax(0,1fr)_repeat(5,auto)] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[24px] font-bold text-white">{meal.title}</h3>
            <span className="text-[14px] text-[#9fb1c0]">• {meal.timeLabel}</span>
            <span className="rounded-[7px] border border-[#263949] px-2 py-1 text-[11px] font-bold text-[#9fb1c0]">{meal.optionLabel}</span>
          </div>
          <span className={cn(
            "mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-bold",
            meal.status === "completed" ? "bg-[#123d2a] text-[#7df0a8]" : meal.isNext ? "bg-[#12385a] text-[#8fcfff]" : "bg-[#3d2f12] text-[#ffd45a]",
          )}>
            {meal.statusLabel}
          </span>
        </div>
        <span className="text-[18px] font-bold text-[#c7d3df]">{formatNumber(meal.totals.kcal)} kcal</span>
        <span className="text-[20px] font-bold text-[#68e49a]">{formatNumber(meal.totals.protein, 1)} g</span>
        <span className="text-[20px] font-bold text-[#ffd45a]">{formatNumber(meal.totals.carbs, 1)} g</span>
        <span className="text-[20px] font-bold text-[#ff8585]">{formatNumber(meal.totals.fat, 1)} g</span>
        <span className="text-[20px] font-bold text-[#6fc0ff]">{formatNumber(meal.totals.fiber, 1)} g</span>
      </div>

      <div className="grid gap-3 p-4">
        <div className="hidden grid-cols-[minmax(0,1.35fr)_110px_repeat(4,74px)] gap-4 border-b border-[#213444] pb-3 text-[11px] font-bold uppercase text-[#7f91a1] md:grid">
          <span>Alimento</span>
          <span>Porção</span>
          <span className="text-[#68e49a]">Prot</span>
          <span className="text-[#ffd45a]">Carb</span>
          <span className="text-[#ff8585]">Gord</span>
          <span className="text-[#6fc0ff]">Fibr</span>
        </div>
        {meal.items.map((item) => (
          <div className="grid gap-2 rounded-[9px] px-1 py-2 text-[14px] text-[#c8d6e1] md:grid-cols-[minmax(0,1.35fr)_110px_repeat(4,74px)] md:items-center md:gap-4" key={item.id}>
            <div className="min-w-0">
              <p className="truncate text-[16px] font-semibold text-white">{item.name}</p>
              {item.replacementLabel ? <p className="mt-1 text-[11px] font-semibold text-[#8fcfff]">{item.replacementLabel}</p> : null}
            </div>
            <span className="text-[#9fb1c0]">{item.amountLabel}</span>
            <span className="font-bold text-[#68e49a]">{formatNumber(item.protein, 1)} g</span>
            <span className="font-bold text-[#ffd45a]">{formatNumber(item.carbs, 1)} g</span>
            <span className="font-bold text-[#ff8585]">{formatNumber(item.fat, 1)} g</span>
            <span className="font-bold text-[#6fc0ff]">{formatNumber(item.fiber, 1)} g</span>
          </div>
        ))}
        {meal.photoLabel ? <p className="text-[12px] text-[#8fcfff]">Foto: {meal.photoLabel}</p> : null}
      </div>

      <div className="grid gap-3 border-t border-[#213444] p-4 sm:grid-cols-[1fr_auto_auto]">
        <button
          className={cn(
            "inline-flex h-12 items-center justify-center gap-2 rounded-[9px] px-4 text-[14px] font-bold transition disabled:opacity-60",
            meal.status === "completed" ? "bg-[#123d2a] text-[#9df3b8]" : "bg-[#1f8dff] text-white hover:bg-[#43a4ff]",
          )}
          disabled={pending}
          type="button"
          onClick={() => run(markClientDietMeal(meal.id, diet.selectedDate.iso, meal.status !== "completed"))}
        >
          <Check className="size-4" />
          {meal.status === "completed" ? `Registrada${meal.completedAtLabel ? ` às ${meal.completedAtLabel}` : ""}` : "Marcar como realizada"}
        </button>
        <button className="inline-flex h-12 items-center justify-center gap-2 rounded-[9px] border border-[#263949] px-4 text-[13px] font-bold text-[#c8d6e1] transition hover:border-[#3b97e3]" type="button" onClick={() => onModal({ meal })}>
          <RefreshCw className="size-4" />
          Ver substituições
        </button>
        <button className="inline-flex h-12 items-center justify-center gap-2 rounded-[9px] border border-[#263949] px-4 text-[13px] font-bold text-[#c8d6e1] transition hover:border-[#3b97e3]" type="button" onClick={() => fileInputRef.current?.click()}>
          <Camera className="size-4" />
          Anexar foto
        </button>
        <input ref={fileInputRef} accept="image/jpeg,image/png,image/webp" className="hidden" type="file" onChange={handlePhoto} />
      </div>
    </article>
  );
}

function WeekEvolution({ diet }: { diet: ClientDietData }) {
  const chartWidth = 700;
  const chartHeight = 170;
  const points = diet.week.points.map((point, index) => {
    const x = diet.week.points.length <= 1 ? chartWidth / 2 : 28 + (index * (chartWidth - 56)) / (diet.week.points.length - 1);
    const y = chartHeight - Math.max(10, (point.percent / 100) * (chartHeight - 24));
    return { ...point, x, y };
  });
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_310px]">
      <Panel className="p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-[22px] font-bold text-white">Evolução da semana</h2>
          <p className="text-[12px] font-semibold text-[#9fb1c0]">Sua consistência constrói seus resultados.</p>
        </div>
        <div className="mt-5 rounded-[12px] border border-[#213444] bg-[#09131c] p-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[15px] font-bold text-white">Ingestão calórica <span className="text-[12px] text-[#8ea0ae]">(kcal)</span></p>
            <p className="text-[12px] text-[#9fb1c0]">Meta diária: {formatNumber(diet.progress.targets.kcal)} kcal</p>
          </div>
          <div className="relative mt-7 overflow-hidden rounded-[10px] bg-[#0b1721] px-3 pb-3 pt-4">
            <svg className="pointer-events-none absolute inset-x-3 top-4 h-[170px] w-[calc(100%-1.5rem)] overflow-visible" preserveAspectRatio="none" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
              <path d={linePath} fill="none" stroke="#7ec8ff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
              {points.map((point) => (
                <circle cx={point.x} cy={point.y} fill="#07141d" key={point.date} r="5" stroke="#2d9cff" strokeWidth="3" />
              ))}
            </svg>
            <div className="flex h-[205px] items-end gap-3 border-b border-[#223646]">
              {diet.week.points.map((point) => (
                <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={point.date}>
                  <div className="flex h-[156px] w-full items-end justify-center rounded-t-[8px] bg-[#0f1d29]">
                  <div
                    aria-label={`${point.label}: ${formatNumber(point.kcal)} kcal`}
                    className="w-full max-w-[44px] rounded-t-[8px] bg-[linear-gradient(180deg,#2d9cff_0%,rgba(45,156,255,0.15)_100%)] shadow-[0_0_24px_rgba(45,156,255,0.25)]"
                    style={{ height: `${Math.max(8, point.percent)}%` }}
                  />
                  </div>
                  <span className="truncate text-center text-[10px] font-semibold text-[#8ea0ae]">{point.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4">
        <SummaryCard color="blue" icon={<Check className="size-6" />} label="Dias seguindo o plano" value={`${diet.week.adherenceDays} de 7 dias`} />
        <SummaryCard color="orange" icon={<Flame className="size-6" />} label="Meta calórica média" value={`${formatNumber(diet.week.averageKcal)} kcal`} />
        <SummaryCard color="cyan" icon={<Utensils className="size-6" />} label="Refeições registradas" value={`${diet.week.registeredMeals} de ${diet.week.totalMeals}`} />
      </div>
    </div>
  );
}

function SummaryCard({ color, icon, label, value }: { color: "blue" | "cyan" | "orange"; icon: ReactNode; label: string; value: string }) {
  const colors = {
    blue: "bg-[#0d3154] text-[#65bdff]",
    cyan: "bg-[#103f45] text-[#6deaf3]",
    orange: "bg-[#422713] text-[#ffb05c]",
  }[color];
  return (
    <Panel className="flex items-center gap-4 p-5">
      <span className={cn("flex size-14 shrink-0 items-center justify-center rounded-full", colors)}>{icon}</span>
      <div>
        <p className="text-[13px] font-medium text-[#9fb1c0]">{label}</p>
        <p className="mt-1 text-[22px] font-bold text-white">{value}</p>
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[560px] rounded-[14px] border border-[#263949] bg-[#0b1620] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
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

export function ClientDietView({ diet }: ClientDietViewProps) {
  const [modal, setModal] = useState<ModalState>(null);
  const [selectedMenuOption, setSelectedMenuOption] = useState(diet?.menuOptions[0]?.value ?? 1);

  if (!diet?.plan) return <EmptyDiet />;
  const activeMeals = diet.meals.filter((meal) => meal.menuOption === selectedMenuOption);
  const activeNextMeal = activeMeals.find((meal) => meal.isNext) ?? activeMeals.find((meal) => meal.status !== "completed") ?? activeMeals[0] ?? null;

  return (
    <div className="min-h-[calc(100vh-81px)] bg-[#07141d] text-[#f9fafb]">
      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-5 pb-14 pt-8 sm:px-8 lg:px-12">
        <ModuleSelector />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[34px] font-bold leading-tight text-white sm:text-[42px]">Painel de Dieta</h1>
            <p className="mt-2 flex items-center gap-2 text-[14px] font-medium text-[#9fb1c0]">
              <span className="size-2 rounded-full bg-[#1f8dff]" />
              Seu guia diário para resultados reais.
            </p>
          </div>
          <div className="inline-flex h-12 items-center gap-3 rounded-[10px] border border-[#263949] bg-[#0d1822] px-4 text-[14px] font-semibold text-[#c8d6e1]">
            {diet.selectedDate.label}
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(420px,0.88fr)]">
          <NextMealCard diet={diet} meal={activeNextMeal} onModal={setModal} />
          <ProgressCard diet={diet} />
        </div>

        <MealPlan
          diet={diet}
          meals={activeMeals}
          selectedMenuOption={selectedMenuOption}
          setSelectedMenuOption={setSelectedMenuOption}
          onModal={setModal}
        />
        <WeekEvolution diet={diet} />
      </main>
      <MealModal diet={diet} modal={modal} onClose={() => setModal(null)} />
    </div>
  );
}
