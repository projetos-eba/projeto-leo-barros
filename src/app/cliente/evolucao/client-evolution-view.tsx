"use client";

import { Camera, CalendarDays, ChevronDown, Dumbbell, Info, Scale, TrendingUp, Users, Utensils } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { WorkoutMuscleMap } from "@/components/workouts/muscle-map";
import type { ClientEvolutionData, EvolutionComparisonRow, EvolutionMetricCard } from "@/lib/clients/evolution-metrics";
import { photoAngles, type PhotoAngle } from "@/lib/partners/client-photos-metrics";
import { cn } from "@/lib/utils";

type ClientEvolutionViewProps = {
  evolution: ClientEvolutionData | null;
};

const panelClass = "rounded-[10px] border border-[#1d3445] bg-[linear-gradient(145deg,rgba(15,31,43,0.98),rgba(6,18,27,0.96))] shadow-[0_18px_44px_rgba(0,0,0,0.22)]";
const accentClasses: Record<EvolutionMetricCard["accent"], string> = {
  blue: "border-[#155f93] text-[#64bbff]",
  green: "border-[#195f3b] text-[#4ade80]",
  red: "border-[#5f2630] text-[#fb7185]",
  violet: "border-[#4c3a91] text-[#a78bfa]",
  yellow: "border-[#755f1d] text-[#facc15]",
};

