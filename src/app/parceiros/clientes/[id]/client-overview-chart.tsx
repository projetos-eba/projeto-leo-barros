"use client";

import { useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { PartnerClientOverviewData } from "@/lib/partners/client-overview-metrics";

type ClientOverviewChartProps = {
  data: PartnerClientOverviewData["bodyMeasurements"];
};

export function ClientOverviewChart({ data }: ClientOverviewChartProps) {
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

  return (
    <div className="h-[172px] min-w-0 overflow-hidden" data-testid="client-overview-body-chart" ref={ref}>
      {width > 0 && data.length > 0 ? (
        <LineChart data={data} height={172} margin={{ bottom: 8, left: -12, right: 12, top: 8 }} width={Math.max(width, 300)}>
          <CartesianGrid stroke="#31536b" strokeDasharray="4 6" strokeOpacity={0.8} vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="label"
            minTickGap={18}
            tick={{ fill: "#f3f4f6", fontFamily: "Rethink Sans", fontSize: 12 }}
            tickMargin={10}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            domain={["dataMin - 3", "dataMax + 3"]}
            tick={{ fill: "rgba(189,193,202,0.7)", fontFamily: "Rethink Sans", fontSize: 12 }}
            tickLine={false}
            width={42}
          />
          <Tooltip
            contentStyle={{
              background: "#071827",
              border: "1px solid #2f82bf",
              borderRadius: 8,
              color: "#f4f8fb",
              fontFamily: "Rethink Sans",
            }}
            formatter={(value, name) => [`${Number(value).toLocaleString("pt-BR")} kg`, name]}
          />
          <Line dataKey="weightKg" dot={{ fill: "#238bd7", r: 3 }} name="Peso" stroke="#238bd7" strokeWidth={2.5} type="monotone" />
          <Line dataKey="leanMassKg" dot={{ fill: "#5ec66a", r: 3 }} name="Massa magra" stroke="#5ec66a" strokeWidth={2.5} type="monotone" />
          <Line dataKey="fatMassKg" dot={{ fill: "#ff6f7d", r: 3 }} name="Massa gorda" stroke="#ff6f7d" strokeWidth={2.5} type="monotone" />
        </LineChart>
      ) : (
        <div className="flex h-full items-center justify-center text-[13px] text-[#708597]">
          Sem medições no período.
        </div>
      )}
    </div>
  );
}
