"use client";

import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  PartnerAdherenceMetric,
  PartnerDashboardGrowthPoint,
  PartnerPerformanceMetric,
} from "@/lib/partners/dashboard-metrics";

type ClientGrowthChartProps = {
  data: PartnerDashboardGrowthPoint[];
};

type PerformanceTrendChartProps = {
  data: PartnerDashboardGrowthPoint[];
  metric: PartnerPerformanceMetric;
};

type NewPatientsBarChartProps = {
  data: PartnerDashboardGrowthPoint[];
};

type AdherenceRingsProps = {
  data: PartnerAdherenceMetric[];
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

function formatChartValue(value: number, unit: PartnerPerformanceMetric["unit"]) {
  if (unit === "percent") return `${Math.round(value)}%`;
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
}

export function PerformanceTrendChart({ data, metric }: PerformanceTrendChartProps) {
  const { ref, width } = useMeasuredWidth();
  const chartWidth = Math.max(width, 320);
  const isPercent = metric.unit === "percent";

  return (
    <div className="h-[217px] w-full overflow-hidden" data-testid="partner-performance-trend-chart" ref={ref}>
      {width > 0 ? (
        <AreaChart data={data.slice(-6)} height={217} margin={{ bottom: 0, left: 0, right: 8, top: 6 }} width={chartWidth}>
          <defs>
            <linearGradient id="partnerPerformanceGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#8bc8ff" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#8bc8ff" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2e6387" strokeDasharray="3 4" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="label"
            tick={{ fill: "#a7bbca", fontFamily: "Rethink Sans", fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            domain={isPercent ? [0, 100] : undefined}
            tick={{ fill: "#a7bbca", fontFamily: "Rethink Sans", fontSize: 12 }}
            tickFormatter={(value) => formatChartValue(Number(value), metric.unit)}
            tickLine={false}
            width={42}
          />
          <Tooltip
            contentStyle={{
              background: "#061827",
              border: "1px solid #2f82bf",
              borderRadius: 8,
              color: "#f4f8fb",
              fontFamily: "Rethink Sans",
            }}
            cursor={{ stroke: "#8bc8ff", strokeOpacity: 0.28 }}
            formatter={(value) => [formatChartValue(Number(value), metric.unit), metric.label]}
            labelStyle={{ color: "#8bc8ff", fontWeight: 700 }}
          />
          <Area
            activeDot={{ fill: "#0f4b78", r: 4, stroke: "#cae7ff", strokeWidth: 2 }}
            dataKey={metric.chartKey}
            fill="url(#partnerPerformanceGradient)"
            name={metric.label}
            stroke="#8bc8ff"
            strokeWidth={3}
            type="monotone"
          />
        </AreaChart>
      ) : null}
    </div>
  );
}

export function ClientGrowthChart({ data }: ClientGrowthChartProps) {
  const { ref, width } = useMeasuredWidth();
  const chartWidth = Math.max(width, 320);

  return (
    <div className="h-[260px] w-full overflow-hidden" data-testid="partner-client-growth-chart" ref={ref}>
      {width > 0 ? (
        <AreaChart data={data} height={260} margin={{ bottom: 8, left: 0, right: 8, top: 16 }} width={chartWidth}>
          <defs>
            <linearGradient id="partnerActiveClientsGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#68afe9" stopOpacity={0.24} />
              <stop offset="100%" stopColor="#68afe9" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2e6387" strokeDasharray="3 4" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="label"
            tick={{ fill: "#a7bbca", fontFamily: "Rethink Sans", fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tick={{ fill: "#a7bbca", fontFamily: "Rethink Sans", fontSize: 12 }}
            tickLine={false}
            width={38}
          />
          <Tooltip
            contentStyle={{
              background: "#061827",
              border: "1px solid #2f82bf",
              borderRadius: 8,
              color: "#f4f8fb",
              fontFamily: "Rethink Sans",
            }}
            cursor={{ stroke: "#68afe9", strokeOpacity: 0.22 }}
          />
          <Area
            dataKey="activeClients"
            fill="url(#partnerActiveClientsGradient)"
            name="Clientes ativos"
            stroke="#68afe9"
            strokeWidth={3}
            type="monotone"
          />
        </AreaChart>
      ) : null}
    </div>
  );
}

export function NewPatientsBarChart({ data }: NewPatientsBarChartProps) {
  const { ref, width } = useMeasuredWidth();
  const chartWidth = Math.max(width, 220);

  return (
    <div className="h-[142px] w-full overflow-hidden" data-testid="partner-new-patients-chart" ref={ref}>
      {width > 0 ? (
        <BarChart data={data.slice(-6)} height={142} margin={{ bottom: 0, left: -24, right: 4, top: 8 }} width={chartWidth}>
          <CartesianGrid stroke="#162e40" strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#b3c3cf", fontFamily: "Rethink Sans", fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: "#4d6374", fontFamily: "Rethink Sans", fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "#061827",
              border: "1px solid #2f82bf",
              borderRadius: 8,
              color: "#f4f8fb",
              fontFamily: "Rethink Sans",
            }}
          />
          <Bar dataKey="newClients" fill="#3d83f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : null}
    </div>
  );
}

export function AdherenceRings({ data }: AdherenceRingsProps) {
  return (
    <div className="grid grid-cols-2 divide-x divide-[#15293a]" data-testid="partner-adherence-rings">
      {data.map((item) => {
        const value = Math.max(0, Math.min(100, Number.isFinite(item.value) ? item.value : 0));
        const stroke = item.tone === "green" ? "#61c95f" : "#c7e6ff";
        const track = item.tone === "green" ? "#15472d" : "#143b61";
        const radius = 31;
        const circumference = 2 * Math.PI * radius;
        const dashOffset = circumference - (value / 100) * circumference;

        return (
          <div className="px-3 text-center sm:px-4" key={item.id}>
            <p className="mx-auto min-h-[40px] max-w-[136px] text-left text-[13px] leading-5 text-[#8ca1af]">
              {item.label}
            </p>
            <div
              aria-label={`${item.label}: ${value}%`}
              className="relative mx-auto mt-1 flex size-[84px] items-center justify-center"
            >
              <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 84 84" role="presentation">
                <circle
                  cx="42"
                  cy="42"
                  fill="none"
                  r={radius}
                  stroke={track}
                  strokeWidth="12"
                />
                <circle
                  cx="42"
                  cy="42"
                  fill="none"
                  r={radius}
                  stroke={stroke}
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  strokeWidth="12"
                  style={{ transition: "stroke-dashoffset 360ms ease" }}
                />
              </svg>
              <div className="absolute inset-[17px] rounded-full bg-[#071b28]" />
              <span className="relative text-[20px] font-bold leading-7 text-white">{value}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
