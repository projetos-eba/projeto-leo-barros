import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminSupportView } from "./admin-support-view";
import type { AdminSupportData } from "@/lib/admin/support-metrics";

const support: AdminSupportData = {
  delayedCount: 1,
  generatedAt: "2026-06-29T12:00:00.000Z",
  kpis: [
    { delta: "-12,1%", description: "Tickets em aberto ou em atendimento", id: "openTickets", label: "Tickets abertos", trend: "good", value: "2" },
    { delta: "+2,3 p.p.", description: "Tickets ativos dentro do prazo de SLA", id: "sla", label: "Em SLA", trend: "good", value: "50%" },
    { delta: "↓ 3min", description: "Tempo médio entre abertura e última atualização", id: "avgResponse", label: "Tempo médio de resposta", trend: "good", value: "18min" },
  ],
  periodLabel: "01 jun - 30 jun",
  tickets: [
    {
      category: "Integrações",
      createdAtLabel: "29/06/2026",
      email: "patricia@example.invalid",
      id: "ticket-1",
      initial: "P",
      lastInteractionLabel: "2 h atrás",
      openedSinceLabel: "4 h",
      partnerId: "partner-1",
      priority: "urgent",
      priorityLabel: "Crítica",
      priorityTone: "danger",
      professionalName: "Patricia Lima",
      responsible: "Bruno Almeida",
      slaDueLabel: "29/06/2026",
      slaLabel: "Atrasado",
      slaTone: "danger",
      status: "open",
      statusLabel: "Novo",
      statusTone: "info",
      subject: "Integração com Google Ads",
      tags: ["integrações", "google-ads"],
      ticketNumber: "TKT-001",
      updatedAtLabel: "29/06/2026",
    },
  ],
};

describe("AdminSupportView", () => {
  it("renderiza suporte, filtra tickets e abre drawer do ticket selecionado", () => {
    render(<AdminSupportView support={support} />);

    expect(screen.getByRole("heading", { name: "Suporte" })).toBeInTheDocument();
    expect(screen.getByText("Tickets abertos")).toBeInTheDocument();
    expect(screen.getByText("Alertas de atraso")).toBeInTheDocument();
    expect(screen.getByText("Integração com Google Ads")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Abrir ticket TKT-001" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ticket selecionado" })).toBeInTheDocument();
    expect(screen.getByText("patricia@example.invalid")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Digite sua resposta..."), { target: { value: "Vou verificar agora." } });
    fireEvent.click(screen.getByRole("button", { name: /Enviar resposta/i }));

    expect(screen.getByText("Vou verificar agora.")).toBeInTheDocument();
  });
});
