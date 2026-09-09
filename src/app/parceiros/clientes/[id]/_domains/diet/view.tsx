"use client";

import {
  Activity,
  AlertTriangle,
  Camera,
  Check,
  ChevronDown,
  Clock,
  Droplets,
  Ellipsis,
  Flame,
  History,
  Lock,
  MessageSquareText,
  Plus,
  Save,
  Search,
  Send,
  Trash2,
  Utensils,
  Wheat,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { indexCatalog, searchCatalog } from "@/lib/partners/catalog-search";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PartnerClientDietData, PartnerClientDietFood, PartnerClientDietMeal, PartnerClientDietMealLog, PartnerClientDietTrackingStatus } from "@/lib/partners/client-profile/diet";
import { dietDayLabels, type DietFoodTab } from "@/lib/partners/client-profile/diet";
import type { PartnerClientOverviewData } from "@/lib/partners/client-profile/overview";
import { cn } from "@/lib/utils";

import {
  addClientDietMealItem,
  createClientDietMeal,
  createClientDietPlan,
  publishClientDietPlan,
  removeClientDietMeal,
  removeClientDietMealItem,
  saveClientDietNotes,
  sendClientDietPlan,
  updateClientDietMealItem,
  updateClientDietPlanTargets,
} from "../../_actions/diet";
import { PartnerClientProfileHeader } from "../../partner-client-profile-header";
import { DietSummary } from "./summary";

type PartnerClientDietViewProps = {
  diet: PartnerClientDietData;
  overview: PartnerClientOverviewData;
};

