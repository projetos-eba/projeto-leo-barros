"use client";

import {
  Activity,
  AlertTriangle,
  Archive,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Droplet,
  FileText,
  FlaskConical,
  Grid2X2,
  History,
  MoreVertical,
  Pill,
  Plus,
  Save,
  Search,
  Settings,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";

import {
  convertExamValueToDefault,
  examResultStatusLabels,
  formatExamNumber,
  formatReferenceRange,
  selectExamReference,
  type ExamReferenceSex,
  type PartnerClientExamDefinition,
  type PartnerClientExamResult,
  type PartnerClientExamsData,
} from "@/lib/partners/client-exams-metrics";
import type { PartnerClientOverviewData } from "@/lib/partners/client-overview-metrics";
import { cn } from "@/lib/utils";

import {
  archivePartnerExamDefinition,
  removeClientExamCollection,
  saveClientExamCollection,
  savePartnerExamDefinition,
} from "./actions";
import { PartnerClientProfileHeader } from "./partner-client-profile-header";

type PartnerClientExamsViewProps = {
  exams: PartnerClientExamsData;
  overview: PartnerClientOverviewData;
};

type InternalTab = "configuracoes" | "dashboard" | "resultados";

type ResultDraft = {
  notes: string;
  unit: string;
  value: string;
};

type ReferenceDraft = {
  highValue: string;
  lowValue: string;
  sex: ExamReferenceSex;
};

type UnitDraft = {
  factorFromDefault: string;
  unit: string;
};

type DefinitionDraft = {
  alternativeUnits: UnitDraft[];
  categoryId: string;
  defaultUnit: string;
  definitionId: string | null;
  name: string;
  notes: string;
  references: ReferenceDraft[];
  slug: string;
};

const panelClass = "min-w-0 rounded-[8px] border border-[rgba(65,80,92,0.71)] bg-[linear-gradient(153deg,rgba(42,63,79,0.35)_8%,rgba(96,144,181,0)_79%)]";
const inputClass = "h-10 rounded-[8px] border border-[#303746] bg-[#081520] px-3 text-[13px] text-white outline-none transition placeholder:text-[#667684] focus:border-[#3b97e3]";
const textareaClass = "min-h-24 rounded-[8px] border border-[#303746] bg-[#081520] px-3 py-2 text-[13px] text-white outline-none transition placeholder:text-[#667684] focus:border-[#3b97e3]";

const tabItems: Array<{ id: InternalTab; icon: typeof Activity; label: string }> = [
  { id: "dashboard", icon: Grid2X2, label: "Dashboard" },
  { id: "resultados", icon: ClipboardList, label: "Resultados" },
  { id: "configuracoes", icon: Settings, label: "Configurações" },
];

const categoryIcons: Record<string, typeof Activity> = {
  eletrolitos: Activity,
  funcao_hepatica: FlaskConical,
  funcao_renal: Droplet,
  hematologia: ClipboardList,
  marcadores_inflamatorios: AlertTriangle,
  marcadores_musculares: Activity,
  metabolismo_da_glicose: Activity,
  minerais_e_oligoelementos: Pill,
  painel_hormonal: FlaskConical,
  perfil_lipidico: Droplet,
  vitaminas: Pill,
};

function todayInputValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function toNumberOrNull(value: string) {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function actionMessage(result: { error?: string; message?: string; ok: boolean }) {
  return result.ok ? result.message ?? "Atualizado." : result.error ?? "Não foi possível concluir a ação.";
}

function referenceDrafts(definition: PartnerClientExamDefinition | null): ReferenceDraft[] {
  if (!definition) return [{ highValue: "", lowValue: "", sex: "unisex" }];
  return definition.references.length
    ? definition.references.map((reference) => ({
      highValue: reference.highValue === null ? "" : String(reference.highValue),
      lowValue: reference.lowValue === null ? "" : String(reference.lowValue),
      sex: reference.sex,
    }))
    : [{ highValue: "", lowValue: "", sex: "unisex" }];
}

function unitDrafts(definition: PartnerClientExamDefinition | null): UnitDraft[] {
  if (!definition || definition.alternativeUnits.length === 0) return [];
  return definition.alternativeUnits.map((unit) => ({
    factorFromDefault: String(unit.factorFromDefault),
    unit: unit.unit,
  }));
}

function definitionDraft(definition: PartnerClientExamDefinition | null, fallbackCategoryId: string): DefinitionDraft {
  return {
    alternativeUnits: unitDrafts(definition),
    categoryId: definition?.categoryId ?? fallbackCategoryId,
    defaultUnit: definition?.defaultUnit ?? "mg/dL",
    definitionId: definition?.id ?? null,
    name: definition?.name ?? "",
    notes: "",
    references: referenceDrafts(definition),
    slug: definition?.slug ?? "",
  };
}

function ActionButton({ children, disabled, onClick, tone = "ghost", type = "button" }: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  tone?: "danger" | "ghost" | "primary";
  type?: "button" | "submit";
}) {
  const tones = {
    danger: "border-[#71313a] bg-[#2b1218] text-[#ff8d98] hover:border-[#ef626c]",
    ghost: "border-[#303746] bg-[#101923] text-[#d8e5ee] hover:border-[#3b97e3]",
    primary: "border-[#3b97e3] bg-[#2d9cff] text-white hover:bg-[#55a8eb]",
  };
  return (
    <button
      className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border px-4 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50", tones[tone])}
      disabled={disabled}
      type={type}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8b92a3]">
      {label}
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: PartnerClientExamResult["status"] }) {
  const tones = {
    high: "border-[#71313a] bg-[#34141b] text-[#ff7b88]",
    low: "border-[#71313a] bg-[#34141b] text-[#ff7b88]",
    normal: "border-[#1f6d42] bg-[#102d21] text-[#67dc90]",
    unknown: "border-[#6b5b22] bg-[#2c2614] text-[#e8c35f]",
  };
  return <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold", tones[status])}>{examResultStatusLabels[status]}</span>;
}

