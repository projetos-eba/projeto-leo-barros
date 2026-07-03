"use client";

import {
  Activity,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Droplets,
  Ellipsis,
  Flame,
  History,
  Lock,
  Plus,
  Save,
  Search,
  Send,
  Settings,
  Trash2,
  Utensils,
  Wheat,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PartnerClientDietData, PartnerClientDietFood, PartnerClientDietMeal } from "@/lib/partners/client-diet-metrics";
import { dietDayLabels, macroDistribution, type DietFoodTab } from "@/lib/partners/client-diet-metrics";
import type { PartnerClientOverviewData } from "@/lib/partners/client-overview-metrics";
import { cn } from "@/lib/utils";

import {
  addClientDietMealItem,
  createClientDietMeal,
  createClientDietPlan,
  duplicateClientDietPlan,
  publishClientDietPlan,
  removeClientDietMeal,
  removeClientDietMealItem,
  saveClientDietNotes,
  sendClientDietPlan,
  updateClientDietMealItem,
  updateClientDietPlanTargets,
} from "./actions";
import { PartnerClientProfileHeader } from "./partner-client-profile-header";

type PartnerClientDietViewProps = {
  diet: PartnerClientDietData;
  overview: PartnerClientOverviewData;
};

type NewPlanForm = {
  calorieStrategy: "deficit" | "maintenance" | "surplus";
  targetCarbsG: number;
  targetFatG: number;
  targetKcal: number;
  targetProteinG: number;
  title: string;
  waterLiters: number;
};

type NewMealForm = {
  mealTime: string;
  title: string;
};

const futureTabs = ["Anamnese", "Prescrições", "Formulários"];
const foodTabs: Array<{ id: DietFoodTab; label: string }> = [
  { id: "suggestions", label: "Sugestões" },
  { id: "favorites", label: "Favoritos" },
  { id: "recent", label: "Recentes" },
];

const emptyPlanForm: NewPlanForm = {
  calorieStrategy: "surplus",
  targetCarbsG: 240,
  targetFatG: 70,
  targetKcal: 2450,
  targetProteinG: 190,
  title: "Dieta de definição",
  waterLiters: 3,
};

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-[14px] border border-[rgba(65,80,92,0.71)] bg-[linear-gradient(153deg,rgba(42,63,79,0.35)_8%,rgba(96,144,181,0)_79%)] shadow-[0_2px_4px_rgba(0,0,0,0.07)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8b92a3]">
      {label}
      {children}
    </label>
  );
}

function inputClass(className?: string) {
  return cn("h-10 w-full rounded-[8px] border border-[#303746] bg-[#0d1822] px-3 text-[13px] text-white outline-none placeholder:text-[#627284] focus:border-[#3b97e3]", className);
}

