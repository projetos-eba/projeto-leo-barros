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
  const chartWidth = Math.max(width, 340);

  return (
    <div className="h-[300px] w-full overflow-hidden" data-testid="revenue-trend-chart" ref={ref}>
      {width > 0 ? (
        <AreaChart data={data} height={300} margin={{ bottom: 0, left: -8, right: 8, top: 16 }} width={chartWidth}>
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
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (data.length === 0) {
    return <EmptyChart label="Sem assinaturas ativas por plano" />;
  }

  return (
    <div className="grid gap-5 md:grid-cols-[180px_1fr]" data-testid="financial-plan-chart">
      <div className="relative h-[180px]">
        <PieChart height={180} width={180}>
          <Pie cx="50%" cy="50%" data={data} dataKey="value" innerRadius={54} outerRadius={82} paddingAngle={3}>
            {data.map((item) => <Cell fill={item.color} key={item.label} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[24px] font-bold leading-7 text-[#f1f6fa]">{total}</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8195a4]">total</span>
        </div>
      </div>
      <div className="space-y-3 self-center">
        {data.map((item) => (
          <div className="space-y-1" key={item.label}>
            <div className="flex items-center justify-between gap-3 text-[13px]">
              <span className="inline-flex min-w-0 items-center gap-2 text-[#a1b0bb]">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="font-bold text-[#dde7ee]">{item.count}</span>
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
