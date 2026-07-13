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
  DashboardGrowthPoint,
  DashboardPlanSlice,
  DashboardProfessionalStatusSlice,
} from "@/lib/admin/dashboard-metrics";

type GrowthChartProps = {
  data: DashboardGrowthPoint[];
};

type PlanDistributionChartProps = {
  data: DashboardPlanSlice[];
};

type ProfessionalStatusChartProps = {
  data: DashboardProfessionalStatusSlice[];
};

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

export function GrowthChart({ data }: GrowthChartProps) {
  const { ref, width } = useMeasuredWidth();
  const chartWidth = Math.max(width, 320);

  return (
    <div className="h-[300px] w-full overflow-hidden" data-testid="growth-chart" ref={ref}>
      {width > 0 ? (
        <AreaChart data={data} height={300} margin={{ bottom: 0, left: -18, right: 8, top: 16 }} width={chartWidth}>
            <defs>
              <linearGradient id="clientsGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#15c8c3" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#15c8c3" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="partnersGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#2d9cff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2d9cff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#294657" strokeDasharray="3 3" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="label"
              tick={{ fill: "#8798a5", fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tick={{ fill: "#8798a5", fontSize: 11 }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#071b27",
                border: "1px solid #31536a",
                borderRadius: 6,
                color: "#c9d8e3",
              }}
              cursor={{ stroke: "#31536a" }}
            />
            <Area
              dataKey="activeClients"
              fill="url(#clientsGradient)"
              name="Clientes"
              stroke="#15c8c3"
              strokeWidth={3}
              type="monotone"
            />
            <Area
              dataKey="activePartners"
              fill="url(#partnersGradient)"
              name="Parceiros"
              stroke="#2d9cff"
              strokeWidth={3}
              type="monotone"
            />
          </AreaChart>
      ) : null}
    </div>
  );
}

export function PlanDistributionChart({ data }: PlanDistributionChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-[8px] border border-dashed border-[#31536a] text-sm text-[#8ca1af]">
        Sem assinaturas ativas por plano
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-[180px_1fr]" data-testid="plan-chart">
      <div className="h-[180px]">
        <PieChart height={180} width={180}>
          <Pie
            cx="50%"
            cy="50%"
            data={data}
            dataKey="value"
            innerRadius={52}
            outerRadius={82}
            paddingAngle={3}
          >
            {data.map((item) => (
              <Cell fill={item.color} key={item.label} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#071b27",
              border: "1px solid #31536a",
              borderRadius: 6,
              color: "#c9d8e3",
            }}
          />
        </PieChart>
      </div>
      <div className="space-y-3 self-center">
        {data.map((item) => (
          <div className="flex items-center justify-between gap-3" key={item.label}>
            <span className="inline-flex items-center gap-2 text-[13px] text-[#a1b0bb]">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
            <span className="text-[13px] font-bold text-[#dde7ee]">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfessionalStatusChart({ data }: ProfessionalStatusChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-[8px] border border-dashed border-[#31536a] text-sm text-[#8ca1af]">
        Sem profissionais cadastrados
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-[180px_1fr]" data-testid="professional-status-chart">
      <div className="relative h-[180px]">
        <PieChart height={180} width={180}>
          <Pie
            cx="50%"
            cy="50%"
            data={data}
            dataKey="value"
            innerRadius={54}
            outerRadius={82}
            paddingAngle={3}
          >
            {data.map((item) => (
              <Cell fill={item.color} key={item.id} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#071b27",
              border: "1px solid #31536a",
              borderRadius: 6,
              color: "#c9d8e3",
            }}
          />
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[24px] font-bold leading-7 text-[#f1f6fa]">{total}</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8195a4]">total</span>
        </div>
      </div>
      <div className="space-y-3 self-center">
        {data.map((item) => {
          const percent = total === 0 ? 0 : Math.round((item.count / total) * 100);

          return (
            <div className="space-y-1.5" key={item.id}>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-[13px] text-[#a1b0bb]">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
                <span className="text-[13px] font-bold text-[#dde7ee]">{item.count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#183443]">
                <span
                  className="block h-full rounded-full"
                  style={{ backgroundColor: item.color, width: `${Math.max(percent, item.count > 0 ? 8 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
