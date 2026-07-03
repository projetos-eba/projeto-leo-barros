"use client";

import {
  Activity,
  Clock3,
  Flame,
  HeartPulse,
  Save,
  Send,
  Target,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";

import {
  buildCardioComparison,
  calculateCardioKcal,
  calculateCardioKcalPerMinute,
  cardioActivities,
  cardioActivityOptions,
  cardioZoneLabels,
  type CardioActivityKey,
  type CardioZoneKey,
  type PartnerClientCardioData,
} from "@/lib/partners/client-cardio-metrics";
import type { PartnerClientOverviewData } from "@/lib/partners/client-overview-metrics";
import { cn } from "@/lib/utils";

import {
  applyClientCardioCalculation,
  removeClientCardioSession,
  saveClientCardioCalculation,
} from "./actions";
import { PartnerClientProfileHeader } from "./partner-client-profile-header";

type PartnerClientCardioViewProps = {
  cardio: PartnerClientCardioData;
  overview: PartnerClientOverviewData;
};

const panelClass = "min-w-0 rounded-[8px] border border-[rgba(65,80,92,0.71)] bg-[linear-gradient(153deg,rgba(42,63,79,0.35)_8%,rgba(96,144,181,0)_79%)]";
const inputClass = "h-10 rounded-[8px] border border-[#303746] bg-[#081520] px-3 text-[13px] text-white outline-none focus:border-[#3b97e3]";
const zoneOptions: CardioZoneKey[] = ["z1", "z2", "z3", "z4", "z5"];
const zonePercentLabels: Record<CardioZoneKey, string> = {
  z1: "50-60%",
  z2: "60-70%",
  z3: "70-80%",
  z4: "80-90%",
  z5: "90-100%",
};

function formatNumber(value: number, digits = 0) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8b92a3]">
      {label}
      {children}
    </label>
  );
}

function ActionButton({ children, disabled, onClick, tone = "ghost", type = "button" }: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  tone?: "ghost" | "primary";
  type?: "button" | "submit";
}) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-[8px] px-4 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        tone === "primary"
          ? "bg-[#3b97e3] text-white hover:bg-[#55a8eb]"
          : "border border-[#303746] bg-[#101923] text-[#d8e5ee] hover:border-[#3b97e3]",
      )}
      disabled={disabled}
      type={type}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function KpiCard({ Icon, label, meta, progress, value }: {
  Icon: typeof Target;
  label: string;
  meta: string;
  progress?: number;
  value: string;
}) {
  return (
    <section className={cn(panelClass, "p-5")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b92a3]">{label}</p>
          <p className="mt-3 text-[28px] font-bold leading-8 text-white">{value}</p>
          <p className="mt-1 text-[12px] text-[#8b92a3]">{meta}</p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#0a2b45] text-[#68afe9]">
          <Icon className="size-5" />
        </span>
      </div>
      {typeof progress === "number" ? (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#102333]">
          <span className="block h-full rounded-full bg-[#3b97e3]" style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      ) : null}
    </section>
  );
}

function ActivityCard({ activity, active }: { activity: (typeof cardioActivities)[CardioActivityKey]; active?: boolean }) {
  return (
    <div className={cn("rounded-[8px] border p-3", active ? "border-[#3b97e3] bg-[#0d2b43]" : "border-[#303746] bg-[#0b1823]")}>
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-[9px] bg-[#082a43] text-[#68afe9]">
          <Activity className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-white">{activity.label}</p>
          <p className="truncate text-[11px] text-[#8b92a3]">{activity.intensityLabel}</p>
        </div>
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6f7c89]">MET selecionado</p>
      <p className="text-[16px] font-bold text-[#8fcfff]">{formatNumber(activity.met, 1)}</p>
    </div>
  );
}

