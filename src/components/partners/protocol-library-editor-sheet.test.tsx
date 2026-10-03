import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getPartnerProtocolFoodForEdit,
  updatePartnerProtocolFood,
} from "@/app/parceiros/cadastros/actions";

import { ProtocolLibraryEditorSheet } from "./protocol-library-editor-sheet";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/parceiros/cadastros/actions", () => ({
  getPartnerProtocolExerciseForEdit: vi.fn(),
  getPartnerProtocolFoodForEdit: vi.fn(),
  updatePartnerProtocolExercise: vi.fn(),
  updatePartnerProtocolFood: vi.fn(),
}));

const food = {
  carbs: 0,
  category: "carne" as const,
  categoryLabel: "Carnes",
  fat: 3.2,
  fiber: 0,
  householdMeasure: "1 filé",
  id: "a1000000-0000-4000-8000-000000000301",
  kcal: 165,
  name: "Peito de frango",
  notes: null,
  protein: 31,
  servingLabel: "100 g",
  servingSize: 100,
  servingUnit: "g",
  sodium: 74,
  source: "custom" as const,
  sourceLabel: "Próprio",
  status: "active" as const,
  suggestedUses: ["pos_treino"],
  systemFoodId: null,
  tags: ["proteína"],
  updatedAt: "2026-09-25T12:00:00.000Z",
  usageCount: 1,
};

describe("ProtocolLibraryEditorSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carrega e atualiza um alimento da biblioteca sem adicioná-lo ao plano", async () => {
    vi.mocked(getPartnerProtocolFoodForEdit).mockResolvedValue({ item: food, ok: true });
    vi.mocked(updatePartnerProtocolFood).mockResolvedValue({ message: "Alimento atualizado.", ok: true });
    const onOpenChange = vi.fn();

    render(<ProtocolLibraryEditorSheet itemId={food.id} kind="food" open onOpenChange={onOpenChange} />);
    await screen.findByDisplayValue("Peito de frango");
    fireEvent.change(screen.getByDisplayValue("Peito de frango"), { target: { value: "Frango grelhado" } });
    fireEvent.submit(screen.getByRole("button", { name: "Salvar alterações" }).closest("form")!);

    await waitFor(() => expect(updatePartnerProtocolFood).toHaveBeenCalledWith(expect.objectContaining({ foodId: food.id, name: "Frango grelhado" })));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(refresh).toHaveBeenCalled();
  });

  it("fecha o drawer quando o item não pertence ao parceiro", async () => {
    vi.mocked(getPartnerProtocolFoodForEdit).mockResolvedValue({ error: "Alimento não encontrado.", ok: false });
    const onOpenChange = vi.fn();

    render(<ProtocolLibraryEditorSheet itemId={food.id} kind="food" open onOpenChange={onOpenChange} />);

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(updatePartnerProtocolFood).not.toHaveBeenCalled();
  });
});
