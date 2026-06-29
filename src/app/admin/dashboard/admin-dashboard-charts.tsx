"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  DashboardGrowthPoint,
  DashboardPlanSlice,
} from "@/lib/admin/dashboard-metrics";

type GrowthChartProps = {
  data: DashboardGrowthPoint[];
};

type PlanDistributionChartProps = {
  data: DashboardPlanSlice[];
};

export function GrowthChart({ data }: GrowthChartProps) {
  return (
    <div className="h-[300px] w-full" data-testid="growth-chart">
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart data={data} margin={{ bottom: 0, left: -18, right: 8, top: 16 }}>
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
      </ResponsiveContainer>
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
        <ResponsiveContainer height="100%" width="100%">
          <PieChart>
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
        </ResponsiveContainer>
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
