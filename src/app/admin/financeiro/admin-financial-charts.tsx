"use client";

import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  FinancialBar,
  FinancialPlanSlice,
  FinancialRevenuePoint,
} from "@/lib/admin/financial-metrics";
import { cn } from "@/lib/utils";

function useMeasuredWidth() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const update = () => setWidth(Math.floor(element.getBoundingClientRect().width));
    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

const tooltipStyle = {
  background: "#071b27",
  border: "1px solid #31536a",
  borderRadius: 6,
  color: "#c9d8e3",
};

export function RevenueTrendChart({ data }: { data: FinancialRevenuePoint[] }) {
  const { ref, width } = useMeasuredWidth();

  return (
    <div className="h-[300px] w-full overflow-hidden" data-testid="revenue-trend-chart" ref={ref}>
      {width > 0 ? (
        <AreaChart data={data} height={300} margin={{ bottom: 0, left: -8, right: 8, top: 16 }} width={width}>
          <defs>
            <linearGradient id="mrrGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#15c8c3" stopOpacity={0.32} />
              <stop offset="95%" stopColor="#15c8c3" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="newRevenueGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#2d9cff" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#2d9cff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#294657" strokeDasharray="3 3" vertical={false} />
          <XAxis axisLine={false} dataKey="label" tick={{ fill: "#8798a5", fontSize: 11 }} tickLine={false} />
          <YAxis axisLine={false} tick={{ fill: "#8798a5", fontSize: 11 }} tickFormatter={(value) => `${value}k`} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "#31536a" }} formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR")}`} />
          <Area dataKey="mrr" fill="url(#mrrGradient)" name="MRR" stroke="#15c8c3" strokeWidth={3} type="monotone" />
          <Area dataKey="newRevenue" fill="url(#newRevenueGradient)" name="Receita nova" stroke="#2d9cff" strokeWidth={3} type="monotone" />
        </AreaChart>
      ) : null}
    </div>
  );
}

export function FinancialPlanChart({ data }: { data: FinancialPlanSlice[] }) {
  const { ref, width } = useMeasuredWidth();
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (data.length === 0) {
    return <EmptyChart label="Sem assinaturas ativas por plano" />;
  }

  const isHorizontal = width >= 500;
  const fallbackChartSize = isHorizontal ? 180 : 164;
  const chartSize = width > 0
    ? Math.min(180, Math.max(144, Math.floor(width * (isHorizontal ? 0.34 : 0.5))))
    : fallbackChartSize;
  const innerRadius = Math.round(chartSize * 0.3);
  const outerRadius = Math.round(chartSize * 0.46);

  return (
    <div
      className={cn(
        "grid min-w-0 gap-5",
        isHorizontal
          ? "grid-cols-[minmax(144px,180px)_minmax(0,1fr)] items-center"
          : "grid-cols-1 justify-items-center",
      )}
      data-layout={isHorizontal ? "horizontal" : "stacked"}
      data-testid="financial-plan-chart"
      ref={ref}
    >
      <div className="relative shrink-0" style={{ height: chartSize, width: chartSize }}>
        <PieChart height={chartSize} width={chartSize}>
          <Pie cx="50%" cy="50%" data={data} dataKey="value" innerRadius={innerRadius} outerRadius={outerRadius} paddingAngle={3}>
            {data.map((item) => <Cell fill={item.color} key={item.label} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[24px] font-bold leading-7 text-[#f1f6fa]">{total}</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8195a4]">total</span>
        </div>
      </div>
      <div className="w-full min-w-0 space-y-3 self-center">
        {data.map((item) => (
          <div className="space-y-1" key={item.label}>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-[13px]">
              <span className="inline-flex min-w-0 items-start gap-2 text-[#a1b0bb]">
                <span className="mt-[5px] size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="min-w-0 break-words leading-[18px]" title={item.label}>{item.label}</span>
              </span>
              <span className="shrink-0 font-bold text-[#dde7ee]">{item.count}</span>
            </div>
            <p className="text-[11px] text-[#748999]">{item.percent}% das assinaturas</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value / 100);
}

export function HorizontalBars({ data }: { data: FinancialBar[] }) {
  if (data.length === 0) {
    return <EmptyChart label="Sem dados no período" />;
  }

  return (
    <div className="space-y-4" data-testid="financial-bars">
      {data.map((item) => (
        <div className="space-y-1.5" key={item.label}>
          <div className="flex items-center justify-between gap-3 text-[12px]">
            <span className="truncate font-semibold text-[#a9bac5]">{item.label}</span>
            <span className="shrink-0 text-[#dce7ed]">{formatCurrency(item.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#183443]">
            <span className="block h-full rounded-full" style={{ backgroundColor: item.color, width: `${Math.max(item.percent, item.value > 0 ? 6 : 0)}%` }} />
          </div>
          <p className="text-[11px] text-[#718795]">{item.percent}% do total</p>
        </div>
      ))}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[180px] items-center justify-center rounded-[8px] border border-dashed border-[#31536a] text-sm text-[#8ca1af]">
      {label}
    </div>
  );
}
