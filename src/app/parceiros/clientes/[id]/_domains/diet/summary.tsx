"use client";

import { Beef, Droplets, Flame, Leaf, Settings, Wheat } from "lucide-react";
import { type ReactNode, useMemo } from "react";

import {
  buildDietSummary,
  ENERGY_BALANCE_GAUGE_LIMIT_PERCENT,
  macroEnergyPercent,
  macroGramsPerKg,
} from "@/lib/partners/client-diet-summary";
import type { PartnerClientDietMeal } from "@/lib/partners/client-profile/diet";
import { cn } from "@/lib/utils";

type DietSummaryProps = {
  fiberTargetMaxG: number | null;
  fiberTargetMinG: number | null;
  getKcal: number | null;
  meals: PartnerClientDietMeal[];
  onConfigure: () => void;
  waterLiters: number;
  weightKg: number | null;
};

const mealSegmentColors = ["bg-[#2d9cff]", "bg-[#3b97e3]", "bg-[#287fc4]", "bg-[#55b4ff]", "bg-[#1d669c]", "bg-[#68afe9]"];

function formatNumber(value: number, maximumFractionDigits = 0) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits });
}

function formatKcal(value: number | null) {
  return value === null ? "Indisponível" : `${formatNumber(value)} kcal`;
}

function formatSignedKcal(value: number | null) {
  if (value === null) return "Indisponível";
  return `${value > 0 ? "+" : ""}${formatNumber(value)} kcal/dia`;
}

function SummaryPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("min-w-0 rounded-[14px] border border-[rgba(65,80,92,0.71)] bg-[linear-gradient(153deg,rgba(42,63,79,0.35)_8%,rgba(96,144,181,0)_79%)] shadow-[0_2px_4px_rgba(0,0,0,0.07)]", className)}>{children}</section>;
}

function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-white">{children}</h2>;
}