function PrimaryButton({ children, className, disabled, onClick, type = "button" }: { children: ReactNode; className?: string; disabled?: boolean; onClick?: () => void; type?: "button" | "submit" }) {
  return (
    <button
      className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[#2d9cff] px-4 text-[13px] font-semibold text-white transition hover:bg-[#4aaaff] disabled:cursor-not-allowed disabled:opacity-55", className)}
      disabled={disabled}
      type={type}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, className, disabled, onClick, type = "button" }: { children: ReactNode; className?: string; disabled?: boolean; onClick?: () => void; type?: "button" | "submit" }) {
  return (
    <button
      className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-[#303746] bg-[#101923]/70 px-4 text-[13px] font-semibold text-[#d8e5ee] transition hover:border-[#3b97e3] hover:text-white disabled:cursor-not-allowed disabled:opacity-55", className)}
      disabled={disabled}
      type={type}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function IconButton({ label, children, onClick, disabled }: { children: ReactNode; disabled?: boolean; label: string; onClick?: () => void }) {
  return (
    <button
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-[8px] border border-[#303746] bg-[#101923]/70 text-[#b8c7d4] transition hover:border-[#3b97e3] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function formatNumber(value: number, maximumFractionDigits = 0) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits });
}

function macroText(value: number) {
  return `${formatNumber(value, 1)} g`;
}

function ModulePill({ scope }: { scope: string }) {
  const label = scope === "dieta" ? "Dieta" : scope === "treino" ? "Treino" : "Saúde";
  return (
    <span className="inline-flex h-[42px] items-center gap-2 rounded-[10px] border border-[#2f82bf]/45 bg-[rgba(10,44,72,0.35)] px-3 text-[12px] font-semibold text-[#c5e7ff]">
      <Utensils className="size-3.5" /> {label}
    </span>
  );
}

function HeaderTabs({ clientId }: { clientId: string }) {
  return (
    <div className="mt-7 flex min-w-0 gap-2 overflow-x-auto border-b border-[#303746]">
      <Link className="relative inline-flex h-[48px] shrink-0 items-center rounded-t-[10px] px-4 text-[14px] font-semibold text-[#8fcfff] transition hover:bg-[#101923]/45" href={`/parceiros/clientes/${clientId}`}>Visão Geral</Link>
      <Link className="relative inline-flex h-[48px] shrink-0 items-center rounded-t-[10px] px-4 text-[14px] font-semibold text-[#8fcfff] transition hover:bg-[#101923]/45" href={`/parceiros/clientes/${clientId}?tab=avaliacoes`}>Avaliações</Link>
      <Link className="relative inline-flex h-[48px] shrink-0 items-center rounded-t-[10px] bg-[#101923]/70 px-4 text-[14px] font-semibold text-white after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:bg-[#3b97e3]" href={`/parceiros/clientes/${clientId}?tab=dietas`}>Dietas</Link>
      <Link className="relative inline-flex h-[48px] shrink-0 items-center rounded-t-[10px] px-4 text-[14px] font-semibold text-[#8fcfff] transition hover:bg-[#101923]/45" href={`/parceiros/clientes/${clientId}?tab=treinos`}>Treinos</Link>
      <Link className="relative inline-flex h-[48px] shrink-0 items-center rounded-t-[10px] px-4 text-[14px] font-semibold text-[#8fcfff] transition hover:bg-[#101923]/45" href={`/parceiros/clientes/${clientId}?tab=cardio`}>Cardio</Link>
      <Link className="relative inline-flex h-[48px] shrink-0 items-center rounded-t-[10px] px-4 text-[14px] font-semibold text-[#8fcfff] transition hover:bg-[#101923]/45" href={`/parceiros/clientes/${clientId}?tab=exames`}>Exames</Link>
      <Link className="relative inline-flex h-[48px] shrink-0 items-center rounded-t-[10px] px-4 text-[14px] font-semibold text-[#8fcfff] transition hover:bg-[#101923]/45" href={`/parceiros/clientes/${clientId}?tab=fotos`}>Fotos</Link>
      {futureTabs.map((tab) => (
        <button className="inline-flex h-[48px] shrink-0 cursor-not-allowed items-center gap-2 rounded-t-[10px] px-4 text-[14px] font-semibold text-[#6f7c89]" disabled key={tab} type="button">
          <Lock className="size-3.5" /> {tab}
        </button>
      ))}
    </div>
  );
}

function SummaryStrip({ onConfigure, plan }: { onConfigure: () => void; plan: NonNullable<PartnerClientDietData["plan"]> }) {
  const totals = plan.weekDays[0]?.totals ?? plan.weekTotals;
  const distribution = macroDistribution(totals);
  const targetDelta = plan.targetKcal > 0 ? totals.kcal - plan.targetKcal : 0;

  return (
    <Panel className="mt-5 overflow-hidden p-0">
      <div className="grid gap-0 divide-y divide-[#273847] lg:grid-cols-[1.5fr_1fr_0.58fr_0.95fr] lg:divide-x lg:divide-y-0">
        <div className="grid gap-4 p-5 sm:grid-cols-[1fr_repeat(3,auto)] sm:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#8b92a3]">Resumo geral</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-[32px] font-bold leading-none text-white">{formatNumber(totals.kcal)}</p>
              <span className="text-[13px] text-[#9aa5b6]">kcal</span>
            </div>
            <p className="mt-1 text-[12px] text-[#6f8090]">Calorias do dia selecionado</p>
          </div>
          <MacroMetric color="green" icon={<Utensils className="size-4" />} label="Proteínas" value={totals.protein} />
          <MacroMetric color="yellow" icon={<Wheat className="size-4" />} label="Carboidratos" value={totals.carbs} />
          <MacroMetric color="red" icon={<Flame className="size-4" />} label="Gorduras" value={totals.fat} />
        </div>
        <div className="p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#8b92a3]">Distribuição de macronutrientes</p>
          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-[#07131d]">
            <span className="bg-[#45c777]" style={{ width: `${distribution.proteinPct}%` }} />
            <span className="bg-[#f2c84b]" style={{ width: `${distribution.carbsPct}%` }} />
            <span className="bg-[#f0616d]" style={{ width: `${distribution.fatPct}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-[#9aa5b6]">
            <span className="text-[#62d98b]">{distribution.proteinPct}% PTN</span>
            <span className="text-[#f2c84b]">{distribution.carbsPct}% CARB</span>
            <span className="text-[#f27882]">{distribution.fatPct}% GORD</span>
          </div>
        </div>
        <div className="p-5">
          <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.06em] text-[#8fcfff]"><Droplets className="size-4" /> Água</p>
          <p className="mt-2 text-[24px] font-bold text-white">{formatNumber(plan.waterLiters, 1)} L</p>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#8b92a3]">Objetivo calórico</p>
              <p className="mt-2 text-[18px] font-bold text-white">{plan.calorieStrategyLabel}</p>
              <p className="mt-1 text-[12px] text-[#6f8090]">Meta: {targetDelta >= 0 ? "+" : ""}{formatNumber(targetDelta)} kcal/dia</p>
            </div>
            <button aria-label="Configurar objetivo calórico" className="inline-flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-[#303746] text-[#8fcfff] transition hover:border-[#3b97e3] hover:text-white" type="button" onClick={onConfigure}>
              <Settings className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function MacroMetric({ color, icon, label, value }: { color: "green" | "red" | "yellow"; icon: ReactNode; label: string; value: number }) {
  const colorClass = color === "green"
    ? "bg-[#0e2c1e] text-[#62d98b]"
    : color === "yellow"
      ? "bg-[#302813] text-[#f2c84b]"
      : "bg-[#32171b] text-[#f27882]";
  const valueClass = color === "green" ? "text-[#62d98b]" : color === "yellow" ? "text-[#f2c84b]" : "text-[#f27882]";
  return (
    <div className="flex items-center gap-3">
      <span className={cn("flex size-9 items-center justify-center rounded-[9px]", colorClass)}>{icon}</span>
      <div>
        <p className={cn("text-[16px] font-bold leading-5", valueClass)}>{macroText(value)}</p>
        <p className="mt-1 text-[12px] text-[#8b92a3]">{label}</p>
      </div>
    </div>
  );
}

function MealCard({
  meal,
  onAddFood,
  onRemoveMeal,
  onRemoveItem,
  onUpdateItem,
  pending,
  quantityEdits,
  setQuantityEdits,
}: {
  meal: PartnerClientDietMeal;
  onAddFood: (mealId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onRemoveMeal: (mealId: string) => void;
  onUpdateItem: (itemId: string, quantity: number) => void;
  pending: boolean;
  quantityEdits: Record<string, string>;
  setQuantityEdits: (value: Record<string, string>) => void;
}) {
  return (
    <Panel className="overflow-hidden p-0">
      <div className="grid min-h-[53px] grid-cols-[1fr_auto] items-center gap-3 border-b border-[#273847] px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex min-w-0 items-center gap-3">
            <Utensils className="size-4 shrink-0 text-[#68afe9]" />
            <p className="truncate text-[15px] font-bold text-white">{meal.title}</p>
            <ChevronDown className="size-4 shrink-0 text-[#8193a3]" />
          </div>
          <span className="text-[13px] font-semibold text-[#c7d3df]">{meal.mealTime}</span>
          <span className="text-[13px] font-semibold text-white">{formatNumber(meal.totals.kcal)} kcal</span>
          <span className="rounded-[5px] bg-[#0e2c1e] px-2 py-1 text-[11px] font-semibold text-[#62d98b]">P {macroText(meal.totals.protein)}</span>
          <span className="rounded-[5px] bg-[#302813] px-2 py-1 text-[11px] font-semibold text-[#f2c84b]">C {macroText(meal.totals.carbs)}</span>
          <span className="rounded-[5px] bg-[#32171b] px-2 py-1 text-[11px] font-semibold text-[#f27882]">G {macroText(meal.totals.fat)}</span>
        </div>
        <IconButton disabled={pending} label={`Remover refeição ${meal.title}`} onClick={() => onRemoveMeal(meal.id)}><Trash2 className="size-4" /></IconButton>
      </div>

      <div className="px-4 py-4">
        <div className="grid grid-cols-[minmax(0,1fr)_88px_52px_52px_52px_44px_36px] gap-3 border-b border-[#273847] pb-2 text-[10px] font-bold uppercase tracking-[0.05em] text-[#748696] max-md:hidden">
          <span>Alimento</span><span>Porção</span><span className="text-[#62d98b]">PTN</span><span className="text-[#f2c84b]">CARB</span><span className="text-[#f27882]">GORD</span><span>Kcal</span><span />
        </div>
        <div className="grid gap-1 pt-2">
          {meal.items.length === 0 ? (
            <div className="rounded-[10px] border border-dashed border-[#303746] px-4 py-5 text-[13px] text-[#8b92a3]">Nenhum alimento nesta refeição.</div>
          ) : meal.items.map((item) => (
            <div className="grid min-h-10 grid-cols-1 gap-2 rounded-[8px] px-1 py-2 text-[13px] text-[#d8e5ee] hover:bg-[#101923]/60 md:grid-cols-[minmax(0,1fr)_88px_52px_52px_52px_44px_36px] md:items-center md:gap-3" key={item.id}>
              <p className="min-w-0 truncate font-semibold text-white">{item.name}</p>
              <label className="sr-only" htmlFor={`quantity-${item.id}`}>Quantidade de {item.name}</label>
              <input
                className="h-8 rounded-[7px] border border-[#263948] bg-[#0b1720] px-2 text-[12px] text-white outline-none focus:border-[#3b97e3]"
                id={`quantity-${item.id}`}
                value={quantityEdits[item.id] ?? String(item.quantity)}
                onChange={(event) => setQuantityEdits({ ...quantityEdits, [item.id]: event.target.value })}
                onBlur={() => {
                  const value = Number((quantityEdits[item.id] ?? item.quantity).toString().replace(",", "."));
                  if (Number.isFinite(value) && value > 0 && value !== item.quantity) onUpdateItem(item.id, value);
                }}
              />
              <span className="font-semibold text-[#62d98b]">{macroText(item.protein)}</span>
              <span className="font-semibold text-[#f2c84b]">{macroText(item.carbs)}</span>
              <span className="font-semibold text-[#f27882]">{macroText(item.fat)}</span>
              <span>{formatNumber(item.kcal)}</span>
              <IconButton disabled={pending} label={`Remover ${item.name}`} onClick={() => onRemoveItem(item.id)}><Trash2 className="size-3.5" /></IconButton>
            </div>
          ))}
        </div>
        <button className="mt-3 inline-flex items-center gap-2 text-[13px] font-semibold text-[#55b4ff] hover:text-white" type="button" onClick={() => onAddFood(meal.id)}>
          <Plus className="size-4" /> Adicionar alimento
        </button>
      </div>
    </Panel>
  );
}

export function PartnerClientDietView({ diet, overview }: PartnerClientDietViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedDay, setSelectedDay] = useState(() => diet.plan?.weekDays.find((day) => day.meals.length > 0)?.dayOfWeek ?? 1);
  const [foodTab, setFoodTab] = useState<DietFoodTab>("suggestions");
  const [foodQuery, setFoodQuery] = useState("");
  const [foodCategory, setFoodCategory] = useState("all");
  const [targetMealId, setTargetMealId] = useState<string | null>(diet.plan?.weekDays.find((day) => day.meals.length > 0)?.meals[0]?.id ?? null);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [objectiveDialogOpen, setObjectiveDialogOpen] = useState(false);
  const [mealDialogOpen, setMealDialogOpen] = useState(false);
  const [newPlan, setNewPlan] = useState<NewPlanForm>(emptyPlanForm);
  const [newMeal, setNewMeal] = useState<NewMealForm>({ mealTime: "16:30", title: "Nova refeição" });
  const [notes, setNotes] = useState(diet.plan?.notes ?? "");
  const [objectiveForm, setObjectiveForm] = useState(() => ({
    calorieStrategy: (diet.plan?.calorieStrategy ?? "maintenance") as NewPlanForm["calorieStrategy"],
    targetCarbsG: diet.plan?.targetCarbs ?? 0,
    targetFatG: diet.plan?.targetFat ?? 0,
    targetKcal: diet.plan?.targetKcal ?? 0,
    targetProteinG: diet.plan?.targetProtein ?? 0,
    waterLiters: diet.plan?.waterLiters ?? 0,
  }));
  const [quantityEdits, setQuantityEdits] = useState<Record<string, string>>({});
  const currentDay = diet.plan?.weekDays.find((day) => day.dayOfWeek === selectedDay) ?? null;
  const categories = useMemo(() => Array.from(new Set(diet.foods.map((food) => food.category))), [diet.foods]);
  const draftByFoodId = useMemo(() => new Map(diet.drafts.map((draft) => [draft.food.id, draft.id])), [diet.drafts]);
  const visibleFoods = useMemo(() => {
    const source = diet.library[foodTab];
    const query = foodQuery.trim().toLowerCase();
    return source.filter((food) => {
      const matchesQuery = !query || food.searchText.includes(query);
      const matchesCategory = foodCategory === "all" || food.category === foodCategory;
      return matchesQuery && matchesCategory;
    });
  }, [diet.library, foodCategory, foodQuery, foodTab]);

  function runAction(action: () => Promise<{ error?: string; ok: boolean }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        window.alert(result.error ?? "Não foi possível concluir a ação.");
        return;
      }
      router.refresh();
    });
  }

  function handleCreatePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runAction(async () => {
      const result = await createClientDietPlan({
        ...newPlan,
        notes: "Manter hidratação adequada ao longo do dia.\nPriorizar alimentos in natura e minimamente processados.",
        patientId: overview.client.id,
      });
      if (result.ok) setPlanDialogOpen(false);
      return result;
    });
  }

  function handleCreateMeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const plan = diet.plan;
    if (!plan) return;
    runAction(async () => {
      const result = await createClientDietMeal({
        dayOfWeek: selectedDay,
        mealTime: newMeal.mealTime,
        patientId: overview.client.id,
        planId: plan.id,
        title: newMeal.title,
      });
      if (result.ok) setMealDialogOpen(false);
      return result;
    });
  }

  function handleUpdateObjective(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!diet.plan) return;
    runAction(async () => {
      const result = await updateClientDietPlanTargets({
        ...objectiveForm,
        patientId: overview.client.id,
        planId: diet.plan!.id,
      });
      if (result.ok) setObjectiveDialogOpen(false);
      return result;
    });
  }

  function addFood(food: PartnerClientDietFood) {
    const plan = diet.plan;
    if (!plan || !targetMealId) return;
    runAction(() => addClientDietMealItem({
      draftId: draftByFoodId.get(food.id) ?? null,
      foodId: food.id,
      mealId: targetMealId,
      patientId: overview.client.id,
      planId: plan.id,
      quantity: food.servingSize,
    }));
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b1720] px-5 py-6 font-['Rethink_Sans',sans-serif] text-[#f3f4f7] lg:px-6">
      <div className="relative mx-auto min-w-0 max-w-[1197px]">
        <PartnerClientProfileHeader activeTab="dietas" overview={overview} />

        {diet.plan ? (
          <>
            <section className="mt-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#8b92a3]">Dieta atual</p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <button className="inline-flex h-9 min-w-[230px] items-center justify-between rounded-[8px] border border-[#303746] bg-[#101923]/70 px-3 text-left text-[20px] font-bold text-white" type="button">
                    {diet.plan.title}<ChevronDown className="size-4 text-[#8b92a3]" />
                  </button>
                  <span className="inline-flex h-[26px] items-center gap-2 rounded-full border border-[#1d7041] bg-[#102d21] px-3 text-[12px] font-semibold text-[#64db8a]"><span className="size-1.5 rounded-full bg-[#64db8a]" />{diet.plan.statusLabel}</span>
                  <span className="text-[12px] text-[#8b92a3]">Criada em {diet.plan.createdLabel}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <PrimaryButton disabled={pending} onClick={() => setPlanDialogOpen(true)}><Plus className="size-4" /> Nova dieta</PrimaryButton>
                <GhostButton disabled={pending} onClick={() => runAction(() => duplicateClientDietPlan({ patientId: overview.client.id, planId: diet.plan!.id }))}><Copy className="size-4" /> Duplicar</GhostButton>
                <GhostButton disabled={pending} onClick={() => runAction(() => publishClientDietPlan({ patientId: overview.client.id, planId: diet.plan!.id }))}><Check className="size-4" /> Publicar</GhostButton>
                <PrimaryButton disabled={pending} onClick={() => runAction(() => sendClientDietPlan({ patientId: overview.client.id, planId: diet.plan!.id }))}><Send className="size-4" /> Enviar ao Cliente</PrimaryButton>
                <IconButton label="Mais ações"><Ellipsis className="size-4" /></IconButton>
              </div>
            </section>

            <SummaryStrip plan={diet.plan} onConfigure={() => setObjectiveDialogOpen(true)} />

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {dietDayLabels.map((day) => {
                const dayData = diet.plan?.weekDays.find((item) => item.dayOfWeek === day.dayOfWeek);
                return (
                  <button className={cn("h-10 shrink-0 rounded-[8px] border px-4 text-[13px] font-semibold transition", selectedDay === day.dayOfWeek ? "border-[#3b97e3] bg-[#0a2c48] text-white" : "border-[#303746] bg-[#101923]/65 text-[#8b92a3] hover:text-white")} key={day.dayOfWeek} type="button" onClick={() => setSelectedDay(day.dayOfWeek)}>
                    {day.shortLabel} · {formatNumber(dayData?.totals.kcal ?? 0)} kcal
                  </button>
                );
              })}
            </div>

            <div className="mt-7 grid gap-4 xl:grid-cols-[0.96fr_1.04fr]">
              <div className="min-w-0">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-[28px] font-bold uppercase tracking-[0.01em] text-white">Plano alimentar</h2>
                  <GhostButton disabled={pending} onClick={() => setMealDialogOpen(true)}><Plus className="size-4" /> Adicionar refeição</GhostButton>
                </div>
                <div className="grid gap-4">
                  {currentDay?.meals.length ? currentDay.meals.map((meal) => (
                    <MealCard
                      key={meal.id}
                      meal={meal}
                      pending={pending}
                      quantityEdits={quantityEdits}
                      setQuantityEdits={setQuantityEdits}
                      onAddFood={(mealId) => setTargetMealId(mealId)}
                      onRemoveMeal={(mealId) => diet.plan && runAction(() => removeClientDietMeal({ mealId, patientId: overview.client.id, planId: diet.plan!.id }))}
                      onRemoveItem={(itemId) => diet.plan && runAction(() => removeClientDietMealItem({ itemId, patientId: overview.client.id, planId: diet.plan!.id }))}
                      onUpdateItem={(itemId, quantity) => diet.plan && runAction(() => updateClientDietMealItem({ itemId, patientId: overview.client.id, planId: diet.plan!.id, quantity }))}
                    />
                  )) : <Panel className="p-6 text-[13px] text-[#8b92a3]">Nenhuma refeição cadastrada para este dia.</Panel>}
                </div>
              </div>

              <div className="grid min-w-0 gap-4">
                <Panel className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-white">Adicionar alimentos</h2>
                    <select className={inputClass("w-[210px]")} value={targetMealId ?? ""} onChange={(event) => setTargetMealId(event.target.value)}>
                      {(currentDay?.meals ?? []).map((meal) => <option key={meal.id} value={meal.id}>{meal.title}</option>)}
                    </select>
                  </div>
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#718394]" />
                    <input className={inputClass("pl-9 pr-40")} placeholder="Buscar alimentos... (ex.: frango, arroz, whey)" value={foodQuery} onChange={(event) => setFoodQuery(event.target.value)} />
                    <select aria-label="Categoria de alimentos" className="absolute right-2 top-1/2 h-7 -translate-y-1/2 rounded-[7px] border border-[#303746] bg-[#101923] px-2 text-[11px] text-[#c7d3df] outline-none" value={foodCategory} onChange={(event) => setFoodCategory(event.target.value)}>
                      <option value="all">Todos os alimentos</option>
                      {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                  </div>
                  <div className="mt-4 flex gap-4 border-b border-[#273847]">
                    {foodTabs.map((tab) => (
                      <button className={cn("inline-flex h-9 items-center gap-2 border-b px-1 text-[13px] font-semibold", foodTab === tab.id ? "border-[#3b97e3] text-white" : "border-transparent text-[#8b92a3]")} key={tab.id} type="button" onClick={() => setFoodTab(tab.id)}>
                        {tab.id === "suggestions" ? <Activity className="size-3.5" /> : tab.id === "recent" ? <Clock className="size-3.5" /> : <Flame className="size-3.5" />}{tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-1">
                    <div className="grid grid-cols-[minmax(0,1fr)_72px_112px_48px_28px] gap-3 border-b border-[#273847] pb-2 text-[10px] font-bold uppercase tracking-[0.05em] text-[#748696] max-sm:hidden">
                      <span>Alimento</span><span>Porção</span><span>Macros</span><span>Kcal</span><span />
                    </div>
                    {visibleFoods.length ? visibleFoods.map((food) => (
                      <FoodRow disabled={pending || !targetMealId} food={food} key={food.id} suggested={draftByFoodId.has(food.id)} onAdd={() => addFood(food)} />
                    )) : <div className="rounded-[10px] border border-dashed border-[#303746] px-4 py-5 text-[13px] text-[#8b92a3]">Nenhum alimento encontrado.</div>}
                  </div>
                </Panel>

                <Panel className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-white">Considerações sobre a dieta</h2>
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#64db8a]"><Check className="size-3.5" /> Salvo na dieta</span>
                  </div>
                  <div className="mt-4 flex gap-3 border-b border-[#273847] pb-3 text-[#9aa5b6]">
                    <strong>B</strong><em>I</em><span className="underline">U</span><span>• Lista</span>
                  </div>
                  <label className="sr-only" htmlFor="diet-notes">Considerações sobre a dieta</label>
                  <textarea className="mt-4 min-h-[150px] w-full resize-y rounded-[10px] border border-[#303746] bg-[#0d1822] p-3 text-[13px] leading-6 text-[#d8e5ee] outline-none focus:border-[#3b97e3]" id="diet-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
                  <div className="mt-3 flex justify-end">
                    <PrimaryButton disabled={pending} onClick={() => diet.plan && runAction(() => saveClientDietNotes({ notes, patientId: overview.client.id, planId: diet.plan!.id }))}><Save className="size-4" /> Salvar considerações</PrimaryButton>
                  </div>
                </Panel>
              </div>
            </div>

            <section className="mt-7">
              <h2 className="mb-4 text-[13px] font-bold uppercase tracking-[0.06em] text-white">Histórico de alterações</h2>
              <Panel className="overflow-hidden p-0">
                {diet.events.length ? diet.events.slice(0, 4).map((event) => (
                  <div className="grid gap-2 border-b border-[#273847] px-4 py-4 text-[13px] last:border-b-0 md:grid-cols-[150px_160px_minmax(0,1fr)_60px] md:items-center" key={event.id}>
                    <span className="inline-flex items-center gap-2 text-[#9aa5b6]"><History className="size-4" /> {event.dateLabel}</span>
                    <span className="font-semibold text-white">{event.actorName ?? "Parceiro"}</span>
                    <span className="text-[#d8e5ee]">{event.detail}</span>
                    <span className="rounded-full border border-[#303746] px-2 py-1 text-center text-[11px] text-[#8b92a3]">v{event.version}.0</span>
                  </div>
                )) : <div className="p-5 text-[13px] text-[#8b92a3]">Sem alterações registradas.</div>}
              </Panel>
            </section>
          </>
        ) : (
          <Panel className="mt-8 p-8 text-center">
            <Utensils className="mx-auto size-10 text-[#55b4ff]" />
            <h2 className="mt-4 text-[22px] font-bold text-white">Nenhuma dieta cadastrada</h2>
            <p className="mx-auto mt-2 max-w-[520px] text-[13px] leading-5 text-[#8b92a3]">Crie o primeiro plano alimentar deste Cliente usando os alimentos da base de Cadastro.</p>
            <PrimaryButton className="mt-5" onClick={() => setPlanDialogOpen(true)}><Plus className="size-4" /> Nova dieta</PrimaryButton>
          </Panel>
        )}
      </div>

      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="border-[#303746] bg-[#101923] text-white sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Nova dieta</DialogTitle>
            <DialogDescription className="text-[#8b92a3]">Defina metas iniciais para criar um plano alimentar do Cliente.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleCreatePlan}>
            <Field label="Título"><input className={inputClass()} value={newPlan.title} onChange={(event) => setNewPlan({ ...newPlan, title: event.target.value })} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Calorias"><input className={inputClass()} type="number" value={newPlan.targetKcal} onChange={(event) => setNewPlan({ ...newPlan, targetKcal: Number(event.target.value) })} /></Field>
              <Field label="Água (L)"><input className={inputClass()} step="0.1" type="number" value={newPlan.waterLiters} onChange={(event) => setNewPlan({ ...newPlan, waterLiters: Number(event.target.value) })} /></Field>
              <Field label="Proteínas (g)"><input className={inputClass()} type="number" value={newPlan.targetProteinG} onChange={(event) => setNewPlan({ ...newPlan, targetProteinG: Number(event.target.value) })} /></Field>
              <Field label="Carboidratos (g)"><input className={inputClass()} type="number" value={newPlan.targetCarbsG} onChange={(event) => setNewPlan({ ...newPlan, targetCarbsG: Number(event.target.value) })} /></Field>
              <Field label="Gorduras (g)"><input className={inputClass()} type="number" value={newPlan.targetFatG} onChange={(event) => setNewPlan({ ...newPlan, targetFatG: Number(event.target.value) })} /></Field>
              <Field label="Estratégia">
                <select className={inputClass()} value={newPlan.calorieStrategy} onChange={(event) => setNewPlan({ ...newPlan, calorieStrategy: event.target.value as NewPlanForm["calorieStrategy"] })}>
                  <option value="deficit">Déficit moderado</option>
                  <option value="maintenance">Manutenção</option>
                  <option value="surplus">Superávit controlado</option>
                </select>
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <GhostButton onClick={() => setPlanDialogOpen(false)}>Cancelar</GhostButton>
              <PrimaryButton disabled={pending} type="submit"><Save className="size-4" /> Salvar dieta</PrimaryButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={objectiveDialogOpen} onOpenChange={setObjectiveDialogOpen}>
        <DialogContent className="border-[#303746] bg-[#101923] text-white sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Configurar objetivo calórico</DialogTitle>
            <DialogDescription className="text-[#8b92a3]">Atualize a estratégia, os macronutrientes e a meta de hidratação do plano atual.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleUpdateObjective}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Calorias"><input aria-label="Calorias do objetivo" className={inputClass()} min="0" type="number" value={objectiveForm.targetKcal} onChange={(event) => setObjectiveForm({ ...objectiveForm, targetKcal: Number(event.target.value) })} /></Field>
              <Field label="Água (L)"><input className={inputClass()} min="0" step="0.1" type="number" value={objectiveForm.waterLiters} onChange={(event) => setObjectiveForm({ ...objectiveForm, waterLiters: Number(event.target.value) })} /></Field>
              <Field label="Proteínas (g)"><input className={inputClass()} min="0" type="number" value={objectiveForm.targetProteinG} onChange={(event) => setObjectiveForm({ ...objectiveForm, targetProteinG: Number(event.target.value) })} /></Field>
              <Field label="Carboidratos (g)"><input className={inputClass()} min="0" type="number" value={objectiveForm.targetCarbsG} onChange={(event) => setObjectiveForm({ ...objectiveForm, targetCarbsG: Number(event.target.value) })} /></Field>
              <Field label="Gorduras (g)"><input className={inputClass()} min="0" type="number" value={objectiveForm.targetFatG} onChange={(event) => setObjectiveForm({ ...objectiveForm, targetFatG: Number(event.target.value) })} /></Field>
              <Field label="Estratégia">
                <select className={inputClass()} value={objectiveForm.calorieStrategy} onChange={(event) => setObjectiveForm({ ...objectiveForm, calorieStrategy: event.target.value as NewPlanForm["calorieStrategy"] })}>
                  <option value="deficit">Déficit moderado</option>
                  <option value="maintenance">Manutenção</option>
                  <option value="surplus">Superávit controlado</option>
                </select>
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <GhostButton onClick={() => setObjectiveDialogOpen(false)}>Cancelar</GhostButton>
              <PrimaryButton disabled={pending} type="submit"><Save className="size-4" /> Salvar objetivo</PrimaryButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={mealDialogOpen} onOpenChange={setMealDialogOpen}>
        <DialogContent className="border-[#303746] bg-[#101923] text-white sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Adicionar refeição</DialogTitle>
            <DialogDescription className="text-[#8b92a3]">A refeição será adicionada ao dia selecionado.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleCreateMeal}>
            <Field label="Nome da refeição"><input className={inputClass()} value={newMeal.title} onChange={(event) => setNewMeal({ ...newMeal, title: event.target.value })} /></Field>
            <Field label="Horário"><input className={inputClass()} type="time" value={newMeal.mealTime} onChange={(event) => setNewMeal({ ...newMeal, mealTime: event.target.value })} /></Field>
            <div className="flex justify-end gap-2 pt-2">
              <GhostButton onClick={() => setMealDialogOpen(false)}>Cancelar</GhostButton>
              <PrimaryButton disabled={pending} type="submit"><Plus className="size-4" /> Adicionar</PrimaryButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-[#303746] bg-[#111821]/70 p-3">
      <p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.05em] text-[#8b92a3]">{label}</p>
      <p className="mt-1 min-w-0 break-words text-[14px] font-semibold leading-5 text-white">{value}</p>
    </div>
  );
}

function FoodRow({ disabled, food, onAdd, suggested }: { disabled: boolean; food: PartnerClientDietFood; onAdd: () => void; suggested: boolean }) {
  return (
    <div className="grid min-h-[49px] grid-cols-1 gap-2 border-b border-[#273847] py-3 text-[13px] last:border-b-0 sm:grid-cols-[minmax(0,1fr)_72px_112px_48px_28px] sm:items-center sm:gap-3">
      <div className="min-w-0">
        <p className="truncate font-semibold text-white">{food.name}</p>
        <p className="mt-0.5 text-[11px] text-[#6f8090]">{food.categoryLabel}{suggested ? " · sugestão" : ""}</p>
      </div>
      <span className="text-[#c7d3df]">{food.servingLabel}</span>
      <span className="text-[#9aa5b6]">P {macroText(food.protein)} · C {macroText(food.carbs)} · G {macroText(food.fat)}</span>
      <span className="font-semibold text-white">{formatNumber(food.kcal)}</span>
      <IconButton disabled={disabled} label={`Adicionar ${food.name}`} onClick={onAdd}><Plus className="size-4" /></IconButton>
    </div>
  );
}