function formatNumber(value: number, suffix = "") {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}${suffix}`;
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-[8px] border border-dashed border-[#244050] px-4 text-center text-[13px] text-[#8fa3b4]">
      {children}
    </div>
  );
}

function MetricCard({ card, icon }: { card: EvolutionMetricCard; icon: ReactNode }) {
  return (
    <article className={cn(panelClass, "min-h-[104px] p-4", accentClasses[card.accent])}>
      <div className="flex items-center gap-2 text-[12px] text-[#91a8b9]">
        {icon}
        <span>{card.label}</span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-[26px] font-bold leading-8 text-white">{card.value}</p>
        <span className={cn("rounded-[5px] px-2 py-1 text-[10px] font-bold", card.positive === false ? "bg-[#35171d] text-[#ff8d98]" : card.positive === true ? "bg-[#10331f] text-[#54d982]" : "bg-[#142333] text-[#8fa3b4]")}>
          {card.deltaLabel}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-[#607586]">{card.helper}</p>
    </article>
  );
}

function ComparisonList({ rows }: { rows: EvolutionComparisonRow[] }) {
  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div className="grid grid-cols-[1fr_auto] items-center gap-4" key={row.label}>
          <div className="flex items-center gap-3">
            <span className={cn("flex size-8 items-center justify-center rounded-[6px] border bg-[#0b2233]", accentClasses[row.accent])}>
              <TrendingUp className="size-4" />
            </span>
            <div>
              <p className="text-[12px] font-semibold text-[#9eb0bd]">{row.label}</p>
              <p className="text-[13px] text-white">{row.current}</p>
            </div>
          </div>
          <p className="text-right text-[12px] font-bold text-[#58d881]">{row.variation}</p>
        </div>
      ))}
    </div>
  );
}

function AnthroChart({ evolution }: { evolution: ClientEvolutionData }) {
  if (evolution.anthropometry.points.length === 0) return <EmptyState>Nenhuma avaliação antropométrica registrada ainda.</EmptyState>;
  return (
    <div className="h-[310px]">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart data={evolution.anthropometry.points} margin={{ bottom: 10, left: -18, right: 14, top: 16 }}>
          <CartesianGrid stroke="#173246" strokeDasharray="3 5" />
          <XAxis dataKey="label" tick={{ fill: "#8fa3b4", fontFamily: "Rethink Sans", fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fill: "#5f7485", fontFamily: "Rethink Sans", fontSize: 11 }} tickLine={false} />
          <Tooltip contentStyle={{ background: "#071923", border: "1px solid #2f82bf", borderRadius: 8, color: "#fff" }} />
          <Line dataKey="weightKg" dot stroke="#3b97e3" strokeWidth={2} name="Peso" />
          <Line dataKey="bodyFatPercentage" dot stroke="#ef4444" strokeWidth={2} name="% gordura" />
          <Line dataKey="muscleMassKg" dot stroke="#22c55e" strokeWidth={2} name="Massa muscular" />
          <Line dataKey="fatMassKg" dot stroke="#f59e0b" strokeWidth={2} name="Massa gorda" />
          <Line dataKey="bodySatisfaction" dot stroke="#8b5cf6" strokeWidth={2} name="Satisfação" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function WorkoutChart({ evolution }: { evolution: ClientEvolutionData }) {
  if (evolution.workout.performance.length === 0) return <EmptyState>Nenhum treino concluído no período.</EmptyState>;
  return (
    <div className="h-[300px]">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart data={evolution.workout.performance} margin={{ bottom: 8, left: -12, right: 16, top: 16 }}>
          <CartesianGrid stroke="#173246" strokeDasharray="3 5" />
          <XAxis dataKey="label" tick={{ fill: "#8fa3b4", fontFamily: "Rethink Sans", fontSize: 11 }} tickLine={false} />
          <YAxis yAxisId="volume" tick={{ fill: "#5f7485", fontFamily: "Rethink Sans", fontSize: 11 }} tickLine={false} />
          <YAxis orientation="right" yAxisId="pse" tick={{ fill: "#fb7185", fontFamily: "Rethink Sans", fontSize: 11 }} tickLine={false} />
          <Tooltip contentStyle={{ background: "#071923", border: "1px solid #2f82bf", borderRadius: 8, color: "#fff" }} />
          <Line dataKey="volumeKg" name="Volume" stroke="#3b82f6" strokeWidth={2} type="monotone" yAxisId="volume" />
          <Line dataKey="pse" name="PSE" stroke="#ef4444" strokeWidth={2} type="monotone" yAxisId="pse" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function NutritionChart({ evolution }: { evolution: ClientEvolutionData }) {
  if (evolution.nutrition.balance.length === 0) return <EmptyState>Nenhum registro alimentar no período.</EmptyState>;
  return (
    <div className="h-[320px]">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart data={evolution.nutrition.balance} margin={{ bottom: 8, left: -8, right: 16, top: 16 }}>
          <CartesianGrid stroke="#173246" strokeDasharray="3 5" />
          <XAxis dataKey="label" tick={{ fill: "#8fa3b4", fontFamily: "Rethink Sans", fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fill: "#5f7485", fontFamily: "Rethink Sans", fontSize: 11 }} tickLine={false} />
          <Tooltip contentStyle={{ background: "#071923", border: "1px solid #2f82bf", borderRadius: 8, color: "#fff" }} />
          <Line dataKey="targetKcal" name="Gasto/Meta" stroke="#3b82f6" strokeWidth={2} />
          <Line dataKey="consumedKcal" name="Ingestão" stroke="#f59e0b" strokeWidth={2} />
          <Line dataKey="balanceKcal" name="Balanço" stroke="#06b6d4" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PhotosSection({ evolution }: { evolution: ClientEvolutionData }) {
  const [beforeId, setBeforeId] = useState(evolution.photos.comparison.before?.id ?? "");
  const [afterId, setAfterId] = useState(evolution.photos.comparison.after?.id ?? "");
  const [angle, setAngle] = useState<PhotoAngle>("front");
  const before = evolution.photos.sessions.find((session) => session.id === beforeId) ?? evolution.photos.comparison.before;
  const after = evolution.photos.sessions.find((session) => session.id === afterId) ?? evolution.photos.comparison.after;
  const photoPairs = [["Antes", before] as const, ["Depois", after] as const];

  return (
    <section className={cn(panelClass, "p-5 lg:p-8")}>
      <div className="border-b border-[#142d3e] pb-5">
        <div className="flex items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-[10px] bg-[#0a2c48] text-[#64bbff]"><Camera className="size-5" /></span>
          <div>
            <h2 className="text-[22px] font-bold text-white">Evolução Visual com Fotos</h2>
            <p className="mt-1 text-[13px] text-[#8fa3b4]">Compare mudanças reais no seu físico ao longo do tempo.</p>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[315px_minmax(0,1fr)]">
        <aside>
          <h3 className="text-[14px] font-bold text-white">Sessões registradas</h3>
          <div className="mt-4 space-y-3">
            {evolution.photos.sessions.map((session) => (
              <button
                className={cn("flex w-full items-center justify-between rounded-[8px] border px-4 py-3 text-left", after?.id === session.id || before?.id === session.id ? "border-[#2d9cff] bg-[#08243b]" : "border-[#1d3445] bg-[#071923]")}
                key={session.id}
                type="button"
                onClick={() => after?.id === session.id ? setBeforeId(session.id) : setAfterId(session.id)}
              >
                <span>
                  <span className="block text-[13px] font-semibold text-white">{session.capturedDateLabel}</span>
                  <span className="text-[11px] text-[#8fa3b4]">{session.title}</span>
                </span>
                <span className="size-3 rounded-full border border-[#2d9cff]" />
              </button>
            ))}
            {evolution.photos.sessions.length === 0 ? <EmptyState>Nenhuma sessão de fotos registrada.</EmptyState> : null}
          </div>
        </aside>
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] font-bold text-white">Comparação da evolução</p>
            <div className="flex flex-wrap gap-2">
              {photoAngles.map((item) => (
                <button className={cn("rounded-[8px] border px-3 py-2 text-[12px]", angle === item.value ? "border-[#2d9cff] bg-[#0a2c48] text-white" : "border-[#1d3445] text-[#8fa3b4]")} key={item.value} type="button" onClick={() => setAngle(item.value)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {photoPairs.map(([label, session]) => {
              const photo = session?.photosByAngle[angle] ?? null;
              return (
                <div className="min-h-[420px] overflow-hidden rounded-[8px] border border-[#1d3445] bg-[#06131d]" key={label}>
                  <div className="flex items-center justify-between px-4 py-3 text-[12px] font-bold text-[#8fcfff]">
                    <span>{label}</span>
                    <span>{session?.capturedDateLabel ?? "--/--/----"}</span>
                  </div>
                  {photo ? <img alt={`${label} ${photo.angleLabel}`} className="h-[380px] w-full object-cover" src={photo.imageUrl} /> : <EmptyState>Ângulo indisponível.</EmptyState>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ClientEvolutionView({ evolution }: ClientEvolutionViewProps) {
  const icons = [<Scale className="size-4" key="scale" />, <TrendingUp className="size-4" key="trend" />, <Users className="size-4" key="users" />, <TrendingUp className="size-4" key="fat" />, <Info className="size-4" key="info" />];

  const macroStyle = useMemo(() => {
    if (!evolution) return {};
    return {
      background: `linear-gradient(90deg, ${evolution.nutrition.macroDistribution.map((item, index, arr) => {
        const start = arr.slice(0, index).reduce((sum, part) => sum + part.percent, 0);
        const end = start + item.percent;
        return `${item.color} ${start}% ${end}%`;
      }).join(", ")})`,
    };
  }, [evolution]);

  if (!evolution) {
    return <div className="min-h-[calc(100vh-81px)] bg-[#07141d] px-5 py-10 text-white"><EmptyState>Não foi possível carregar sua evolução agora.</EmptyState></div>;
  }

  return (
    <div className="min-h-[calc(100vh-81px)] bg-[#07141d] text-[#f9fafb]">
      <main className="mx-auto w-full max-w-[1440px] px-5 pb-20 pt-10 sm:px-8 lg:px-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[34px] font-bold leading-tight text-white sm:text-[42px]">Minha Evolução</h1>
            <p className="mt-1 text-[14px] text-[#8fa3b4]">Acompanhe seu progresso, consistência e evolução visual.</p>
          </div>
          <button className="inline-flex h-[38px] items-center gap-2 rounded-[8px] border border-[#2b4557] bg-[#102233] px-4 text-[13px] text-[#c9d6e1]" type="button">
            <CalendarDays className="size-4" />
            {evolution.periodLabel}
            <ChevronDown className="size-4" />
          </button>
        </header>

        <section className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {evolution.anthropometry.cards.map((card, index) => <MetricCard card={card} icon={icons[index]} key={card.label} />)}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <div className={cn(panelClass, "p-5")}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[22px] font-bold text-white">Avaliação Antropométrica</h2>
              <div className="flex gap-2 text-[11px] text-[#8fa3b4]"><span>Geral</span><span>Stack</span><span>Radar</span></div>
            </div>
            <AnthroChart evolution={evolution} />
          </div>
          <div className={cn(panelClass, "p-5")}>
            <h3 className="mb-5 text-[15px] font-bold text-white">Resumo comparativo</h3>
            <ComparisonList rows={evolution.anthropometry.comparison} />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-[30px] font-bold text-white">Métricas de Treinamento</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {evolution.workout.metrics.map((card, index) => <MetricCard card={card} icon={index === 0 ? <Dumbbell className="size-4" /> : <TrendingUp className="size-4" />} key={card.label} />)}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <div className={cn(panelClass, "p-5")}><h3 className="text-[18px] font-bold text-white">Desempenho dos treinos</h3><WorkoutChart evolution={evolution} /></div>
            <div className={cn(panelClass, "p-5")}><h3 className="mb-5 text-[15px] font-bold text-white">Resumo comparativo</h3><ComparisonList rows={evolution.workout.summary} /></div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(360px,1fr)]">
            <div className={cn(panelClass, "overflow-x-auto p-5")}>
              <h3 className="text-[16px] font-bold text-white">Programa de treino atual</h3>
              <table className="mt-5 min-w-[640px] w-full text-left text-[13px]">
                <thead className="text-[#728697]"><tr><th className="pb-3">Treino</th><th>Volume de carga</th><th>Séries</th><th>Frequência</th><th>Duração</th></tr></thead>
                <tbody className="divide-y divide-[#142d3e]">
                  {evolution.workout.programRows.map((row) => <tr key={row.letter}><td className="py-4 text-white">{row.letter} · {row.session}</td><td>{row.volumeLabel}</td><td>{row.sets}</td><td>{row.frequencyLabel}</td><td>{row.durationLabel}</td></tr>)}
                </tbody>
              </table>
            </div>
            <WorkoutMuscleMap className="min-h-full" heat={evolution.workout.heat} title="Ênfase muscular" />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-[30px] font-bold text-white">Nutrição & Balanço energético</h2>
          <div className={cn(panelClass, "mt-4 p-5")}>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(360px,1fr)]">
              <div>
                <p className="text-[11px] font-bold uppercase text-[#728697]">Resumo geral</p>
                <div className="mt-3 flex flex-wrap gap-8">
                  <strong className="text-[34px]">{formatNumber(evolution.nutrition.summary.kcal)}</strong>
                  <span className="text-[#22c55e]"><Utensils className="inline size-5" /> {formatNumber(evolution.nutrition.summary.proteinG, " g")} Proteínas</span>
                  <span className="text-[#facc15]">{formatNumber(evolution.nutrition.summary.carbsG, " g")} Carboidratos</span>
                  <span className="text-[#ef4444]">{formatNumber(evolution.nutrition.summary.fatG, " g")} Gorduras</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-[#728697]">Distribuição de macronutrientes</p>
                <div className="mt-4 h-3 rounded-full" style={macroStyle} />
                <div className="mt-5 flex flex-wrap gap-4 text-[12px]">
                  {evolution.nutrition.macroDistribution.map((item) => <span key={item.label} style={{ color: item.color }}>{item.percent}% {item.label}</span>)}
                </div>
              </div>
            </div>
            <h3 className="mt-8 text-[16px] font-bold text-white">Balanço energético</h3>
            <NutritionChart evolution={evolution} />
          </div>
        </section>

        <div className="mt-8"><PhotosSection evolution={evolution} /></div>
      </main>
      <footer className="border-t border-[#1b2b37] bg-[#17232c] px-8 py-10 text-[#728697]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <p className="text-[20px] font-bold text-[#dce8f1]">Leonardo Barros</p>
          <p className="text-[12px]">© 2026 Plataforma Leonardo Barros. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
