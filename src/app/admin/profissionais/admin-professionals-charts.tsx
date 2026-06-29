"use client";

import { Cell, Pie, PieChart, Tooltip } from "recharts";

import type {
  ProfessionalDistributionSlice,
  ProfessionalStatusSlice,
} from "@/lib/admin/professionals-metrics";

type DonutChartProps = {
  data: Array<ProfessionalDistributionSlice | ProfessionalStatusSlice>;
  testId: string;
  totalLabel: string;
};

export function ProfessionalsDonutChart({ data, testId, totalLabel }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center rounded-[8px] border border-dashed border-[#31536a] text-sm text-[#8ca1af]">
        Sem dados para exibir
      </div>
    );
  }

  return (
    <div className="grid min-h-[310px] gap-5 md:grid-cols-[170px_1fr]" data-testid={testId}>
      <div className="relative h-[220px] w-[170px] self-center">
        <PieChart height={220} width={170}>
          <Pie
            cx="50%"
            cy="50%"
            data={data}
            dataKey="count"
            innerRadius={58}
            outerRadius={86}
            paddingAngle={3}
            stroke="none"
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
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[13px] text-[#879aa8]">Total</span>
          <span className="mt-2 text-[28px] leading-none text-[#f4f7fa]">{total.toLocaleString("pt-BR")}</span>
          <span className="mt-2 text-[14px] text-[#c9d4dc]">{totalLabel}</span>
        </div>
      </div>
      <div className="space-y-4 self-center">
        {data.map((item) => (
          <div className="flex items-start gap-3" key={item.label}>
            <span className="mt-1 size-3 rounded-full" style={{ backgroundColor: item.color }} />
            <div className="min-w-0">
              <p className="text-[13px] leading-[17px] text-[#dde7ee]">{item.label}</p>
              <p className="text-[12px] leading-[16px] text-[#a2b0ba]">
                {item.value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% ({item.count.toLocaleString("pt-BR")})
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
