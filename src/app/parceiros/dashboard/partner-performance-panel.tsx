"use client";

import { Activity, ChevronDown, CircleDollarSign, UsersRound } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { PerformanceTrendChart } from "./partner-dashboard-charts";
import type {
  PartnerDashboardData,
  PartnerPerformanceMetric,
} from "@/lib/partners/dashboard-metrics";
import { cn } from "@/lib/utils";

type PartnerPerformancePanelProps = {
  dashboard: PartnerDashboardData;
};

type PerformanceActiveMetric = "averageAdhesion" | "adherentClients" | "monthlyGoal";

const metricIcons: Record<PartnerPerformanceMetric["icon"], typeof Activity> = {
  activity: Activity,
  dollar: CircleDollarSign,
  users: UsersRound,
};

const metricActiveStates: Record<PartnerPerformanceMetric["id"], PerformanceActiveMetric> = {
  adherenceRate: "averageAdhesion",
  adherentClients: "adherentClients",
  adherenceTarget: "monthlyGoal",
};

const activeMetricIds: Record<PerformanceActiveMetric, PartnerPerformanceMetric["id"]> = {
  adherentClients: "adherentClients",
  averageAdhesion: "adherenceRate",
  monthlyGoal: "adherenceTarget",
};

const outlineIndexes: Record<PerformanceActiveMetric, 0 | 1 | 2> = {
  adherentClients: 1,
  averageAdhesion: 0,
  monthlyGoal: 2,
};

function buildSelectionPath({
  cardIndex,
  cardLayout,
  contentInset,
  firstCardTop,
  panelRadius,
  viewBoxWidth,
}: {
  cardIndex: 0 | 1 | 2;
  cardLayout: "columns" | "stack";
  contentInset: number;
  firstCardTop: number;
  panelRadius: number;
  viewBoxWidth: number;
}) {
  const inset = 3;
  const contentLeft = contentInset;
  const contentRight = viewBoxWidth - contentInset;
  const contentWidth = contentRight - contentLeft;
  const cardHeight = 96;
  const cardGap = cardLayout === "columns" ? 20 : 16;
  const cardWidth = cardLayout === "columns" ? (contentWidth - cardGap * 2) / 3 : contentWidth;
  const cardLeft =
    cardLayout === "columns" ? contentLeft + cardIndex * (cardWidth + cardGap) : contentLeft;
  const cardTop =
    cardLayout === "columns" ? firstCardTop : firstCardTop + cardIndex * (cardHeight + cardGap);
  const cardRight = cardLeft + cardWidth;
  const cardBottom = cardTop + cardHeight;
  const x1 = inset;
  const y1 = inset;
  const x2 = viewBoxWidth - inset;
  const panelR = panelRadius;
  const cardR = 20;
  const baselineY = cardTop - 15;
  const transitionWidth = cardLayout === "columns" ? 34 : 26;
  const connectsLeftEdge = cardLayout === "stack" || cardIndex === 0;
  const connectsRightEdge = cardLayout === "stack" || cardIndex === 2;
  const leftShoulder = connectsLeftEdge ? x1 : cardLeft - transitionWidth;
  const rightShoulder = connectsRightEdge ? x2 : cardRight + transitionWidth;
  const leftCornerStart = connectsLeftEdge ? x1 : x1 + panelR;
  const rightCornerEnd = connectsRightEdge ? x2 : x2 - panelR;
  const transitionControlY = baselineY + 2;
  const cardSideStartY = cardTop + 18;
  const rightCornerControlX = connectsRightEdge ? x2 : rightCornerEnd + 12;
  const rightCornerControlY = connectsRightEdge ? baselineY - 6 : baselineY;
  const rightTransitionControlX = connectsRightEdge ? x2 : cardRight + 14;
  const rightTransitionControlY = connectsRightEdge ? baselineY + 10 : transitionControlY;
  const leftTransitionControlX = connectsLeftEdge ? x1 : cardLeft - 14;
  const leftTransitionControlY = connectsLeftEdge ? baselineY + 10 : transitionControlY;
  const leftCornerControlX = connectsLeftEdge ? x1 : leftCornerStart - 12;
  const leftCornerControlY = connectsLeftEdge ? baselineY - 6 : baselineY;
  const leftCornerInnerY = connectsLeftEdge ? baselineY - 14 : baselineY - 12;

  return [
    `M ${x1 + panelR} ${y1}`,
    `H ${x2 - panelR}`,
    `C ${x2 - 12} ${y1} ${x2} ${y1 + 12} ${x2} ${y1 + panelR}`,
    `V ${baselineY - panelR}`,
    `C ${x2} ${baselineY - 14} ${rightCornerControlX} ${rightCornerControlY} ${rightCornerEnd} ${baselineY}`,
    `H ${rightShoulder}`,
    `C ${rightTransitionControlX} ${rightTransitionControlY} ${cardRight} ${cardTop + 2} ${cardRight} ${cardSideStartY}`,
    `V ${cardBottom - cardR}`,
    `A ${cardR} ${cardR} 0 0 1 ${cardRight - cardR} ${cardBottom}`,
    `H ${cardLeft + cardR}`,
    `A ${cardR} ${cardR} 0 0 1 ${cardLeft} ${cardBottom - cardR}`,
    `V ${cardSideStartY}`,
    `C ${cardLeft} ${cardTop + 2} ${leftTransitionControlX} ${leftTransitionControlY} ${leftShoulder} ${baselineY}`,
    `H ${leftCornerStart}`,
    `C ${leftCornerControlX} ${leftCornerControlY} ${x1} ${leftCornerInnerY} ${x1} ${baselineY - panelR}`,
    `V ${y1 + panelR}`,
    `C ${x1} ${y1 + 12} ${x1 + 12} ${y1} ${x1 + panelR} ${y1}`,
    "Z",
  ].join(" ");
}