function ComparisonChart({ comparison, comparisonLabel, primaryLabel }: {
  comparison: Array<{ comparisonKcal: number; minutes: number; primaryKcal: number }>;
  comparisonLabel: string;
  primaryLabel: string;
}) {
  const maxKcal = Math.max(100, ...comparison.flatMap((point) => [point.primaryKcal, point.comparisonKcal]));
  const chartMax = Math.ceil(maxKcal / 100) * 100;
  const plot = { bottom: 242, left: 44, right: 500, top: 24 };
  const x = (minutes: number) => plot.left + (minutes / 60) * (plot.right - plot.left);
  const y = (kcal: number) => plot.bottom - (kcal / chartMax) * (plot.bottom - plot.top);
  const primaryPath = comparison.map((point, index) => `${index === 0 ? "M" : "L"} ${x(point.minutes)} ${y(point.primaryKcal)}`).join(" ");
  const comparisonPath = comparison.map((point, index) => `${index === 0 ? "M" : "L"} ${x(point.minutes)} ${y(point.comparisonKcal)}`).join(" ");
  const yTicks = [0, Math.round(chartMax * 0.33), Math.round(chartMax * 0.66), chartMax];

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-4 text-[11px] font-semibold">
        <span className="inline-flex items-center gap-2 text-[#8fcfff]"><span className="size-2 rounded-full bg-[#3b97e3]" />{primaryLabel}</span>
        <span className="inline-flex items-center gap-2 text-[#70d690]"><span className="size-2 rounded-full bg-[#58c587]" />{comparisonLabel}</span>
      </div>
      <svg aria-label="Comparativo calórico por duração" className="mt-2 h-[270px] w-full" preserveAspectRatio="none" viewBox="0 0 544 270">
        {yTicks.map((tick) => (
          <g key={tick}>
            <line stroke="#23445b" strokeDasharray="5 7" strokeWidth="1" x1={plot.left} x2={plot.right} y1={y(tick)} y2={y(tick)} />
            <text fill="#8b92a3" fontSize="11" textAnchor="end" x="36" y={y(tick) + 4}>{tick}</text>
          </g>
        ))}
        {[0, 15, 30, 45, 60].map((minutes) => (
          <text fill="#8b92a3" fontSize="11" key={minutes} textAnchor="middle" x={x(minutes)} y="264">{minutes} min</text>
        ))}
        <path d={primaryPath} fill="none" stroke="#3b97e3" strokeLinecap="round" strokeWidth="3" />
        <path d={comparisonPath} fill="none" stroke="#58c587" strokeLinecap="round" strokeWidth="3" />
        {comparison.map((point) => (
          <g key={point.minutes}>
            <circle cx={x(point.minutes)} cy={y(point.primaryKcal)} fill="#3b97e3" r="4" />
            <circle cx={x(point.minutes)} cy={y(point.comparisonKcal)} fill="#58c587" r="4" />
          </g>
        ))}
      </svg>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {comparison.filter((point) => point.minutes > 0).map((point) => (
          <div className="rounded-[8px] border border-[#263846] bg-[#0b1823] p-3" key={point.minutes}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6f7c89]">{point.minutes} min</p>
            <p className="mt-2 text-[13px] text-[#8fcfff]">{point.primaryKcal} kcal</p>
            <p className="text-[13px] text-[#70d690]">{point.comparisonKcal} kcal</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PartnerClientCardioView({ cardio, overview }: PartnerClientCardioViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const plan = cardio.plan;
  const initialWeight = plan?.weightKg ?? cardio.latestCalculation?.weightKg ?? 70;
  const initialDuration = cardio.latestCalculation?.durationMinutes ?? 30;
  const [weightKg, setWeightKg] = useState(initialWeight);
  const [durationMinutes, setDurationMinutes] = useState(initialDuration);
  const [weeklyTargetMinutes, setWeeklyTargetMinutes] = useState(plan?.weeklyTargetMinutes ?? 180);
  const [activityKey, setActivityKey] = useState<CardioActivityKey>(plan?.activity.key ?? "caminhada_leve");
  const [comparisonActivityKey, setComparisonActivityKey] = useState<CardioActivityKey>(plan?.comparisonActivity.key ?? "corrida_moderada");
  const [targetZone, setTargetZone] = useState<CardioZoneKey>(plan?.targetZone ?? "z2");
  const [message, setMessage] = useState<string | null>(null);

  const activity = cardioActivities[activityKey];
  const comparisonActivity = cardioActivities[comparisonActivityKey];
  const calculation = useMemo(() => ({
    comparisonKcal: calculateCardioKcal(weightKg, comparisonActivity.met, durationMinutes),
    comparisonKcalPerMin: calculateCardioKcalPerMinute(weightKg, comparisonActivity.met),
    kcal: calculateCardioKcal(weightKg, activity.met, durationMinutes),
    kcalPerMin: calculateCardioKcalPerMinute(weightKg, activity.met),
  }), [activity.met, comparisonActivity.met, durationMinutes, weightKg]);
  const comparison = useMemo(() => buildCardioComparison(weightKg, activityKey, comparisonActivityKey), [activityKey, comparisonActivityKey, weightKg]);

  const actionPayload = {
    activityKey,
    comparisonActivityKey,
    durationMinutes,
    patientId: overview.client.id,
    planId: plan?.id ?? "",
    targetZone,
    weeklyTargetMinutes,
    weightKg,
  };

  function runAction(action: () => Promise<{ error?: string; message?: string; ok: boolean }>) {
    startTransition(() => {
      void action().then((result) => {
        setMessage(result.ok ? result.message ?? "Atualizado." : result.error ?? "Não foi possível concluir a ação.");
        if (result.ok) router.refresh();
      });
    });
  }

  function saveCalculation() {
    if (!plan) return;
    runAction(() => saveClientCardioCalculation(actionPayload));
  }

  function applyCalculation() {
    if (!plan) return;
    runAction(() => applyClientCardioCalculation(actionPayload));
  }

  return (
    <main className="min-h-screen bg-[#07131c] pb-12 text-white">
      <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
        <PartnerClientProfileHeader activeTab="cardio" overview={overview} />

        <section className="mt-8 grid gap-4 lg:grid-cols-4">
          <KpiCard Icon={Target} label="Meta semanal" meta="minutos planejados" value={`${cardio.weekSummary.targetMinutes} min`} />
          <KpiCard Icon={Clock3} label="Realizado na semana" meta={`${cardio.weekSummary.progressPct}% da meta`} progress={cardio.weekSummary.progressPct} value={`${cardio.weekSummary.completedMinutes} min`} />
          <KpiCard Icon={Flame} label="Kcal estimadas" meta="semana atual" value={`${formatNumber(cardio.weekSummary.estimatedKcal)} kcal`} />
          <KpiCard Icon={HeartPulse} label="Zona predominante" meta="por sessões registradas" value={`${cardio.weekSummary.targetZoneLabel} ${zonePercentLabels[cardio.weekSummary.targetZone]}`} />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)_300px]">
          <section className={cn(panelClass, "p-5")}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[18px] font-bold text-white">Calculadora de Cardio</h2>
                <p className="mt-1 text-[12px] leading-5 text-[#8b92a3]">Ajuste peso, duração, atividade e zona-alvo.</p>
              </div>
              <span className="flex size-9 items-center justify-center rounded-[9px] bg-[#082a43] text-[#68afe9]">
                <Activity className="size-4" />
              </span>
            </div>

            {!plan ? (
              <div className="mt-6 rounded-[8px] border border-[#303746] bg-[#0b1823] p-4 text-[13px] text-[#d8e5ee]">
                Nenhum plano de Cardio ativo para este Cliente.
              </div>
            ) : null}

            <div className="mt-6 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Peso corporal">
                  <input className={inputClass} inputMode="decimal" min={20} step="0.1" type="number" value={weightKg} onChange={(event) => setWeightKg(Number(event.target.value))} />
                </Field>
                <Field label="Meta semanal">
                  <input className={inputClass} inputMode="numeric" min={0} step={5} type="number" value={weeklyTargetMinutes} onChange={(event) => setWeeklyTargetMinutes(Number(event.target.value))} />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Duração do cálculo">
                  <input className={inputClass} inputMode="numeric" min={1} step={5} type="number" value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} />
                </Field>
                <Field label="Zona-alvo">
                  <select className={inputClass} value={targetZone} onChange={(event) => setTargetZone(event.target.value as CardioZoneKey)}>
                    {zoneOptions.map((zone) => <option key={zone} value={zone}>{cardioZoneLabels[zone]}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Tipo de atividade">
                <select className={inputClass} value={activityKey} onChange={(event) => setActivityKey(event.target.value as CardioActivityKey)}>
                  {cardioActivityOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
                </select>
              </Field>
              <Field label="Atividade para comparação">
                <select className={inputClass} value={comparisonActivityKey} onChange={(event) => setComparisonActivityKey(event.target.value as CardioActivityKey)}>
                  {cardioActivityOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
                </select>
              </Field>

              <div className="grid gap-3">
                <ActivityCard active activity={activity} />
                <ActivityCard activity={comparisonActivity} />
              </div>

              <div className="grid gap-2">
                <ActionButton disabled={pending || !plan} tone="primary" onClick={() => setMessage("Cálculo atualizado.")}>
                  <Activity className="size-4" />
                  Calcular
                </ActionButton>
                <div className="grid gap-2 sm:grid-cols-2">
                  <ActionButton disabled={pending || !plan} onClick={saveCalculation}>
                    <Save className="size-4" />
                    Salvar cálculo
                  </ActionButton>
                  <ActionButton disabled={pending || !plan} onClick={applyCalculation}>
                    <Send className="size-4" />
                    Calcular e aplicar plano
                  </ActionButton>
                </div>
                {message ? <p className="text-[12px] font-semibold text-[#8fcfff]">{message}</p> : null}
              </div>
            </div>
          </section>

          <section className={cn(panelClass, "p-5")}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-[18px] font-bold text-white">Comparativo Calórico</h2>
                <p className="mt-1 text-[12px] text-[#8b92a3]">Estimativa por duração usando MET e peso atual.</p>
              </div>
              <span className="rounded-[999px] border border-[#2f82bf]/45 px-3 py-1 text-[12px] font-semibold text-[#8fcfff]">
                {formatNumber(weightKg, 1)} kg
              </span>
            </div>
            <ComparisonChart comparison={comparison} comparisonLabel={comparisonActivity.label} primaryLabel={activity.label} />
          </section>

          <aside className={cn(panelClass, "p-5")}>
            <h2 className="text-[18px] font-bold text-white">Resumo do Cálculo</h2>
            <div className="mt-5 flex justify-center">
              <div className="flex size-32 flex-col items-center justify-center rounded-full border border-[#2f82bf]/50 bg-[#0a2233]">
                <Flame className="size-7 text-[#68afe9]" />
                <span className="mt-2 text-[24px] font-bold leading-7 text-white">{calculation.kcal}</span>
                <span className="text-[11px] font-semibold uppercase text-[#8b92a3]">kcal</span>
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-[13px]">
              <div className="flex items-center justify-between gap-4 rounded-[8px] bg-[#0b1823] p-3">
                <span className="text-[#8b92a3]">{activity.label}</span>
                <strong className="text-white">{calculation.kcal} kcal</strong>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-[8px] bg-[#0b1823] p-3">
                <span className="text-[#8b92a3]">{comparisonActivity.label}</span>
                <strong className="text-white">{calculation.comparisonKcal} kcal</strong>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[8px] bg-[#0b1823] p-3">
                  <p className="text-[11px] uppercase text-[#6f7c89]">kcal/min</p>
                  <p className="mt-1 text-[18px] font-bold text-white">{formatNumber(calculation.kcalPerMin, 1)}</p>
                </div>
                <div className="rounded-[8px] bg-[#0b1823] p-3">
                  <p className="text-[11px] uppercase text-[#6f7c89]">Zona-alvo</p>
                  <p className="mt-1 text-[18px] font-bold text-white">{cardioZoneLabels[targetZone]}</p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className={cn(panelClass, "overflow-hidden")}>
            <div className="border-b border-[#263846] p-5">
              <h2 className="text-[18px] font-bold text-white">Zonas de Frequência Cardíaca</h2>
              <p className="mt-1 text-[12px] text-[#8b92a3]">
                FCmáx estimada em {cardio.patient.maxHeartRate} bpm{cardio.patient.ageYears ? ` para ${cardio.patient.ageYears} anos` : ""}.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
                <thead className="text-[11px] uppercase tracking-[0.08em] text-[#6f7c89]">
                  <tr className="border-b border-[#263846]">
                    <th className="px-5 py-3 font-semibold">Zona</th>
                    <th className="px-5 py-3 font-semibold">%FCmáx</th>
                    <th className="px-5 py-3 font-semibold">BPM</th>
                    <th className="px-5 py-3 font-semibold">Descrição</th>
                    <th className="px-5 py-3 font-semibold">Objetivo</th>
                  </tr>
                </thead>
                <tbody>
                  {cardio.heartRateZones.map((zone) => (
                    <tr className={cn("border-b border-[#263846]/80 last:border-0", zone.key === targetZone ? "bg-[#0d2b43]" : "")} key={zone.key}>
                      <td className="px-5 py-4 font-bold text-[#8fcfff]">{zone.label}</td>
                      <td className="px-5 py-4 text-[#d8e5ee]">{zone.percentLabel}</td>
                      <td className="px-5 py-4 text-white">{zone.bpmRangeLabel}</td>
                      <td className="px-5 py-4 text-[#d8e5ee]">{zone.description}</td>
                      <td className="px-5 py-4 text-[#8b92a3]">{zone.objective}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className={cn(panelClass, "p-5")}>
            <h2 className="text-[18px] font-bold text-white">Sessões da semana</h2>
            <div className="mt-4 grid gap-3">
              {cardio.sessions.slice(0, 5).map((session) => (
                <div className="rounded-[8px] border border-[#263846] bg-[#0b1823] p-3" key={session.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-bold text-white">{session.activity.label}</p>
                      <p className="mt-1 text-[12px] text-[#8b92a3]">{session.dateLabel} · {session.durationMinutes} min · {session.kcalEstimate} kcal</p>
                    </div>
                    {plan ? (
                      <button
                        aria-label={`Remover sessão ${session.activity.label}`}
                        className="flex size-8 items-center justify-center rounded-[8px] border border-[#303746] text-[#8b92a3] transition hover:border-[#ef626c] hover:text-[#ef626c]"
                        disabled={pending}
                        type="button"
                        onClick={() => runAction(() => removeClientCardioSession({
                          patientId: overview.client.id,
                          planId: plan.id,
                          sessionId: session.id,
                        }))}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
              {cardio.sessions.length === 0 ? (
                <p className="rounded-[8px] border border-[#263846] bg-[#0b1823] p-4 text-[13px] text-[#8b92a3]">Nenhuma sessão registrada.</p>
              ) : null}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
