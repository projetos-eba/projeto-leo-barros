"use client";

import { Download, Plus } from "lucide-react";

import type { AdminFinancialData } from "@/lib/admin/financial-metrics";

type AdminFinancialActionsProps = {
  financial: AdminFinancialData;
};

function csvEscape(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function buildCsv(financial: AdminFinancialData) {
  const rows = [
    ["tipo", "nome", "email", "plano", "valor", "data", "status"],
    ...financial.recentRows.map((row) => [
      "assinatura",
      row.name,
      row.email,
      row.plan,
      row.amount,
      row.dateLabel,
      row.status,
    ]),
    ...financial.renewalRows.map((row) => [
      "renovacao",
      row.name,
      row.email,
      row.plan,
      row.amount,
      row.dateLabel,
      "renovacao_proxima",
    ]),
  ];

  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

export function AdminFinancialActions({ financial }: AdminFinancialActionsProps) {
  function exportCsv() {
    const csv = buildCsv(financial);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `financeiro-admin-${financial.generatedAt.slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
      <button
        className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-[#2b4a5d] bg-[#0d2635]/80 px-4 text-[13px] font-semibold text-[#c6d1d9] transition-colors hover:bg-[#143244]"
        onClick={exportCsv}
        type="button"
      >
        <Download className="size-4" />
        Exportar relatório
      </button>
      <button
        aria-disabled="true"
        className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-[8px] bg-[#238eff]/45 px-4 text-[13px] font-semibold text-[#dbeafe]/75"
        disabled
        title="Criação de planos depende da fase de billing."
        type="button"
      >
        <Plus className="size-4" />
        Criar plano
      </button>
    </div>
  );
}
