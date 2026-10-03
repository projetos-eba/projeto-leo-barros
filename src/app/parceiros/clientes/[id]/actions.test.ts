import { describe, expect, it, vi } from "vitest";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));

import {
  createClientAppointment,
  createClientDietPlan,
  createClientWorkoutProgram,
  saveClientAssessment,
  saveClientCardioCalculation,
  saveClientExamCollection,
  saveClientPhotoSession,
} from "./actions";

vi.mock("@/lib/supabase/server", () => ({ createClient }));

describe("ações do perfil de Cliente", () => {
  it.each([
    ["agenda", createClientAppointment, "Revise os dados do agendamento."],
    ["avaliações", saveClientAssessment, "Revise os dados da avaliação."],
    ["treinos", createClientWorkoutProgram, "Revise os dados do treino."],
    ["cardio", saveClientCardioCalculation, "Revise o cálculo de Cardio."],
    ["exames", saveClientExamCollection, "Revise os resultados dos exames."],
    ["fotos", saveClientPhotoSession, "Revise a sessão de Fotos."],
    ["dietas", createClientDietPlan, "Revise os dados da dieta."],
  ] as const)("rejeita entrada inválida de %s sem abrir conexão", async (_domain, action, error) => {
    await expect(action({} as never)).resolves.toEqual({ error, ok: false });
    expect(createClient).not.toHaveBeenCalled();
  });
});
