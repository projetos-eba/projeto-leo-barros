import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
  remove: vi.fn(),
  rpc: vi.fn(),
  upload: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import {
  addClientDietWater,
  applyClientDietMealSubstitution,
  attachClientDietMealPhoto,
  markClientDietMeal,
  saveClientDietMealNote,
  setClientDietMealStatus,
} from "./actions";

describe("ações do painel de dieta do Cliente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    mocks.upload.mockResolvedValue({ data: { path: "path" }, error: null });
    mocks.remove.mockResolvedValue({ data: null, error: null });
    mocks.createClient.mockResolvedValue({
      rpc: mocks.rpc,
      storage: {
        from: vi.fn(() => ({
          remove: mocks.remove,
          upload: mocks.upload,
        })),
      },
    });
  });

  it("marca refeição e revalida a rota", async () => {
    const result = await markClientDietMeal("meal-1", "2026-07-03", true);

    expect(result).toEqual({ ok: true });
    expect(mocks.rpc).toHaveBeenCalledWith("client_diet_set_meal_status", {
      p_log_date: "2026-07-03",
      p_meal_id: "meal-1",
      p_status: "completed",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/cliente/dieta");
  });

  it("marca refeição como parcial ou pulada com status explícito", async () => {
    const partial = await setClientDietMealStatus("meal-1", "2026-07-03", "partial");
    const skipped = await setClientDietMealStatus("meal-1", "2026-07-03", "skipped");

    expect(partial).toEqual({ ok: true });
    expect(skipped).toEqual({ ok: true });
    expect(mocks.rpc).toHaveBeenCalledWith("client_diet_set_meal_status", {
      p_log_date: "2026-07-03",
      p_meal_id: "meal-1",
      p_status: "partial",
    });
    expect(mocks.rpc).toHaveBeenCalledWith("client_diet_set_meal_status", {
      p_log_date: "2026-07-03",
      p_meal_id: "meal-1",
      p_status: "skipped",
    });
  });

  it("registra hidratação em passos de 250ml", async () => {
    const result = await addClientDietWater("2026-07-03");

    expect(result).toEqual({ ok: true });
    expect(mocks.rpc).toHaveBeenCalledWith("client_diet_add_water", {
      p_amount_ml: 250,
      p_log_date: "2026-07-03",
    });
  });

  it("remove hidratação quando recebe valor negativo", async () => {
    const result = await addClientDietWater("2026-07-03", -250);

    expect(result).toEqual({ ok: true });
    expect(mocks.rpc).toHaveBeenCalledWith("client_diet_add_water", {
      p_amount_ml: -250,
      p_log_date: "2026-07-03",
    });
  });

  it("aplica substituição no diário do dia", async () => {
    const formData = new FormData();
    formData.set("mealId", "meal-1");
    formData.set("itemId", "item-1");
    formData.set("foodId", "food-1");
    formData.set("logDate", "2026-07-03");

    const result = await applyClientDietMealSubstitution(formData);

    expect(result).toEqual({ ok: true });
    expect(mocks.rpc).toHaveBeenCalledWith("client_diet_apply_substitution", {
      p_food_id: "food-1",
      p_item_id: "item-1",
      p_log_date: "2026-07-03",
      p_meal_id: "meal-1",
    });
  });

  it("salva observação da refeição", async () => {
    const formData = new FormData();
    formData.set("mealId", "meal-1");
    formData.set("logDate", "2026-07-03");
    formData.set("notes", "Sem fome no almoço.");

    const result = await saveClientDietMealNote(formData);

    expect(result).toEqual({ ok: true });
    expect(mocks.rpc).toHaveBeenCalledWith("client_diet_save_meal_note", {
      p_log_date: "2026-07-03",
      p_meal_id: "meal-1",
      p_notes: "Sem fome no almoço.",
    });
  });

  it("faz upload privado antes de vincular foto à refeição", async () => {
    mocks.rpc.mockImplementation(async (name: string) => (
      name === "current_active_patient_id"
        ? { data: "patient-1", error: null }
        : { data: null, error: null }
    ));
    const formData = new FormData();
    formData.set("mealId", "meal-1");
    formData.set("planId", "plan-1");
    formData.set("logDate", "2026-07-03");
    formData.set("photo", new File(["foto"], "almoço.png", { type: "image/png" }));

    const result = await attachClientDietMealPhoto(formData);

    expect(result).toEqual({ ok: true });
    expect(mocks.upload).toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledWith("client_diet_attach_meal_photo", expect.objectContaining({
      p_log_date: "2026-07-03",
      p_meal_id: "meal-1",
      p_mime_type: "image/png",
      p_original_filename: "almoço.png",
    }));
  });
});