function EnergyBalanceGauge({ idealEndPercent, idealStartPercent, vetMarkerPercent }: { idealEndPercent: number; idealStartPercent: number; vetMarkerPercent: number | null }) {
  return (
    <div className="mt-5">
      <div className="relative h-3 overflow-hidden rounded-full bg-[#07131d]" aria-label="Escala de balanço energético">
        <span className="absolute inset-y-0 bg-[#0e2c1e]" style={{ left: `${idealStartPercent}%`, right: `${100 - idealEndPercent}%` }} />
        <span className="absolute inset-y-0 left-1/2 w-px bg-[#d8e5ee]/70" aria-label="GET estimado" />
        {vetMarkerPercent === null ? null : <span className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#d8e5ee] bg-[#2d9cff] shadow-[0_0_0_3px_rgba(45,156,255,0.18)]" aria-label="VET prescrito" style={{ left: `${vetMarkerPercent}%` }} />}
      </div>
      <div className="mt-2 grid grid-cols-5 text-[10px] font-semibold text-[#718394]">
        {[-ENERGY_BALANCE_GAUGE_LIMIT_PERCENT, -15, 0, 15, ENERGY_BALANCE_GAUGE_LIMIT_PERCENT].map((value, index) => <span className={cn(index === 0 ? "text-left" : index === 4 ? "text-right" : "text-center", value === 0 && "text-[#c7d3df]")} key={value}>{value > 0 ? "+" : ""}{value}%</span>)}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#8b92a3]">
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full border border-[#d8e5ee]" /> GET estimado</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#2d9cff]" /> VET prescrito</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#0e2c1e]" /> Faixa ideal ±5%</span>
      </div>
    </div>
  );
}

function EnergyCard({ accent, label, value, detail }: { accent: string; detail: string; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[12px] border border-[#273847] bg-[#081722]/70 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#8b92a3]">{label}</p>
      <p className={cn("mt-3 truncate text-[22px] font-bold leading-none sm:text-[26px]", accent)}>{value}</p>
      <p className="mt-2 text-[12px] text-[#7f91a1]">{detail}</p>
    </div>
  );
}

function EnergyBalance({ data }: { data: ReturnType<typeof buildDietSummary> }) {
  const balanceDetail = data.balance.percent === null ? "Registre e aplique uma avaliação" : `${data.balance.label} · ${data.balance.percent > 0 ? "+" : ""}${formatNumber(data.balance.percent, 1)}% do GET`;
  const balanceAccent = data.balance.label === "Déficit" ? "text-[#8fcfff]" : data.balance.label === "Superávit" ? "text-[#f2c84b]" : data.balance.label === "Equilíbrio" ? "text-[#62d98b]" : "text-[#8b92a3]";
  return (
    <SummaryPanel className="p-4 sm:p-5">
      <SectionHeading>Balanço energético</SectionHeading>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <EnergyCard accent="text-white" detail={data.getKcal === null ? "Sem cálculo aplicado" : "Referência diária"} label="GET estimado" value={formatKcal(data.getKcal)} />
        <EnergyCard accent="text-[#8fcfff]" detail={data.hasFoods ? "Total do cardápio selecionado" : "Adicione alimentos ao cardápio"} label="VET prescrito" value={formatKcal(data.totals.kcal)} />
        <EnergyCard accent={balanceAccent} detail={balanceDetail} label="Balanço energético" value={formatSignedKcal(data.balance.kcal)} />
      </div>
      <EnergyBalanceGauge {...data.gauge} />
    </SummaryPanel>
  );
}

type MacroCardProps = {
  accentClass: string;
  detail: string;
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  progressClass: string;
  value: string;
};

function MacroCard({ accentClass, detail, icon, iconClass, label, progressClass, value }: MacroCardProps) {
  return (
    <div className="min-w-0 rounded-[12px] border border-[#273847] bg-[#081722]/70 p-4">
      <div className="flex items-center gap-2">
        <span className={cn("inline-flex size-8 items-center justify-center rounded-[8px]", iconClass)}>{icon}</span>
        <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#9aa5b6]">{label}</p>
      </div>
      <p className={cn("mt-4 text-[21px] font-bold leading-none", accentClass)}>{value}</p>
      <p className="mt-2 min-h-4 text-[12px] text-[#8b92a3]">{detail}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#07131d]"><span className={cn("block h-full rounded-full", progressClass)} style={{ width: "100%" }} /></div>
    </div>
  );
}

function MacroSummary({ data }: { data: ReturnType<typeof buildDietSummary> }) {
  const vetKcal = data.totals.kcal;
  const macroDetail = (grams: number, kcalPerGram: 4 | 9) => {
    const perKg = macroGramsPerKg(grams, data.weightKg);
    const percent = macroEnergyPercent(grams, kcalPerGram, vetKcal);
    if (!data.hasFoods) return "Cardápio sem alimentos";
    if (perKg === null) return percent === null ? "Peso e VET indisponíveis" : `Peso não registrado · ${formatNumber(percent, 1)}%`;
    return percent === null ? `${formatNumber(perKg, 1)} g/kg · VET indisponível` : `${formatNumber(perKg, 1)} g/kg · ${formatNumber(percent, 1)}%`;
  };
  const fiberDetail = data.fiberGoal.minG === null || data.fiberGoal.maxG === null
    ? "Meta não definida"
    : `Meta ${formatNumber(data.fiberGoal.minG, 1)}–${formatNumber(data.fiberGoal.maxG, 1)} g`;

  return (
    <SummaryPanel className="p-4 sm:p-5">
      <SectionHeading>Macronutrientes</SectionHeading>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MacroCard accentClass="text-[#62d98b]" detail={macroDetail(data.totals.protein, 4)} icon={<Beef className="size-4" />} iconClass="bg-[#0e2c1e] text-[#62d98b]" label="Proteína" progressClass="bg-[#45c777]" value={`${formatNumber(data.totals.protein, 1)} g`} />
        <MacroCard accentClass="text-[#f2c84b]" detail={macroDetail(data.totals.carbs, 4)} icon={<Wheat className="size-4" />} iconClass="bg-[#302813] text-[#f2c84b]" label="Carboidrato" progressClass="bg-[#f2c84b]" value={`${formatNumber(data.totals.carbs, 1)} g`} />
        <MacroCard accentClass="text-[#f27882]" detail={macroDetail(data.totals.fat, 9)} icon={<Flame className="size-4" />} iconClass="bg-[#32171b] text-[#f27882]" label="Gordura" progressClass="bg-[#f0616d]" value={`${formatNumber(data.totals.fat, 1)} g`} />
        <MacroCard accentClass="text-[#c7d3df]" detail={fiberDetail} icon={<Leaf className="size-4" />} iconClass="bg-[#1a242d] text-[#c7d3df]" label="Fibra" progressClass="bg-[#8193a3]" value={`${formatNumber(data.totals.fiber, 1)} g`} />
      </div>
    </SummaryPanel>
  );
}

function MealCalorieDistribution({ data }: { data: ReturnType<typeof buildDietSummary> }) {
  return (
    <SummaryPanel className="p-4 sm:p-5">
      <SectionHeading>Distribuição calórica por refeição</SectionHeading>
      {data.meals.length === 0 ? <p className="mt-4 text-[13px] text-[#8b92a3]">Nenhuma refeição cadastrada neste cardápio.</p> : data.totals.kcal <= 0 ? <p className="mt-4 text-[13px] text-[#8b92a3]">As refeições ainda não possuem calorias calculadas.</p> : <>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-[#07131d]">
          {data.meals.map((meal, index) => <span className={cn("h-full min-w-0 border-r border-[#07131d] last:border-r-0", mealSegmentColors[index % mealSegmentColors.length])} key={meal.id} style={{ width: `${meal.percent ?? 0}%` }} title={`${meal.title}: ${formatNumber(meal.percent ?? 0, 1)}%`} />)}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {data.meals.map((meal, index) => <div className="flex min-w-0 items-center gap-2 text-[12px]" key={meal.id}><span className={cn("size-2 shrink-0 rounded-full", mealSegmentColors[index % mealSegmentColors.length])} /><span className="min-w-0 truncate font-semibold text-[#d8e5ee]">{meal.title}</span><span className="ml-auto shrink-0 text-[#8b92a3]">{formatNumber(meal.kcal)} kcal · {formatNumber(meal.percent ?? 0, 1)}%</span></div>)}
        </div>
      </>}
    </SummaryPanel>
  );
}

export function DietSummary({ fiberTargetMaxG, fiberTargetMinG, getKcal, meals, onConfigure, waterLiters, weightKg }: DietSummaryProps) {
  const data = useMemo(() => buildDietSummary({ fiberTargetMaxG, fiberTargetMinG, getKcal, meals, weightKg }), [fiberTargetMaxG, fiberTargetMinG, getKcal, meals, weightKg]);
  const getKcalValue = getKcal !== null && Number.isFinite(getKcal) && getKcal > 0 ? getKcal : null;

  return (
    <div className="mt-5 grid gap-4">
      <div className="flex flex-wrap items-center justify-end gap-2 text-[12px] text-[#8b92a3]">
        <span className="inline-flex items-center gap-1.5"><Droplets className="size-3.5 text-[#8fcfff]" /> Água: {formatNumber(waterLiters, 1)} L</span>
        <button aria-label="Configurar objetivo calórico" className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[#303746] px-2 text-[#8fcfff] transition hover:border-[#3b97e3] hover:text-white" type="button" onClick={onConfigure}><Settings className="size-3.5" /> Configurar metas</button>
      </div>
      <EnergyBalance data={{ ...data, balance: getKcalValue === null ? { ...data.balance, kcal: null, label: "Indisponível", percent: null } : data.balance, getKcal: getKcalValue }} />
      <MacroSummary data={data} />
      <MealCalorieDistribution data={data} />
    </div>
  );
}
