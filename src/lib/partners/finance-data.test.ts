import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchPartnerClientFinanceData } from "./finance-data";

const clientA = "a1000000-0000-4000-8000-000000000301";
const clientB = "b2000000-0000-4000-8000-000000000302";
const partnerId = "c3000000-0000-4000-8000-000000000303";

const { createClient, getCurrentProfile } = vi.hoisted(() => ({
  createClient: vi.fn(),
  getCurrentProfile: vi.fn(),
}));

vi.mock("@/lib/auth/next-guards", () => ({ getCurrentProfile }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));

type Row = Record<string, unknown>;
type MockQueryResult = { data: Row[]; error: null };

function query(data: Row[], filters: Array<[string, string]>) {
  const chain = {
    eq: vi.fn((column: string, value: string) => {
      filters.push([column, value]);
      return chain;
    }),
    in: vi.fn(() => chain),
    order: vi.fn(() => chain),
    then: <TResult1 = MockQueryResult, TResult2 = never>(
      onfulfilled?: ((value: MockQueryResult) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ) => {
      const result = {
        data: data.filter((row) => filters.every(([column, value]) => String(row[column]) === value)),
        error: null,
      };
      return Promise.resolve(result).then(onfulfilled, onrejected);
    },
  };

  return chain;
}

describe("fetchPartnerClientFinanceData", () => {
  const filtersByTable = new Map<string, Array<[string, string]>>();
  const from = vi.fn();
  const rpc = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    filtersByTable.clear();
    vi.mocked(getCurrentProfile).mockResolvedValue({ profile: { id: partnerId } } as never);

    const rows: Record<string, Row[]> = {
      partners: [{ id: partnerId, profile_id: partnerId }],
      partner_client_plan_contracts: [
        { id: "contract-a", partner_id: partnerId, patient_id: clientA, plan_name_snapshot: "Plano A", price_cents_snapshot: 12900 },
        { id: "contract-b", partner_id: partnerId, patient_id: clientB, plan_name_snapshot: "Plano B", price_cents_snapshot: 98700 },
      ],
      partner_client_receivables: [
        { id: "receivable-a", partner_id: partnerId, patient_id: clientA, contract_id: "contract-a", amount_cents: 12900 },
        { id: "receivable-b", partner_id: partnerId, patient_id: clientB, contract_id: "contract-b", amount_cents: 98700 },
      ],
    };

    from.mockImplementation((table: string) => ({
      select: vi.fn(() => {
        const filters: Array<[string, string]> = [];
        filtersByTable.set(table, filters);
        return query(rows[table] ?? [], filters);
      }),
    }));
    rpc.mockResolvedValue({
      data: [
        { patient_id: clientA, display_name: "Cliente A", email: "a@example.test", relationship_status: "active" },
        { patient_id: clientB, display_name: "Cliente B", email: "b@example.test", relationship_status: "active" },
      ],
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue({ from, rpc } as never);
  });

  it("escopa contratos e recebíveis por patientId e nunca serializa dados de outro cliente", async () => {
    const finance = await fetchPartnerClientFinanceData(clientA);
    const payload = JSON.stringify(finance);

    expect(filtersByTable.get("partner_client_plan_contracts")).toContainEqual(["patient_id", clientA]);
    expect(filtersByTable.get("partner_client_receivables")).toContainEqual(["patient_id", clientA]);
    expect(from).not.toHaveBeenCalledWith("partner_service_plans");
    expect(finance.contracts).toHaveLength(1);
    expect(finance.receivables).toHaveLength(1);
    expect(payload).toContain("contract-a");
    expect(payload).toContain("receivable-a");
    expect(payload).not.toContain(clientB);
    expect(payload).not.toContain("contract-b");
    expect(payload).not.toContain("receivable-b");
    expect(payload).not.toContain("98700");
  });
});