type NewPlanForm = {
  calorieStrategy: "deficit" | "maintenance" | "surplus";
  targetCarbsG: number;
  targetFatG: number;
  targetFiberMaxG: number | null;
  targetFiberMinG: number | null;
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
  targetFiberMaxG: 30,
  targetFiberMinG: 25,
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

function IconButton({ label, children, className, onClick, disabled }: { children: ReactNode; className?: string; disabled?: boolean; label: string; onClick?: () => void }) {
  return (
    <button
      aria-label={label}
      className={cn("inline-flex size-9 items-center justify-center rounded-[8px] border border-[#303746] bg-[#101923]/70 text-[#b8c7d4] transition hover:border-[#3b97e3] hover:text-white disabled:cursor-not-allowed disabled:opacity-50", className)}
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

function statusTone(status: PartnerClientDietTrackingStatus) {
  return {
    completed: "border-[#1d7041] bg-[#102d21] text-[#73e59b]",
    partial: "border-[#2f82bf] bg-[#0a2c48] text-[#8fcfff]",
    pending: "border-[#6b5420] bg-[#2f260d] text-[#ffd45a]",
    skipped: "border-[#8a2c3a] bg-[#35141b] text-[#ff8f9a]",
  }[status];
}

function TrackingMetric({ icon, label, value, hint }: { hint: string; icon: ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[12px] border border-[#273847] bg-[#081722]/70 p-3">
      <div className="flex items-center gap-2 text-[#8fcfff]">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-[#08243a]">{icon}</span>
        <p className="truncate text-[11px] font-bold uppercase tracking-[0.06em] text-[#8b92a3]">{label}</p>
      </div>
      <p className="mt-3 text-[24px] font-bold leading-none text-white">{value}</p>
      <p className="mt-1 truncate text-[11px] text-[#7f91a1]">{hint}</p>
    </div>
  );
}

function TrackingLogRow({ log, onOpenNote }: { log: PartnerClientDietMealLog; onOpenNote: (log: PartnerClientDietMealLog) => void }) {
  return (
    <div className="grid gap-2 border-b border-[#273847] px-4 py-3 text-[13px] last:border-b-0 sm:grid-cols-[92px_minmax(0,1fr)_72px_86px_88px] sm:items-center">
      <div className="text-[#9aa5b6]">{log.dateLabel}</div>
      <div className="min-w-0">
        <p className="truncate font-bold text-white">{log.mealTitle}</p>
        <p className="text-[11px] text-[#7f91a1]">{log.timeLabel}{log.completedAtLabel ? ` · ${log.completedAtLabel}` : ""}</p>
      </div>
      <span className="text-[11px] font-semibold text-[#d8e5ee]">{formatNumber(log.kcalConsumed)} kcal</span>
      <span className={cn("inline-flex h-7 w-fit items-center rounded-full border px-2.5 text-[11px] font-bold", statusTone(log.status))}>{log.statusLabel}</span>
      {log.notes || log.photoLabel ? (
        <button className="inline-flex w-fit items-center gap-1 text-[11px] font-semibold text-[#8fcfff] hover:text-white" type="button" onClick={() => onOpenNote(log)}>
          {log.photoLabel ? <Camera className="size-3.5" /> : <MessageSquareText className="size-3.5" />}
          {log.notes ? "Ver nota" : "Ver anexo"}
        </button>
      ) : <span className="text-[11px] text-[#8b92a3]">Sem anexo</span>}
    </div>
  );
}

function DietTrackingPanel({ diet }: { diet: PartnerClientDietData }) {
  const tracking = diet.tracking;
  const [selectedLog, setSelectedLog] = useState<PartnerClientDietMealLog | null>(null);
  const [collapsed, setCollapsed] = useState(true);
  if (!tracking) return null;

  const summary = tracking.summary;
  const waterTarget = diet.plan?.waterLiters ? `${formatNumber(diet.plan.waterLiters, 1)} L/dia` : "meta não definida";

  return (
    <Panel className="mt-5 overflow-hidden p-0">
      <button
        aria-expanded={!collapsed}
        className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-[#101923]/45 sm:px-5"
        type="button"
        onClick={() => setCollapsed((value) => !value)}
      >
        <span className="min-w-0">
          <span className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[#8b92a3]">Acompanhamento da execução</span>
          <span className="mt-1 block text-[20px] font-bold text-white sm:text-[22px]">{tracking.periodLabel}</span>
        </span>
        <span className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#c7d3df]">
          <span className="rounded-full border border-[#273847] bg-[#081722]/70 px-3 py-1">{summary.adherencePct}% adesão</span>
          <span className="rounded-full border border-[#273847] bg-[#081722]/70 px-3 py-1">{formatNumber(summary.waterAverageMl)} ml água</span>
          <span className="rounded-full border border-[#273847] bg-[#081722]/70 px-3 py-1">{formatNumber(summary.notesCount + summary.photosCount)} retorno(s)</span>
          <span className="inline-flex size-8 items-center justify-center rounded-[8px] border border-[#303746] text-[#8fcfff]">
            <ChevronDown className={cn("size-4 transition", !collapsed && "rotate-180")} />
          </span>
        </span>
      </button>
      {collapsed ? null : (
        <>
      <div className="grid gap-0 divide-y divide-[#273847] xl:grid-cols-[1fr_0.82fr] xl:divide-x xl:divide-y-0">
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#8b92a3]">Acompanhamento da execução</p>
              <h2 className="mt-1 text-[22px] font-bold text-white sm:text-[26px]">{tracking.periodLabel}</h2>
            </div>
            <span className="rounded-full border border-[#2f82bf] bg-[#0a2c48] px-3 py-1 text-[11px] font-bold text-[#8fcfff]">Dados do Cliente</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <TrackingMetric icon={<Check className="size-4" />} label="Adesão" value={`${summary.adherencePct}%`} hint={`${summary.completedMeals} realizadas · ${summary.partialMeals} parciais`} />
            <TrackingMetric icon={<AlertTriangle className="size-4" />} label="Pendências" value={formatNumber(summary.pendingMeals)} hint={`${summary.skippedMeals} puladas no período`} />
            <TrackingMetric icon={<Droplets className="size-4" />} label="Água média" value={`${formatNumber(summary.waterAverageMl)} ml`} hint={waterTarget} />
            <TrackingMetric icon={<MessageSquareText className="size-4" />} label="Retornos" value={formatNumber(summary.notesCount + summary.photosCount)} hint={`${summary.notesCount} notas · ${summary.photosCount} fotos`} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {tracking.days.map((day) => (
              <div className="rounded-[10px] border border-[#273847] bg-[#081722]/70 p-2" key={day.isoDate}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase text-[#8b92a3]">{day.shortLabel}</p>
                  <span className={cn("size-2 rounded-full", day.adherencePct >= 80 ? "bg-[#62d98b]" : day.adherencePct > 0 ? "bg-[#f2c84b]" : "bg-[#f0616d]")} />
                </div>
                <p className="mt-1 text-[16px] font-bold text-white">{day.adherencePct}%</p>
                <p className="text-[10px] text-[#7f91a1]">{day.completedMeals + day.partialMeals}/{day.plannedMeals} refeições</p>
                <p className="mt-1 text-[10px] font-semibold text-[#d8e5ee]">{formatNumber(day.kcalConsumed)} kcal</p>
                <p className="mt-1 text-[10px] text-[#8fcfff]">{formatNumber(day.waterMl)} ml</p>
              </div>
            ))}
          </div>

          {tracking.insights.length ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {tracking.insights.map((insight) => (
                <div className="flex items-start gap-2 rounded-[10px] border border-[#303746] bg-[#101923]/65 p-3 text-[12px] text-[#c7d3df]" key={insight}>
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#f2c84b]" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="p-4 sm:p-5">
          <h3 className="text-[13px] font-bold uppercase tracking-[0.06em] text-white">Últimos registros do Cliente</h3>
          <div className="mt-4 max-h-[420px] overflow-y-auto rounded-[12px] border border-[#273847]">
            {tracking.mealLogs.length ? tracking.mealLogs.map((log) => <TrackingLogRow key={log.id} log={log} onOpenNote={setSelectedLog} />) : (
              <div className="p-5 text-[13px] text-[#8b92a3]">Nenhum registro diário recebido no período.</div>
            )}
          </div>
        </div>
      </div>
      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="border-[#303746] bg-[#101923] text-white sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{selectedLog?.mealTitle ?? "Registro"}</DialogTitle>
            <DialogDescription className="text-[#8b92a3]">
              {selectedLog ? `${selectedLog.dateLabel} · ${selectedLog.timeLabel} · ${formatNumber(selectedLog.kcalConsumed)} kcal` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-[13px] text-[#d8e5ee]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#8b92a3]">Observação</p>
              <p className="mt-2 rounded-[10px] border border-[#273847] bg-[#081722]/70 p-3 leading-5">{selectedLog?.notes ?? "Sem observação enviada."}</p>
            </div>
            {selectedLog?.photoLabel ? (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#8b92a3]">Anexo</p>
                <p className="mt-2 rounded-[10px] border border-[#273847] bg-[#081722]/70 p-3">{selectedLog.photoLabel}</p>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
        </>
      )}
    </Panel>
  );
}

function InlineFoodSearch({ foods, mealTitle, pending, onAddInlineFood, onCloseInlineSearch }: {
  foods: PartnerClientDietFood[]; mealTitle: string; pending: boolean;
  onAddInlineFood: (food: PartnerClientDietFood) => void; onCloseInlineSearch: () => void;
}) {
  const [inlineFoodQuery, onInlineFoodQueryChange] = useState("");
  const index = useMemo(() => indexCatalog(foods, (food) => food.searchText), [foods]);
  const inlineFoodOptions = useMemo(() => searchCatalog(index, inlineFoodQuery, 6), [index, inlineFoodQuery]);
  return <>
        {(
          <div
            className="relative mt-3 max-w-[520px]"
            onBlur={(event) => {
              const nextTarget = event.relatedTarget instanceof Node ? event.relatedTarget : null;
              if (!event.currentTarget.contains(nextTarget)) onCloseInlineSearch();
            }}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#718394]" />
              <input
                aria-label={`Buscar alimento para ${mealTitle}`}
                autoFocus
                className={inputClass("pl-9")}
                placeholder="Digite para buscar alimento..."
                value={inlineFoodQuery}
                onChange={(event) => onInlineFoodQueryChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") onCloseInlineSearch();
                }}
              />
            </div>
            {inlineFoodQuery.trim() ? (
              <div className="absolute left-0 right-0 top-[44px] z-30 max-h-[260px] overflow-y-auto rounded-[10px] border border-[#273847] bg-[#0b1720] p-1 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
                {inlineFoodOptions.length ? inlineFoodOptions.map((food) => (
                  <button
                    aria-label={`Adicionar ${food.name} à refeição ${mealTitle}`}
                    className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[8px] px-3 py-2 text-left text-[12px] transition hover:bg-[#0a2c48]/70"
                    disabled={pending}
                    key={food.id}
                    type="button"
                    onClick={() => onAddInlineFood(food)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-white">{food.name}</span>
                      <span className="mt-0.5 block text-[11px] text-[#6f8090]">{food.categoryLabel} · {food.servingLabel}</span>
                    </span>
                    <span className="shrink-0 text-[11px] font-semibold text-[#8b92a3]">{formatNumber(food.kcal)} kcal</span>
                  </button>
                )) : (
                  <div className="px-3 py-3 text-[12px] text-[#8b92a3]">Nenhum alimento encontrado.</div>
                )}
                <button className="w-full rounded-[8px] px-3 py-2 text-left text-[12px] font-semibold text-[#8fcfff] hover:bg-[#0a2c48]/70" type="button" onClick={onCloseInlineSearch}>Fechar busca</button>
              </div>
            ) : null}
          </div>
        )}
  </>;
}

function FoodLibrary({ diet, disabled, onAdd }: { diet: PartnerClientDietViewProps["diet"]; disabled: boolean; onAdd: (food: PartnerClientDietFood) => void }) {
  const [foodTab, setFoodTab] = useState<DietFoodTab>("suggestions");
  const [foodQuery, setFoodQuery] = useState("");
  const [foodCategory, setFoodCategory] = useState("all");
  const [limit, setLimit] = useState(30);
  const categories = useMemo(() => Array.from(new Set(diet.foods.map((food) => food.category))), [diet.foods]);
  const { drafts } = diet;
  const index = useMemo(() => indexCatalog(diet.library[foodTab], (food) => food.searchText), [diet.library, foodTab]);
  const visibleFoods = useMemo(() => searchCatalog(index, foodQuery, limit + 1, (food) => foodCategory === "all" || food.category === foodCategory), [index, foodQuery, foodCategory, limit]);
  return <>
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#718394]" />
                    <input className={inputClass("pl-9 pr-40")} placeholder="Buscar alimentos... (ex.: frango, arroz, whey)" value={foodQuery} onChange={(event) => { setFoodQuery(event.target.value); setLimit(30); }} />
                    <select aria-label="Categoria de alimentos" className="absolute right-2 top-1/2 h-7 -translate-y-1/2 rounded-[7px] border border-[#303746] bg-[#101923] px-2 text-[11px] text-[#c7d3df] outline-none" value={foodCategory} onChange={(event) => { setFoodCategory(event.target.value); setLimit(30); }}>
                      <option value="all">Todos os alimentos</option>
                      {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                  </div>
                  <div className="mt-4 flex gap-4 border-b border-[#273847]">
                    {foodTabs.map((tab) => (
                      <button className={cn("inline-flex h-9 items-center gap-2 border-b px-1 text-[13px] font-semibold", foodTab === tab.id ? "border-[#3b97e3] text-white" : "border-transparent text-[#8b92a3]")} key={tab.id} type="button" onClick={() => { setFoodTab(tab.id); setLimit(30); }}>
                        {tab.id === "suggestions" ? <Activity className="size-3.5" /> : tab.id === "recent" ? <Clock className="size-3.5" /> : <Flame className="size-3.5" />}{tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-1">
                    <div className="grid grid-cols-[minmax(0,1fr)_72px_112px_48px_28px] gap-3 border-b border-[#273847] pb-2 text-[10px] font-bold uppercase tracking-[0.05em] text-[#748696] max-sm:hidden">
                      <span>Alimento</span><span>Porção</span><span>Macros</span><span>Kcal</span><span />
                    </div>
                    {visibleFoods.length ? visibleFoods.slice(0, limit).map((food) => (
                      <FoodRow disabled={disabled} food={food} key={food.id} suggested={drafts.some((draft) => draft.food.id === food.id)} onAdd={() => onAdd(food)} />
                    )) : <div className="rounded-[10px] border border-dashed border-[#303746] px-4 py-5 text-[13px] text-[#8b92a3]">Nenhum alimento encontrado.</div>}
                  </div>
                  {visibleFoods.length > limit && <GhostButton onClick={() => setLimit((value) => value + 30)}>Carregar mais</GhostButton>}
  </>;
}

function MealCard({
  foods,
  inlineSearchOpen,
  meal,
  onAddInlineFood,
  onAddFood,
  onCloseInlineSearch,
  onRemoveMeal,
  onRemoveItem,
  onUpdateItem,
  pending,
  quantityEdits,
  setQuantityEdits,
}: {
  foods: PartnerClientDietFood[];
  inlineSearchOpen: boolean;
  meal: PartnerClientDietMeal;
  onAddInlineFood: (food: PartnerClientDietFood) => void;
  onAddFood: (mealId: string) => void;
  onCloseInlineSearch: () => void;
  onRemoveItem: (itemId: string) => void;
  onRemoveMeal: (mealId: string) => void;
  onUpdateItem: (itemId: string, quantity: number) => void;
  pending: boolean;
  quantityEdits: Record<string, string>;
  setQuantityEdits: (value: Record<string, string>) => void;
}) {
  return (
    <Panel className="overflow-visible p-0">
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
            <div className="rounded-[8px] px-1 py-2 text-[13px] text-[#d8e5ee] hover:bg-[#101923]/60" key={item.id}>
              <div className="grid grid-cols-[minmax(0,1fr)_74px_36px] items-center gap-2 md:grid-cols-[minmax(0,1fr)_88px_52px_52px_52px_44px_36px] md:gap-3">
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
                <span className="hidden font-semibold text-[#62d98b] md:inline">{macroText(item.protein)}</span>
                <span className="hidden font-semibold text-[#f2c84b] md:inline">{macroText(item.carbs)}</span>
                <span className="hidden font-semibold text-[#f27882] md:inline">{macroText(item.fat)}</span>
                <span className="hidden md:inline">{formatNumber(item.kcal)}</span>
                <IconButton className="justify-self-end max-md:col-start-3 max-md:row-start-1" disabled={pending} label={`Remover ${item.name}`} onClick={() => onRemoveItem(item.id)}><Trash2 className="size-3.5" /></IconButton>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold md:hidden">
                <span className="rounded-[5px] bg-[#0e2c1e] px-2 py-1 text-[#62d98b]">P {macroText(item.protein)}</span>
                <span className="rounded-[5px] bg-[#302813] px-2 py-1 text-[#f2c84b]">C {macroText(item.carbs)}</span>
                <span className="rounded-[5px] bg-[#32171b] px-2 py-1 text-[#f27882]">G {macroText(item.fat)}</span>
                <span className="rounded-[5px] bg-[#102333] px-2 py-1 text-[#c7d3df]">{formatNumber(item.kcal)} kcal</span>
              </div>
            </div>
          ))}
        </div>
        {inlineSearchOpen && <InlineFoodSearch foods={foods} mealTitle={meal.title} pending={pending} onAddInlineFood={onAddInlineFood} onCloseInlineSearch={onCloseInlineSearch} />}
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
  const [selectedMenuOption, setSelectedMenuOption] = useState(1);
  const [targetMealId, setTargetMealId] = useState<string | null>(diet.plan?.weekDays.find((day) => day.meals.length > 0)?.meals[0]?.id ?? null);
  const [inlineFoodMealId, setInlineFoodMealId] = useState<string | null>(null);
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
    targetFiberMaxG: diet.plan?.targetFiberMax ?? null,
    targetFiberMinG: diet.plan?.targetFiberMin ?? null,
    targetKcal: diet.plan?.targetKcal ?? 0,
    targetProteinG: diet.plan?.targetProtein ?? 0,
    waterLiters: diet.plan?.waterLiters ?? 0,
  }));
  const [quantityEdits, setQuantityEdits] = useState<Record<string, string>>({});
  const currentDay = diet.plan?.weekDays.find((day) => day.dayOfWeek === selectedDay) ?? null;
  const currentMeals = (currentDay?.meals ?? []).filter((meal) => meal.menuOption === selectedMenuOption);
  const draftByFoodId = useMemo(() => new Map(diet.drafts.map((draft) => [draft.food.id, draft.id])), [diet.drafts]);

  useEffect(() => {
    const firstDayWithMeals = diet.plan?.weekDays.find((day) => day.meals.length > 0);
    const firstMeal = firstDayWithMeals?.meals.find((meal) => meal.menuOption === 1) ?? firstDayWithMeals?.meals[0] ?? null;

    setSelectedDay(firstDayWithMeals?.dayOfWeek ?? 1);
    setSelectedMenuOption(firstMeal?.menuOption ?? 1);
    setTargetMealId(firstMeal?.id ?? null);
    setInlineFoodMealId(null);
    setNotes(diet.plan?.notes ?? "");
    setObjectiveForm({
      calorieStrategy: (diet.plan?.calorieStrategy ?? "maintenance") as NewPlanForm["calorieStrategy"],
      targetCarbsG: diet.plan?.targetCarbs ?? 0,
      targetFatG: diet.plan?.targetFat ?? 0,
      targetFiberMaxG: diet.plan?.targetFiberMax ?? null,
      targetFiberMinG: diet.plan?.targetFiberMin ?? null,
      targetKcal: diet.plan?.targetKcal ?? 0,
      targetProteinG: diet.plan?.targetProtein ?? 0,
      waterLiters: diet.plan?.waterLiters ?? 0,
    });
    setQuantityEdits({});
  }, [diet.plan]);

  function planUrl(planId: string) {
    return `/parceiros/clientes/${overview.client.id}?tab=dietas&plan=${planId}`;
  }

  function runAction(
    action: () => Promise<{ error?: string; id?: string; ok: boolean }>,
    onSuccess?: (result: { id?: string; ok: boolean }) => void,
  ) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        window.alert(result.error ?? "Não foi possível concluir a ação.");
        return;
      }
      onSuccess?.(result);
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
    }, (result) => {
      if (result.id) router.push(planUrl(result.id));
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
        menuOption: selectedMenuOption,
        optionLabel: `Cardápio ${selectedMenuOption}`,
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

  function addFoodToMeal(food: PartnerClientDietFood, mealId: string | null) {
    const plan = diet.plan;
    if (!plan || !mealId) return;
    runAction(() => addClientDietMealItem({
      draftId: draftByFoodId.get(food.id) ?? null,
      foodId: food.id,
      mealId,
      patientId: overview.client.id,
      planId: plan.id,
      quantity: food.servingSize,
    }));
    setInlineFoodMealId(null);
  }

  function addFood(food: PartnerClientDietFood) {
    addFoodToMeal(food, targetMealId);
  }

  function openInlineFoodSearch(mealId: string) {
    setTargetMealId(mealId);
    setInlineFoodMealId(mealId);
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b1720] px-3 py-4 font-['Rethink_Sans',sans-serif] text-[#f3f4f7] sm:px-5 sm:py-6 lg:px-6">
      <div className="relative mx-auto min-w-0 max-w-[1197px]">
        <PartnerClientProfileHeader activeTab="dietas" overview={overview} />

        {diet.plan ? (
          <>
            <section className="mt-4 flex flex-wrap items-end justify-between gap-4 sm:mt-6">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#8b92a3]">Dieta atual</p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <label className="sr-only" htmlFor="diet-plan-selector">Selecionar dieta</label>
                  <select
                    className="h-9 min-w-0 max-w-full rounded-[8px] border border-[#303746] bg-[#101923]/70 px-3 text-[17px] font-bold text-white outline-none focus:border-[#3b97e3] sm:min-w-[230px] sm:text-[20px]"
                    id="diet-plan-selector"
                    value={diet.plan.id}
                    onChange={(event) => router.push(planUrl(event.target.value))}
                  >
                    {diet.plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title} · {plan.statusLabel}</option>)}
                  </select>
                  <span className={cn("inline-flex h-[26px] items-center gap-2 rounded-full border px-3 text-[12px] font-semibold", diet.plan.status === "active" ? "border-[#1d7041] bg-[#102d21] text-[#64db8a]" : "border-[#83641d] bg-[#302813] text-[#f2c84b]")}><span className={cn("size-1.5 rounded-full", diet.plan.status === "active" ? "bg-[#64db8a]" : "bg-[#f2c84b]")} />{diet.plan.statusLabel}</span>
                  <span className="text-[12px] text-[#8b92a3]">Criada em {diet.plan.createdLabel}</span>
                </div>
                {diet.plan.status === "draft" ? <p className="mt-2 text-[12px] text-[#f2c84b]">Este rascunho ainda não está disponível ao Cliente.</p> : null}
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <MiniInfo label="Início" value={diet.plan.startsLabel} />
                  <MiniInfo label="Próxima revisão" value={diet.plan.reviewLabel} />
                  <MiniInfo label="Versão" value={`v${diet.plan.version}.0`} />
                </div>
              </div>
              <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-none sm:flex sm:flex-wrap">
                <PrimaryButton className="px-3" disabled={pending} onClick={() => setPlanDialogOpen(true)}><Plus className="size-4" /> Nova dieta</PrimaryButton>
                <GhostButton disabled={pending} onClick={() => runAction(() => publishClientDietPlan({ patientId: overview.client.id, planId: diet.plan!.id }))}><Check className="size-4" /> Ativar plano</GhostButton>
                <PrimaryButton className="col-span-2 px-3 sm:col-span-1" disabled={pending} onClick={() => runAction(() => sendClientDietPlan({ patientId: overview.client.id, planId: diet.plan!.id }))}><Send className="size-4" /> Enviar aviso</PrimaryButton>
                <IconButton label="Mais ações"><Ellipsis className="size-4" /></IconButton>
              </div>
            </section>

            <DietSummary
              fiberTargetMaxG={diet.plan.targetFiberMax}
              fiberTargetMinG={diet.plan.targetFiberMin}
              getKcal={diet.energy.getKcal}
              meals={currentMeals}
              waterLiters={diet.plan.waterLiters}
              weightKg={overview.weight.value}
              onConfigure={() => setObjectiveDialogOpen(true)}
            />

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

            <div className="mt-5 grid gap-4 sm:mt-7 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
              <div className="min-w-0">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-[22px] font-bold uppercase tracking-[0.01em] text-white sm:text-[28px]">Plano alimentar</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    {[1, 2].map((option) => (
                      <button
                        className={cn("h-10 rounded-[8px] border px-4 text-[13px] font-semibold transition", selectedMenuOption === option ? "border-[#3b97e3] bg-[#0a2c48] text-white" : "border-[#303746] bg-[#101923]/65 text-[#8b92a3] hover:text-white")}
                        key={option}
                        type="button"
                        onClick={() => {
                          setSelectedMenuOption(option);
                          setTargetMealId((currentDay?.meals ?? []).find((meal) => meal.menuOption === option)?.id ?? null);
                        }}
                      >
                        Cardápio {option}
                      </button>
                    ))}
                    <GhostButton disabled={pending} onClick={() => setMealDialogOpen(true)}><Plus className="size-4" /> Adicionar refeição</GhostButton>
                  </div>
                </div>
                <div className="grid gap-4">
                  {currentMeals.length ? currentMeals.map((meal) => (
                    <MealCard
                      foods={diet.foods}
                      inlineSearchOpen={inlineFoodMealId === meal.id}
                      key={meal.id}
                      meal={meal}
                      pending={pending}
                      quantityEdits={quantityEdits}
                      setQuantityEdits={setQuantityEdits}
                      onAddFood={openInlineFoodSearch}
                      onAddInlineFood={(food) => addFoodToMeal(food, meal.id)}
                      onCloseInlineSearch={() => {
                        setInlineFoodMealId(null);
                                          }}
                      onRemoveMeal={(mealId) => diet.plan && runAction(() => removeClientDietMeal({ mealId, patientId: overview.client.id, planId: diet.plan!.id }))}
                      onRemoveItem={(itemId) => diet.plan && runAction(() => removeClientDietMealItem({ itemId, patientId: overview.client.id, planId: diet.plan!.id }))}
                      onUpdateItem={(itemId, quantity) => diet.plan && runAction(() => updateClientDietMealItem({ itemId, patientId: overview.client.id, planId: diet.plan!.id, quantity }))}
                    />
                  )) : <Panel className="p-6 text-[13px] text-[#8b92a3]">Nenhuma refeição cadastrada para este dia neste cardápio.</Panel>}
                </div>
              </div>

              <div className="grid min-w-0 gap-4">
                <Panel className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-white">Adicionar alimentos</h2>
                    <select className={inputClass("w-[210px]")} value={targetMealId ?? ""} onChange={(event) => setTargetMealId(event.target.value)}>
                      {currentMeals.map((meal) => <option key={meal.id} value={meal.id}>{meal.title}</option>)}
                    </select>
                  </div>
                  <FoodLibrary diet={diet} disabled={pending || !targetMealId} onAdd={addFood} />
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

            <DietTrackingPanel diet={diet} />

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
              <Field label="Fibra mínima (g)"><input aria-label="Fibra mínima" className={inputClass()} min="0" step="0.1" type="number" value={newPlan.targetFiberMinG ?? ""} onChange={(event) => setNewPlan({ ...newPlan, targetFiberMinG: event.target.value === "" ? null : Number(event.target.value) })} /></Field>
              <Field label="Fibra máxima (g)"><input aria-label="Fibra máxima" className={inputClass()} min="0" step="0.1" type="number" value={newPlan.targetFiberMaxG ?? ""} onChange={(event) => setNewPlan({ ...newPlan, targetFiberMaxG: event.target.value === "" ? null : Number(event.target.value) })} /></Field>
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
            <DialogTitle>Configurar metas da dieta</DialogTitle>
            <DialogDescription className="text-[#8b92a3]">Atualize a estratégia, os macronutrientes, a fibra e a meta de hidratação do plano atual.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleUpdateObjective}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Calorias"><input aria-label="Calorias do objetivo" className={inputClass()} min="0" type="number" value={objectiveForm.targetKcal} onChange={(event) => setObjectiveForm({ ...objectiveForm, targetKcal: Number(event.target.value) })} /></Field>
              <Field label="Água (L)"><input className={inputClass()} min="0" step="0.1" type="number" value={objectiveForm.waterLiters} onChange={(event) => setObjectiveForm({ ...objectiveForm, waterLiters: Number(event.target.value) })} /></Field>
              <Field label="Proteínas (g)"><input className={inputClass()} min="0" type="number" value={objectiveForm.targetProteinG} onChange={(event) => setObjectiveForm({ ...objectiveForm, targetProteinG: Number(event.target.value) })} /></Field>
              <Field label="Carboidratos (g)"><input className={inputClass()} min="0" type="number" value={objectiveForm.targetCarbsG} onChange={(event) => setObjectiveForm({ ...objectiveForm, targetCarbsG: Number(event.target.value) })} /></Field>
              <Field label="Gorduras (g)"><input className={inputClass()} min="0" type="number" value={objectiveForm.targetFatG} onChange={(event) => setObjectiveForm({ ...objectiveForm, targetFatG: Number(event.target.value) })} /></Field>
              <Field label="Fibra mínima (g)"><input aria-label="Fibra mínima" className={inputClass()} min="0" step="0.1" type="number" value={objectiveForm.targetFiberMinG ?? ""} onChange={(event) => setObjectiveForm({ ...objectiveForm, targetFiberMinG: event.target.value === "" ? null : Number(event.target.value) })} /></Field>
              <Field label="Fibra máxima (g)"><input aria-label="Fibra máxima" className={inputClass()} min="0" step="0.1" type="number" value={objectiveForm.targetFiberMaxG ?? ""} onChange={(event) => setObjectiveForm({ ...objectiveForm, targetFiberMaxG: event.target.value === "" ? null : Number(event.target.value) })} /></Field>
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
    <div className="grid min-h-[49px] grid-cols-[minmax(0,1fr)_36px] gap-2 border-b border-[#273847] py-3 text-[13px] last:border-b-0 sm:grid-cols-[minmax(0,1fr)_72px_112px_48px_28px] sm:items-center sm:gap-3">
      <div className="min-w-0">
        <p className="truncate font-semibold text-white">{food.name}</p>
        <p className="mt-0.5 text-[11px] text-[#6f8090]">{food.categoryLabel}{suggested ? " · sugestão" : ""}</p>
      </div>
      <IconButton className="justify-self-end sm:col-start-5 sm:row-start-1" disabled={disabled} label={`Adicionar ${food.name}`} onClick={onAdd}><Plus className="size-4" /></IconButton>
      <div className="col-span-2 flex flex-wrap gap-2 text-[11px] font-semibold sm:contents">
        <span className="rounded-[5px] bg-[#102333] px-2 py-1 text-[#c7d3df] sm:bg-transparent sm:p-0">{food.servingLabel}</span>
        <span className="hidden text-[#9aa5b6] sm:inline">P {macroText(food.protein)} · C {macroText(food.carbs)} · G {macroText(food.fat)}</span>
        <span className="rounded-[5px] bg-[#0e2c1e] px-2 py-1 text-[#62d98b] sm:hidden">P {macroText(food.protein)}</span>
        <span className="rounded-[5px] bg-[#302813] px-2 py-1 text-[#f2c84b] sm:hidden">C {macroText(food.carbs)}</span>
        <span className="rounded-[5px] bg-[#32171b] px-2 py-1 text-[#f27882] sm:hidden">G {macroText(food.fat)}</span>
        <span className="rounded-[5px] bg-[#102333] px-2 py-1 font-semibold text-white sm:bg-transparent sm:p-0">{formatNumber(food.kcal)}<span className="sm:hidden"> kcal</span></span>
      </div>
    </div>
  );
}