function MiniChart({ results }: { results: PartnerClientExamResult[] }) {
  const points = results.slice().sort((a, b) => a.collectedAt.localeCompare(b.collectedAt)).slice(-6);
  const values = points.map((point) => point.valueDefault);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const span = Math.max(1, max - min);
  const x = (index: number) => 12 + (index / Math.max(1, points.length - 1)) * 190;
  const y = (value: number) => 48 - ((value - min) / span) * 38;
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(point.valueDefault)}`).join(" ");

  return (
    <svg aria-hidden className="h-[60px] w-full" preserveAspectRatio="none" viewBox="0 0 224 60">
      <line stroke="#214058" strokeDasharray="4 7" x1="8" x2="216" y1="48" y2="48" />
      <line stroke="#214058" strokeDasharray="4 7" x1="8" x2="216" y1="18" y2="18" />
      {points.length > 1 ? <path d={path} fill="none" stroke="#2d9cff" strokeLinecap="round" strokeWidth="3" /> : null}
      {points.map((point, index) => <circle cx={x(index)} cy={y(point.valueDefault)} fill="#79c7ff" key={`${point.id}-${index}`} r="3.5" />)}
    </svg>
  );
}

function DashboardView({ exams }: { exams: PartnerClientExamsData }) {
  const allResultsByExam = useMemo(() => {
    const map = new Map<string, PartnerClientExamResult[]>();
    for (const collection of exams.collections) {
      for (const result of collection.results) {
        map.set(result.examId, [...(map.get(result.examId) ?? []), result]);
      }
    }
    return map;
  }, [exams.collections]);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <section className={cn(panelClass, "p-5")}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b92a3]">Última coleta</p>
          <p className="mt-3 text-[26px] font-bold leading-8 text-white">{exams.summary.lastCollectionLabel}</p>
          <p className="mt-1 text-[12px] text-[#8b92a3]">{exams.summary.latestResultCount} resultados registrados</p>
        </section>
        <section className={cn(panelClass, "p-5")}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b92a3]">Catálogo ativo</p>
          <p className="mt-3 text-[26px] font-bold leading-8 text-white">{exams.summary.totalExams}</p>
          <p className="mt-1 text-[12px] text-[#8b92a3]">{exams.summary.categoryCount} categorias</p>
        </section>
        <section className={cn(panelClass, "p-5")}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b92a3]">Alertas críticos</p>
          <p className="mt-3 text-[26px] font-bold leading-8 text-white">{String(exams.summary.alertCount).padStart(2, "0")}</p>
          <p className="mt-1 text-[12px] text-[#8b92a3]">fora da faixa de referência</p>
        </section>
        <section className={cn(panelClass, "p-5")}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b92a3]">Histórico</p>
          <p className="mt-3 text-[26px] font-bold leading-8 text-white">{exams.collections.length}</p>
          <p className="mt-1 text-[12px] text-[#8b92a3]">coletas salvas</p>
        </section>
      </section>

      {exams.alerts.length ? (
        <section className={cn(panelClass, "p-5")}>
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-[9px] bg-[#34141b] text-[#ff7b88]"><AlertTriangle className="size-4" /></span>
            <div>
              <h2 className="text-[18px] font-bold text-white">Alertas de referência</h2>
              <p className="mt-1 text-[12px] text-[#8b92a3]">Resultados mais recentes abaixo ou acima da faixa.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {exams.alerts.slice(0, 6).map((alert) => (
              <div className="rounded-[8px] border border-[#71313a]/70 bg-[#2b1218]/70 p-4" key={alert.id}>
                <p className="text-[13px] font-bold text-white">{alert.examName}</p>
                <p className="mt-1 text-[12px] text-[#b8c4ce]">{alert.categoryName}</p>
                <div className="mt-3 flex items-center justify-between gap-3 text-[12px]">
                  <strong className="text-[#ff8d98]">{alert.valueLabel}</strong>
                  <span className="text-[#8b92a3]">Ref. {alert.referenceLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4">
        {exams.dashboard.map((category, index) => {
          const Icon = categoryIcons[category.category.slug] ?? FileText;
          return (
            <details className={cn(panelClass, "overflow-hidden")} key={category.category.id} open={index === 0}>
              <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-[#082a43] text-[#68afe9]"><Icon className="size-4" /></span>
                <h2 className="min-w-0 flex-1 text-[18px] font-bold text-white">{category.category.name}</h2>
                <span className="rounded-full bg-[#252f39] px-3 py-1 text-[11px] font-semibold uppercase text-[#9aa5b6]">{category.examCount} exames</span>
                {category.alertCount ? <span className="rounded-full border border-[#71313a] bg-[#34141b] px-3 py-1 text-[11px] font-semibold text-[#ff7b88]">{category.alertCount} alertas</span> : null}
                <ChevronDown className="size-4 text-[#8b92a3]" />
              </summary>
              <div className="grid gap-4 border-t border-[#263846] p-5 lg:grid-cols-2 xl:grid-cols-4">
                {category.results.slice(0, 7).map((result) => (
                  <article className="min-h-[238px] rounded-[8px] border border-[#263846] bg-[#0b1823] p-4" key={result.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-[14px] font-bold text-white">{result.snapshotExamName}</h3>
                        <p className="mt-1 text-[11px] font-semibold uppercase text-[#6f7c89]">{result.defaultUnit}</p>
                      </div>
                      <MoreVertical className="size-4 shrink-0 text-[#6f7c89]" />
                    </div>
                    <p className="mt-5 text-[30px] font-bold leading-8 text-white">{formatExamNumber(result.valueDefault, 1)}</p>
                    <p className="mt-2 text-[12px] text-[#8b92a3]">Ref.: {result.referenceLabel}</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <StatusBadge status={result.status} />
                      <span className={cn("inline-flex items-center gap-1 text-[12px] font-semibold", result.deltaPct && result.deltaPct > 0 ? "text-[#67dc90]" : "text-[#ff8d98]")}>
                        {result.deltaPct && result.deltaPct > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                        {result.trendLabel}
                      </span>
                    </div>
                    <div className="mt-5"><MiniChart results={allResultsByExam.get(result.examId) ?? [result]} /></div>
                    <div className="mt-2 flex justify-between text-[11px] text-[#8b92a3]">
                      <span>{result.collectedLabel}</span>
                      <span>{result.valueLabel}</span>
                    </div>
                  </article>
                ))}
                {category.results.length === 0 ? (
                  <p className="rounded-[8px] border border-[#263846] bg-[#0b1823] p-4 text-[13px] text-[#8b92a3]">Nenhum resultado salvo nesta categoria.</p>
                ) : null}
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}

function ResultsView({
  drafts,
  exams,
  note,
  onClear,
  onDraftChange,
  onNoteChange,
  onRemoveCollection,
  onSubmit,
  pending,
  selectedCategory,
  setSelectedCategory,
  setCollectedAt,
  collectedAt,
}: {
  collectedAt: string;
  drafts: Record<string, ResultDraft>;
  exams: PartnerClientExamsData;
  note: string;
  onClear: () => void;
  onDraftChange: (examId: string, draft: Partial<ResultDraft>) => void;
  onNoteChange: (value: string) => void;
  onRemoveCollection: (collectionId: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
  selectedCategory: string;
  setCollectedAt: (value: string) => void;
  setSelectedCategory: (value: string) => void;
}) {
  const visibleDefinitions = exams.definitions.filter((definition) => definition.categoryId === selectedCategory);

  return (
    <section className="grid gap-6 xl:grid-cols-[230px_minmax(0,1fr)]">
      <aside className={cn(panelClass, "p-5")}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[16px] font-bold text-white">Histórico</h2>
          <span className="flex size-8 items-center justify-center rounded-[8px] bg-[#082a43] text-[#68afe9]"><History className="size-4" /></span>
        </div>
        <div className="mt-5 grid gap-3">
          {exams.collections.slice(0, 8).map((collection) => (
            <div className="rounded-[8px] border border-[#263846] bg-[#0b1823] p-3" key={collection.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[13px] font-bold text-white">{collection.collectedLabel}</p>
                  <p className="mt-1 text-[12px] text-[#8b92a3]">{collection.resultCount} resultados</p>
                </div>
                <button
                  aria-label={`Remover coleta ${collection.collectedLabel}`}
                  className="flex size-8 items-center justify-center rounded-[8px] border border-[#303746] text-[#8b92a3] transition hover:border-[#ef626c] hover:text-[#ef626c]"
                  disabled={pending}
                  type="button"
                  onClick={() => onRemoveCollection(collection.id)}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
          {exams.collections.length === 0 ? <p className="py-8 text-center text-[13px] italic text-[#8b92a3]">Nenhum registro salvo.</p> : null}
        </div>
      </aside>

      <form className="grid gap-6" onSubmit={onSubmit}>
        <section className={cn(panelClass, "p-6")}>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_198px_auto_auto] lg:items-center">
            <div className="flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-[12px] bg-[#2d9cff] text-white shadow-[0_10px_30px_rgba(45,156,255,0.35)]"><CalendarDays className="size-6" /></span>
              <div>
                <h2 className="text-[24px] font-bold leading-7 text-white">Registro de Coleta</h2>
                <p className="mt-1 text-[13px] text-[#8b92a3]">Insira os resultados coletados para este Cliente.</p>
              </div>
            </div>
            <Field label="Data da coleta">
              <input className={inputClass} type="date" value={collectedAt} onChange={(event) => setCollectedAt(event.target.value)} />
            </Field>
            <button className="h-10 px-3 text-[13px] font-semibold text-[#8b92a3] hover:text-white" type="button" onClick={onClear}>
              Limpar
            </button>
            <ActionButton disabled={pending} tone="primary" type="submit"><Save className="size-4" />Salvar</ActionButton>
          </div>
          <label className="mt-5 grid gap-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8b92a3]">
            Observações da coleta
            <textarea className={textareaClass} placeholder="Opcional" value={note} onChange={(event) => onNoteChange(event.target.value)} />
          </label>
        </section>

        <div className="flex gap-2 overflow-x-auto rounded-[8px] border border-[#263846] bg-[#0b1823] p-2">
          {exams.categories.map((category) => (
            <button
              className={cn("h-9 shrink-0 rounded-[7px] px-3 text-[12px] font-semibold transition", selectedCategory === category.id ? "bg-[#2d9cff] text-white" : "text-[#9aa5b6] hover:bg-[#111f2b] hover:text-white")}
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        <section className="grid gap-4">
          {visibleDefinitions.map((definition) => {
            const reference = selectExamReference(definition, exams.patient.referenceSex);
            const draft = drafts[definition.id] ?? { notes: "", unit: definition.defaultUnit, value: "" };
            const value = toNumberOrNull(draft.value);
            const preview = value === null ? null : convertExamValueToDefault(value, draft.unit, definition);
            return (
              <div className={cn(panelClass, "grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_120px_150px_minmax(0,1fr)] lg:items-center")} key={definition.id}>
                <div className="min-w-0">
                  <h3 className="truncate text-[15px] font-bold text-white">{definition.name}</h3>
                  <p className="mt-1 text-[12px] text-[#8b92a3]">Ref.: {reference?.referenceLabel ?? formatReferenceRange(null, null, definition.defaultUnit)}</p>
                </div>
                <Field label="Valor">
                  <input className={inputClass} inputMode="decimal" placeholder="0" value={draft.value} onChange={(event) => onDraftChange(definition.id, { value: event.target.value })} />
                </Field>
                <Field label="Unidade">
                  <select className={inputClass} value={draft.unit} onChange={(event) => onDraftChange(definition.id, { unit: event.target.value })}>
                    {definition.units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                </Field>
                <div className="grid gap-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8b92a3]">Prévia</p>
                  <p className="text-[13px] text-[#d8e5ee]">{preview ? `${formatExamNumber(preview.valueDefault, 1)} ${definition.defaultUnit}` : "Aguardando valor"}</p>
                </div>
              </div>
            );
          })}
        </section>
      </form>
    </section>
  );
}

function ConfigView({
  categories,
  definitions,
  draft,
  onArchive,
  onDraftChange,
  onNew,
  onSelect,
  onSubmit,
  pending,
  query,
  selectedCategoryId,
  selectedId,
  setQuery,
  setSelectedCategoryId,
}: {
  categories: PartnerClientExamsData["categories"];
  definitions: PartnerClientExamDefinition[];
  draft: DefinitionDraft;
  onArchive: () => void;
  onDraftChange: (draft: DefinitionDraft) => void;
  onNew: () => void;
  onSelect: (definition: PartnerClientExamDefinition) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
  query: string;
  selectedCategoryId: string;
  selectedId: string | null;
  setQuery: (value: string) => void;
  setSelectedCategoryId: (value: string) => void;
}) {
  const filtered = definitions.filter((definition) => {
    const matchesQuery = !query.trim() || definition.searchText.includes(query.trim().toLowerCase());
    const matchesCategory = selectedCategoryId === "all" || definition.categoryId === selectedCategoryId;
    return matchesQuery && matchesCategory;
  });

  function updateReference(index: number, patch: Partial<ReferenceDraft>) {
    const references = draft.references.map((reference, itemIndex) => itemIndex === index ? { ...reference, ...patch } : reference);
    onDraftChange({ ...draft, references });
  }

  function updateUnit(index: number, patch: Partial<UnitDraft>) {
    const alternativeUnits = draft.alternativeUnits.map((unit, itemIndex) => itemIndex === index ? { ...unit, ...patch } : unit);
    onDraftChange({ ...draft, alternativeUnits });
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className={cn(panelClass, "overflow-hidden")}>
        <div className="border-b border-[#263846] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-bold text-white">Catálogo de exames</h2>
              <p className="mt-1 text-[12px] text-[#8b92a3]">{definitions.length} exames ativos</p>
            </div>
            <ActionButton onClick={onNew}><Plus className="size-4" />Novo</ActionButton>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6f7c89]" />
            <input className={cn(inputClass, "w-full pl-9")} placeholder="Buscar exame..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <Field label="Filtrar por categoria">
            <select className={cn(inputClass, "w-full")} value={selectedCategoryId} onChange={(event) => setSelectedCategoryId(event.target.value)}>
              <option value="all">Todas as categorias</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="max-h-[620px] overflow-y-auto p-3">
          {filtered.map((definition) => (
            <button
              className={cn("grid w-full gap-1 rounded-[8px] px-3 py-3 text-left transition", selectedId === definition.id ? "bg-[#0d2b43] text-white" : "text-[#d8e5ee] hover:bg-[#0b1823]")}
              key={definition.id}
              type="button"
              onClick={() => onSelect(definition)}
            >
              <span className="truncate text-[13px] font-bold">{definition.name}</span>
              <span className="text-[11px] text-[#8b92a3]">{definition.categoryName} · {definition.defaultUnit}</span>
            </button>
          ))}
        </div>
      </aside>

      <form className={cn(panelClass, "p-5")} onSubmit={onSubmit}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-bold text-white">{draft.definitionId ? "Editar exame" : "Novo exame"}</h2>
            <p className="mt-1 text-[12px] text-[#8b92a3]">Configurações alteram o catálogo do parceiro e preservam snapshots já salvos.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {draft.definitionId ? <ActionButton disabled={pending} tone="danger" onClick={onArchive}><Archive className="size-4" />Arquivar</ActionButton> : null}
            <ActionButton disabled={pending} tone="primary" type="submit"><Save className="size-4" />Salvar</ActionButton>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Field label="Nome">
            <input className={inputClass} value={draft.name} onChange={(event) => onDraftChange({ ...draft, name: event.target.value })} />
          </Field>
          <Field label="Slug técnico">
            <input className={inputClass} value={draft.slug} onChange={(event) => onDraftChange({ ...draft, slug: event.target.value })} />
          </Field>
          <Field label="Categoria">
            <select className={inputClass} value={draft.categoryId} onChange={(event) => onDraftChange({ ...draft, categoryId: event.target.value })}>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </Field>
          <Field label="Unidade padrão">
            <input className={inputClass} value={draft.defaultUnit} onChange={(event) => onDraftChange({ ...draft, defaultUnit: event.target.value })} />
          </Field>
        </div>

        <div className="mt-6 border-t border-[#263846] pt-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[15px] font-bold text-white">Faixas de referência</h3>
            <ActionButton onClick={() => onDraftChange({ ...draft, references: [...draft.references, { highValue: "", lowValue: "", sex: "unisex" }] })}><Plus className="size-4" />Faixa</ActionButton>
          </div>
          <div className="mt-4 grid gap-3">
            {draft.references.map((reference, index) => (
              <div className="grid gap-3 rounded-[8px] border border-[#263846] bg-[#0b1823] p-3 lg:grid-cols-[160px_1fr_1fr_auto]" key={`${reference.sex}-${index}`}>
                <Field label="Aplicação">
                  <select className={inputClass} value={reference.sex} onChange={(event) => updateReference(index, { sex: event.target.value as ExamReferenceSex })}>
                    <option value="unisex">Unissex</option>
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                  </select>
                </Field>
                <Field label="Mínimo">
                  <input className={inputClass} inputMode="decimal" value={reference.lowValue} onChange={(event) => updateReference(index, { lowValue: event.target.value })} />
                </Field>
                <Field label="Máximo">
                  <input className={inputClass} inputMode="decimal" value={reference.highValue} onChange={(event) => updateReference(index, { highValue: event.target.value })} />
                </Field>
                <button
                  aria-label="Remover faixa"
                  className="mt-auto flex size-10 items-center justify-center rounded-[8px] border border-[#303746] text-[#8b92a3] hover:border-[#ef626c] hover:text-[#ef626c]"
                  type="button"
                  onClick={() => onDraftChange({ ...draft, references: draft.references.filter((_, itemIndex) => itemIndex !== index) })}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-[#263846] pt-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[15px] font-bold text-white">Conversões de unidade</h3>
            <ActionButton onClick={() => onDraftChange({ ...draft, alternativeUnits: [...draft.alternativeUnits, { factorFromDefault: "", unit: "" }] })}><Plus className="size-4" />Unidade</ActionButton>
          </div>
          <div className="mt-4 grid gap-3">
            {draft.alternativeUnits.map((unit, index) => (
              <div className="grid gap-3 rounded-[8px] border border-[#263846] bg-[#0b1823] p-3 lg:grid-cols-[1fr_1fr_auto]" key={`${unit.unit}-${index}`}>
                <Field label="Unidade alternativa">
                  <input className={inputClass} value={unit.unit} onChange={(event) => updateUnit(index, { unit: event.target.value })} />
                </Field>
                <Field label="Fator a partir da unidade padrão">
                  <input className={inputClass} inputMode="decimal" value={unit.factorFromDefault} onChange={(event) => updateUnit(index, { factorFromDefault: event.target.value })} />
                </Field>
                <button
                  aria-label="Remover unidade"
                  className="mt-auto flex size-10 items-center justify-center rounded-[8px] border border-[#303746] text-[#8b92a3] hover:border-[#ef626c] hover:text-[#ef626c]"
                  type="button"
                  onClick={() => onDraftChange({ ...draft, alternativeUnits: draft.alternativeUnits.filter((_, itemIndex) => itemIndex !== index) })}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            {draft.alternativeUnits.length === 0 ? <p className="rounded-[8px] border border-[#263846] bg-[#0b1823] p-4 text-[13px] text-[#8b92a3]">Nenhuma unidade alternativa configurada.</p> : null}
          </div>
        </div>
      </form>
    </section>
  );
}

export function PartnerClientExamsView({ exams, overview }: PartnerClientExamsViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<InternalTab>("dashboard");
  const [selectedCategory, setSelectedCategory] = useState(exams.categories[0]?.id ?? "");
  const [collectedAt, setCollectedAt] = useState(todayInputValue());
  const [collectionNotes, setCollectionNotes] = useState("");
  const [drafts, setDrafts] = useState<Record<string, ResultDraft>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [configQuery, setConfigQuery] = useState("");
  const [configCategoryId, setConfigCategoryId] = useState("all");
  const [selectedDefinition, setSelectedDefinition] = useState<PartnerClientExamDefinition | null>(exams.definitions[0] ?? null);
  const [definitionForm, setDefinitionForm] = useState<DefinitionDraft>(() => definitionDraft(exams.definitions[0] ?? null, exams.categories[0]?.id ?? ""));

  function runAction(action: () => Promise<{ error?: string; id?: string; message?: string; ok: boolean }>) {
    startTransition(() => {
      void action().then((result) => {
        setMessage(actionMessage(result));
        if (result.ok) router.refresh();
      });
    });
  }

  function updateDraft(examId: string, draft: Partial<ResultDraft>) {
    const definition = exams.definitions.find((item) => item.id === examId);
    setDrafts((current) => ({
      ...current,
      [examId]: {
        notes: current[examId]?.notes ?? "",
        unit: current[examId]?.unit ?? definition?.defaultUnit ?? "",
        value: current[examId]?.value ?? "",
        ...draft,
      },
    }));
  }

  function submitCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const results = Object.entries(drafts).flatMap(([examId, draft]) => {
      const value = toNumberOrNull(draft.value);
      if (value === null) return [];
      return [{
        examId,
        notes: draft.notes.trim() || null,
        unit: draft.unit,
        value,
      }];
    });
    if (results.length === 0) {
      setMessage("Preencha pelo menos um resultado.");
      return;
    }
    runAction(() => saveClientExamCollection({
      collectedAt,
      notes: collectionNotes.trim() || null,
      patientId: overview.client.id,
      results,
      title: "Registro de coleta",
    }));
  }

  function submitDefinition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const references = definitionForm.references
      .map((reference) => ({
        highValue: toNumberOrNull(reference.highValue),
        lowValue: toNumberOrNull(reference.lowValue),
        sex: reference.sex,
      }))
      .filter((reference) => reference.highValue !== null || reference.lowValue !== null);
    const alternativeUnits = definitionForm.alternativeUnits
      .map((unit) => ({
        factorFromDefault: toNumberOrNull(unit.factorFromDefault) ?? 0,
        unit: unit.unit.trim(),
      }))
      .filter((unit) => unit.unit && unit.factorFromDefault > 0);
    runAction(() => savePartnerExamDefinition({
      alternativeUnits,
      categoryId: definitionForm.categoryId,
      defaultUnit: definitionForm.defaultUnit,
      definitionId: definitionForm.definitionId,
      name: definitionForm.name,
      notes: definitionForm.notes.trim() || null,
      references,
      slug: definitionForm.slug,
    }));
  }

  return (
    <main className="min-h-screen bg-[#07131c] pb-12 text-white">
      <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
        <PartnerClientProfileHeader activeTab="exames" overview={overview} />

        <section className="mt-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-[24px] font-bold leading-8 text-white">Exames</h1>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-[#8b92a3]">Entrada de dados clínicos</p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-right text-[12px]">
            <div>
              <p className="font-semibold uppercase tracking-[0.08em] text-[#8b92a3]">Última coleta</p>
              <p className="mt-1 font-bold text-white">{exams.summary.lastCollectionLabel}</p>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-[0.08em] text-[#8b92a3]">Alertas críticos</p>
              <p className="mt-1 font-bold text-white">{String(exams.summary.alertCount).padStart(2, "0")} alterações</p>
            </div>
          </div>
        </section>

        <div className="mt-5 inline-flex max-w-full gap-1 overflow-x-auto rounded-[14px] bg-[#0c0f12] p-1">
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                className={cn("inline-flex h-10 shrink-0 items-center gap-2 rounded-[10px] px-4 text-[14px] font-bold transition", activeTab === tab.id ? "bg-[#2d9cff] text-white" : "text-[#7f858c] hover:text-white")}
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {message ? <p className="mt-4 rounded-[8px] border border-[#263846] bg-[#0b1823] px-4 py-3 text-[13px] font-semibold text-[#8fcfff]">{message}</p> : null}

        <div className="mt-8">
          {activeTab === "dashboard" ? <DashboardView exams={exams} /> : null}
          {activeTab === "resultados" ? (
            <ResultsView
              collectedAt={collectedAt}
              drafts={drafts}
              exams={exams}
              note={collectionNotes}
              pending={pending}
              selectedCategory={selectedCategory}
              setCollectedAt={setCollectedAt}
              setSelectedCategory={setSelectedCategory}
              onClear={() => {
                setDrafts({});
                setCollectionNotes("");
                setMessage("Campos limpos.");
              }}
              onDraftChange={updateDraft}
              onNoteChange={setCollectionNotes}
              onRemoveCollection={(collectionId) => runAction(() => removeClientExamCollection({ collectionId, patientId: overview.client.id }))}
              onSubmit={submitCollection}
            />
          ) : null}
          {activeTab === "configuracoes" ? (
            <ConfigView
              categories={exams.categories}
              definitions={exams.definitions}
              draft={definitionForm}
              pending={pending}
              query={configQuery}
              selectedCategoryId={configCategoryId}
              selectedId={selectedDefinition?.id ?? null}
              setQuery={setConfigQuery}
              setSelectedCategoryId={setConfigCategoryId}
              onArchive={() => {
                const definitionId = definitionForm.definitionId;
                if (!definitionId) return;
                runAction(() => archivePartnerExamDefinition({ definitionId, patientId: overview.client.id }));
              }}
              onDraftChange={setDefinitionForm}
              onNew={() => {
                setSelectedDefinition(null);
                setDefinitionForm(definitionDraft(null, exams.categories[0]?.id ?? ""));
              }}
              onSelect={(definition) => {
                setSelectedDefinition(definition);
                setDefinitionForm(definitionDraft(definition, exams.categories[0]?.id ?? ""));
              }}
              onSubmit={submitDefinition}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
