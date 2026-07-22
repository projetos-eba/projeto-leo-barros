import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PartnerClientOverviewData } from "@/lib/partners/client-overview-metrics";
import type { PartnerFinanceData } from "@/lib/partners/finance-data";

import { recordReceivablePayment, revertReceivablePayment } from "../../planos-financeiro/actions";
import { PartnerClientFinanceView } from "./partner-client-finance-view";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("../../planos-financeiro/actions", () => ({
  recordReceivablePayment: vi.fn(),
  revertReceivablePayment: vi.fn(),
}));

vi.mock("./partner-client-profile-header", () => ({
  PartnerClientProfileHeader: ({ overview }: { overview: PartnerClientOverviewData }) => (
    <div data-testid="profile-header">{overview.client.name}</div>
  ),
}));

const overview = {
  client: {
    id: "a1000000-0000-4000-8000-000000000301",
    name: "Ana Ribeiro",
  },
} as PartnerClientOverviewData;

const finance: PartnerFinanceData = {
  clients: [
    {
      email: "ana@example.invalid",
      id: "a1000000-0000-4000-8000-000000000301",
      name: "Ana Ribeiro",
      status: "active",
    },
  ],
  contracts: [
    {
      billing_interval_snapshot: "monthly",
      category_snapshot: "Acompanhamento",
      created_at: "2026-07-22T12:00:00.000Z",
      duration_cycles_snapshot: 3,
      first_due_date: "2026-07-22",
      id: "c1000000-0000-4000-8000-000000000301",
      includes_diet_snapshot: true,
      includes_training_snapshot: true,
      notes: null,
      partner_id: "p1000000-0000-4000-8000-000000000301",
      patient_id: "a1000000-0000-4000-8000-000000000301",
      plan_name_snapshot: "PowerShape",
      price_cents_snapshot: 30000,
      service_plan_id: "s1000000-0000-4000-8000-000000000301",
      start_date: "2026-07-22",
      status: "active",
      updated_at: "2026-07-22T12:00:00.000Z",
    },
  ],
  receivables: [
    {
      amount_cents: 30000,
      contract_id: "c1000000-0000-4000-8000-000000000301",
      due_date: "2026-07-22",
      id: "r1000000-0000-4000-8000-000000000301",
      installment_number: 1,
      paid_at: null,
      partner_id: "p1000000-0000-4000-8000-000000000301",
      patient_id: "a1000000-0000-4000-8000-000000000301",
      payment_method: null,
      payment_notes: null,
      payment_reference: null,
      status: "pending",
    },
    {
      amount_cents: 30000,
      contract_id: "c1000000-0000-4000-8000-000000000301",
      due_date: "2026-08-22",
      id: "r2000000-0000-4000-8000-000000000301",
      installment_number: 2,
      paid_at: "2026-08-22T12:00:00.000Z",
      partner_id: "p1000000-0000-4000-8000-000000000301",
      patient_id: "a1000000-0000-4000-8000-000000000301",
      payment_method: "pix_external",
      payment_notes: null,
      payment_reference: "Recibo 22",
      status: "paid",
    },
  ],
  servicePlans: [],
  summary: {
    activePlans: 1,
    clientsWithPlan: 1,
    overdueCents: 0,
    pendingCents: 30000,
    receivedMonthCents: 30000,
  },
};

describe("PartnerClientFinanceView", () => {
  beforeEach(() => {
    vi.mocked(recordReceivablePayment).mockResolvedValue({ message: "Pagamento registrado.", ok: true });
    vi.mocked(revertReceivablePayment).mockResolvedValue({ message: "Pagamento desfeito.", ok: true });
    refresh.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("registra pagamento manual de uma parcela pendente", async () => {
    render(<PartnerClientFinanceView finance={finance} overview={overview} />);

    expect(screen.getByRole("heading", { name: "Gestão de recebimentos" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Marcar como pago" }));

    expect(screen.getByRole("heading", { name: "Registrar pagamento" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Forma de recebimento"), {
      target: { value: "cash" },
    });
    fireEvent.change(screen.getByLabelText("Referência opcional"), {
      target: { value: "Recibo manual" },
    });
    fireEvent.change(screen.getByLabelText("Observações"), {
      target: { value: "Pago no consultório" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Marcar como pago" }).at(-1)!);

    await waitFor(() => expect(recordReceivablePayment).toHaveBeenCalled());
    expect(recordReceivablePayment).toHaveBeenCalledWith(expect.objectContaining({
      paymentMethod: "cash",
      paymentNotes: "Pago no consultório",
      paymentReference: "Recibo manual",
      receivableId: "r1000000-0000-4000-8000-000000000301",
    }));
  });

  it("permite desfazer um pagamento registrado", async () => {
    render(<PartnerClientFinanceView finance={finance} overview={overview} />);

    fireEvent.click(screen.getByRole("button", { name: "Desfazer pagamento" }));

    await waitFor(() => expect(revertReceivablePayment).toHaveBeenCalledWith("r2000000-0000-4000-8000-000000000301"));
  });
});
