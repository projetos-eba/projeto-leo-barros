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

import {
  finishClientWorkoutSession,
  logClientWorkoutSet,
  skipClientWorkoutExercise,
  startClientWorkoutSession,
} from "./actions";

describe("ações do painel de treino do Cliente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    mocks.createClient.mockResolvedValue({ rpc: mocks.rpc });
  });

  it("inicia treino e retorna sessão de execução", async () => {
    mocks.rpc.mockResolvedValue({ data: { clientSessionId: "client-session-1" }, error: null });

    const result = await startClientWorkoutSession("session-1");

    expect(result).toEqual({ clientSessionId: "client-session-1", ok: true });
    expect(mocks.rpc).toHaveBeenCalledWith("client_workout_start_session", {
      p_session_id: "session-1",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/cliente/treino");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/cliente/treino/executar/client-session-1");
  });

  it("registra carga e repetições da série", async () => {
    const formData = new FormData();
    formData.set("clientSessionId", "client-session-1");
    formData.set("setId", "set-1");
    formData.set("loadKg", "72.5");
    formData.set("reps", "9");

    const result = await logClientWorkoutSet(formData);

    expect(result).toEqual({ clientSessionId: "client-session-1", ok: true });
    expect(mocks.rpc).toHaveBeenCalledWith("client_workout_log_set", {
      p_client_session_id: "client-session-1",
      p_completed: true,
      p_load_kg: 72.5,
      p_reps: 9,
      p_set_id: "set-1",
    });
  });

  it("pula exercício e finaliza sessão", async () => {
    await skipClientWorkoutExercise("client-session-1", "exercise-1");
    await finishClientWorkoutSession("client-session-1");

    expect(mocks.rpc).toHaveBeenCalledWith("client_workout_skip_exercise", {
      p_client_session_id: "client-session-1",
      p_exercise_id: "exercise-1",
    });
    expect(mocks.rpc).toHaveBeenCalledWith("client_workout_finish_session", {
      p_client_session_id: "client-session-1",
    });
  });
});
