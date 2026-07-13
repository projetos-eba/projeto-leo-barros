import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { completeClientHealthAction, markClientHealthMedication } from "./actions";

describe("ações do painel de saúde do Cliente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    mocks.createClient.mockResolvedValue({ rpc: mocks.rpc });
  });

  it("marca medicação e revalida a rota", async () => {
    const result = await markClientHealthMedication("med-1", "2026-07-03", true);

    expect(result).toEqual({ ok: true });
    expect(mocks.rpc).toHaveBeenCalledWith("client_health_mark_medication", {
      p_log_date: "2026-07-03",
      p_medication_id: "med-1",
      p_taken: true,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/cliente/saude");
  });

  it("conclui ação de saúde e revalida home", async () => {
    const result = await completeClientHealthAction("pressure", "2026-07-03");

    expect(result).toEqual({ ok: true });
    expect(mocks.rpc).toHaveBeenCalledWith("client_health_complete_action", {
      p_action_key: "pressure",
      p_log_date: "2026-07-03",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/cliente/inicio");
  });
});