function PerformanceOutline({ activeMetric }: { activeMetric: PerformanceActiveMetric }) {
  const activeIndex = outlineIndexes[activeMetric];
  const [compactLayout, setCompactLayout] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!window.matchMedia) return undefined;

    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const updateLayout = () => setCompactLayout(mediaQuery.matches);

    updateLayout();
    mediaQuery.addEventListener("change", updateLayout);

    return () => mediaQuery.removeEventListener("change", updateLayout);
  }, []);

  const path = buildSelectionPath(
    compactLayout
      ? {
          cardIndex: activeIndex,
          cardLayout: "stack",
          contentInset: 20,
          firstCardTop: 375,
          panelRadius: 28,
          viewBoxWidth: 344,
        }
      : {
          cardIndex: activeIndex,
          cardLayout: "columns",
          contentInset: 24,
          firstCardTop: 323,
          panelRadius: 28,
          viewBoxWidth: 1000,
        },
  );

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
      data-active-metric={activeMetric}
      data-layout={compactLayout ? "stack" : "columns"}
      data-testid="performance-outline"
      preserveAspectRatio="none"
      viewBox={compactLayout ? "0 0 344 715" : "0 0 1000 462"}
    >
      <motion.path
        animate={reduceMotion ? undefined : { d: path }}
        data-testid="performance-outline-path"
        d={path}
        fill="none"
        initial={false}
        stroke="#4AA3E8"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

function PerformanceMetricCard({
  metric,
  onSelect,
  selected,
}: {
  metric: PartnerPerformanceMetric;
  onSelect: () => void;
  selected: boolean;
}) {
  const Icon = metricIcons[metric.icon];

  return (
    <button
      aria-pressed={selected}
      className={cn(
        "relative flex min-h-[96px] min-w-0 items-center gap-4 rounded-[10px] px-4 text-left transition-all duration-300",
        selected
          ? "bg-[#153d5d]/78 shadow-[0_18px_40px_rgba(12,56,88,0.24)]"
          : "bg-[#061827] hover:bg-[#082135]",
      )}
      data-selected={selected ? "true" : "false"}
      data-testid={`partner-performance-card-${metric.id}`}
      type="button"
      onClick={onSelect}
    >
      <span
        className={cn(
          "flex size-14 shrink-0 items-center justify-center rounded-[12px] transition-colors duration-300",
          selected ? "bg-[#3e9be9] text-white" : "bg-[#0a2c48] text-[#68afe9]",
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className={cn("block text-[25px] font-bold leading-8 transition-colors duration-300", selected ? "text-white" : "text-[#dce9f3]")}>{metric.value}</span>
        <span className={cn("mt-1 block text-[12px] leading-4 transition-colors duration-300", selected ? "text-[#dce9f3]" : "text-[#a8b6c2]")}>{metric.label}</span>
      </span>
    </button>
  );
}

export function PartnerPerformancePanel({ dashboard }: PartnerPerformancePanelProps) {
  const [activeMetric, setActiveMetric] = useState<PerformanceActiveMetric>("averageAdhesion");
  const selectedMetric = useMemo(
    () =>
      dashboard.performanceMetrics.find((metric) => metric.id === activeMetricIds[activeMetric]) ??
      dashboard.performanceMetrics[0],
    [activeMetric, dashboard.performanceMetrics],
  );

  return (
    <section className="relative min-w-0 overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_24%_15%,#23699d_0%,#0b2d47_46%,#081f31_100%)] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.22)] lg:h-[462px]">
      <div className="relative z-20">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-4">
          <h2 className="text-[24px] font-bold leading-10 text-white md:text-[32px]">Painel de Performance</h2>
          <button className="inline-flex h-[34px] items-center gap-3 rounded-[8px] bg-[#071827] px-3 text-[14px] font-medium text-[#dbe5ef]" type="button">
            Últimos 6 meses
            <ChevronDown className="size-[18px]" />
          </button>
        </div>

        <div className="mt-5 min-w-0">
          <div className="min-w-0 rounded-[10px] bg-[#0b2233]/10 px-4 pt-2">
            {selectedMetric ? <PerformanceTrendChart data={dashboard.growth} metric={selectedMetric} /> : null}
          </div>

          <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-3">
            {dashboard.performanceMetrics.map((metric) => (
              <PerformanceMetricCard
                key={metric.id}
                metric={metric}
                selected={metric.id === selectedMetric?.id}
                onSelect={() => setActiveMetric(metricActiveStates[metric.id])}
              />
            ))}
          </div>
        </div>
      </div>

      <PerformanceOutline activeMetric={activeMetric} />
    </section>
  );
}
