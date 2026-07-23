import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { forwardRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { buildClientDiet, type ClientDietRawData } from "@/lib/clients/diet-metrics";

import { setClientDietMealStatus } from "./actions";
import { ClientDietView } from "./client-diet-view";

vi.mock("next/link", () => ({
  default: forwardRef<
    HTMLAnchorElement,
    React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
  >(function MockLink({ children, href, ...props }, ref) {
    return (
      <a ref={ref} href={href} {...props}>
        {children}
      </a>
    );
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("./actions", () => ({
  addClientDietWater: vi.fn(async () => ({ ok: true })),
  applyClientDietMealSubstitution: vi.fn(async () => ({ ok: true })),
  saveClientDietMealNote: vi.fn(async () => ({ ok: true })),
  setClientDietMealStatus: vi.fn(async () => ({ ok: true })),
}));

const raw: ClientDietRawData = {
  client: { avatarUrl: null, id: "ana", name: "Ana Ribeiro", objective: "Hipertrofia" },
  dailyLog: { waterMl: 750 },
  generatedAt: "2026-07-03T12:00:00.000Z",
  mealLogs: [
    { completedAt: "2026-07-03T10:00:00.000Z", mealId: "breakfast", notes: null, photoMimeType: null, photoOriginalFilename: null, photoStoragePath: null, status: "completed" },
  ],
  plan: {
    calorieStrategy: "surplus",
    id: "plan",
    meals: [
      {
        id: "breakfast",
        items: [{ carbsG: 20, fatG: 2, foodId: null, householdMeasure: null, id: "item-1", kcal: 118, name: "Aveia em flocos", proteinG: 4, quantity: 40, quantityUnit: "g", sortOrder: 0 }],
        mealTime: "07:00",
        sortOrder: 0,
        title: "Café da manhã",
      },
      {
        id: "lunch",
        items: [{ carbsG: 28, fatG: 4, foodId: null, householdMeasure: null, id: "item-2", kcal: 300, name: "Frango grelhado", proteinG: 31, quantity: 150, quantityUnit: "g", sortOrder: 0 }],
        mealTime: "12:30",
        sortOrder: 1,
        title: "Almoço",
      },
      {
        id: "snack",
        items: [{ carbsG: 3, fatG: 1.5, fiberG: 0, foodId: null, householdMeasure: null, id: "item-3", kcal: 120, name: "Whey protein", proteinG: 24, quantity: 30, quantityUnit: "g", sortOrder: 0 }],
        mealTime: "16:30",
        sortOrder: 2,
        title: "Lanche",
      },
      {
        id: "dinner",
        items: [{ carbsG: 28, fatG: 3.6, fiberG: 1.6, foodId: null, householdMeasure: null, id: "item-4", kcal: 295, name: "Frango com arroz", proteinG: 33.5, quantity: 150, quantityUnit: "g", sortOrder: 0 }],
        mealTime: "19:30",
        sortOrder: 3,
        title: "Jantar",
      },
      {
        id: "supper",
        items: [{ carbsG: 12, fatG: 0.4, fiberG: 0, foodId: null, householdMeasure: null, id: "item-5", kcal: 89, name: "Iogurte natural", proteinG: 9, quantity: 170, quantityUnit: "g", sortOrder: 0 }],
        mealTime: "22:00",
        sortOrder: 4,
        title: "Ceia",
      },
    ],
    partnerId: "partner",
    publishedAt: "2026-07-02T12:00:00.000Z",
    reviewOn: "2026-08-01",
    sentAt: null,
    startsOn: "2026-07-02",
    status: "active",
    targetCarbsG: 240,
    targetFatG: 70,
    targetKcal: 2200,
    targetProteinG: 180,
    title: "Dieta de definição",
    updatedAt: "2026-07-02T12:00:00.000Z",
    version: 2,
    waterLiters: 2,
  },
  selectedDate: "2026-07-03",
  suggestions: [{ carbsG: 20, category: "cereal", fatG: 1, fiberG: 3, id: "food", kcal: 130, name: "Batata-doce", proteinG: 2, servingSize: 100, servingUnit: "g" }],
  weekLogs: [
    { completedMeals: 1, consumedKcal: 400, date: "2026-06-27", totalMeals: 4, waterMl: 2000 },
    { completedMeals: 1, consumedKcal: 500, date: "2026-06-28", totalMeals: 4, waterMl: 2000 },
    { completedMeals: 1, consumedKcal: 600, date: "2026-06-29", totalMeals: 4, waterMl: 2000 },
    { completedMeals: 1, consumedKcal: 700, date: "2026-06-30", totalMeals: 4, waterMl: 2000 },
    { completedMeals: 1, consumedKcal: 800, date: "2026-07-01", totalMeals: 4, waterMl: 2000 },
    { completedMeals: 1, consumedKcal: 900, date: "2026-07-02", totalMeals: 4, waterMl: 2000 },
    { completedMeals: 1, consumedKcal: 118, date: "2026-07-03", totalMeals: 4, waterMl: 750 },
  ],
};

describe("ClientDietView", () => {
  it("renderiza o painel de dieta do Cliente sem expor dados sensíveis", () => {
    const diet = buildClientDiet(raw, new Date("2026-07-03T11:00:00.000Z"));

    render(<ClientDietView diet={diet} />);

    expect(screen.getByRole("heading", { name: "Minha Dieta" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Plano do dia" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Evolução e consistência" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Aderência hoje" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Orientações do profissional" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hidratação" })).toBeInTheDocument();
    expect(screen.getAllByText("Almoço").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Café da manhã").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Lanche").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Jantar").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ceia").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /Realizei/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /Parcial/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /Pulei/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Anexar foto/i })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /Navegação por data/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /\+ 250ml/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /- 250ml/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Nota/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Disciplina hoje/i)).not.toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Dieta/i })).toHaveAttribute("href", "/cliente/dieta");
    expect(screen.getByRole("link", { name: /Treino/i })).toHaveAttribute("href", "/cliente/treino");
    expect(screen.getByRole("link", { name: /Saúde/i })).toHaveAttribute("href", "/cliente/saude");
    expect(screen.queryByText(/CPF/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pacientes/i)).not.toBeInTheDocument();
  });

  it("mantém a refeição alterada em foco para observação antes de avançar", async () => {
    const diet = buildClientDiet(raw, new Date("2026-07-03T11:00:00.000Z"));
    const { rerender } = render(<ClientDietView diet={diet} />);

    fireEvent.click(screen.getByRole("button", { name: /Registrar refeição/i }));

    await waitFor(() => {
      expect(setClientDietMealStatus).toHaveBeenCalledWith("lunch", "2026-07-03", "completed");
    });

    const updatedDiet = buildClientDiet(
      {
        ...raw,
        mealLogs: [
          ...raw.mealLogs,
          { completedAt: "2026-07-03T12:10:00.000Z", mealId: "lunch", notes: null, photoMimeType: null, photoOriginalFilename: null, photoStoragePath: null, status: "completed" },
        ],
      },
      new Date("2026-07-03T11:00:00.000Z"),
    );

    rerender(<ClientDietView diet={updatedDiet} />);

    expect(screen.getByText("Refeição mantida em foco para registrar observação ou ajuste.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver próxima refeição" })).toBeInTheDocument();
  });
});
