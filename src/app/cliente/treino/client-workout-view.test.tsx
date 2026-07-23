import { fireEvent, render, screen, within } from "@testing-library/react";
import { forwardRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { buildClientWorkout, type ClientWorkoutRawData } from "@/lib/clients/workout-metrics";

import { ClientWorkoutView } from "./client-workout-view";

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
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("./actions", () => ({
  startClientWorkoutSession: vi.fn(async () => ({ clientSessionId: "client-session-1", ok: true })),
}));

const raw: ClientWorkoutRawData = {
  client: { avatarUrl: null, id: "ana", name: "Ana Ribeiro", objective: "Hipertrofia" },
  exerciseLogs: [],
  generatedAt: "2026-07-03T12:00:00.000Z",
  program: {
    createdAt: "2026-07-01T12:00:00.000Z",
    id: "program-1",
    notes: null,
    partnerId: "partner-1",
    patientId: "ana",
    publishedAt: "2026-07-01T12:00:00.000Z",
    sentAt: null,
    sessions: [
      {
        durationMinutes: 60,
        exercises: [
          {
            bisetGroupId: null,
            bisetPosition: null,
            cadence: null,
            exerciseId: "library-1",
            id: "exercise-1",
            muscleGroup: "peito",
            name: "Supino reto",
            notes: null,
            restSeconds: 90,
            secondaryMuscleGroups: ["triceps"],
            sets: [
              { id: "set-1", intensity: "warmup", loadKg: 40, reps: 12, setNumber: 1 },
              { id: "set-2", intensity: "moderate", loadKg: 60, reps: 10, setNumber: 2 },
            ],
            sortOrder: 0,
            technique: "normal",
            thumbnailUrl: null,
            variationName: null,
          },
        ],
        frequencyPerWeek: 2,
        id: "session-a",
        objective: "hipertrofia",
        sortOrder: 0,
        title: "Treino A",
      },
      {
        durationMinutes: 55,
        exercises: [],
        frequencyPerWeek: 2,
        id: "session-b",
        objective: "forca",
        sortOrder: 1,
        title: "Treino B",
      },
    ],
    status: "published",
    title: "Hipertrofia Upper/Lower",
    updatedAt: "2026-07-02T12:00:00.000Z",
    version: 2,
  },
  selectedDate: "2026-07-03",
  setLogs: [],
  workoutSessions: [
    { completedAt: "2026-07-02T13:00:00.000Z", durationMinutes: 60, id: "log-1", notes: null, prescribedSessionId: "session-a", programId: "program-1", startedAt: "2026-07-02T12:00:00.000Z", status: "completed", totalVolumeKg: 1000, workoutDate: "2026-07-02" },
  ],
};

describe("ClientWorkoutView", () => {
  it("renderiza o painel de treino do Cliente sem expor dados sensíveis", () => {
    const workout = buildClientWorkout(raw);

    render(<ClientWorkoutView workout={workout} />);

    expect(screen.getByRole("heading", { name: "Painel de Treino" })).toBeInTheDocument();
    expect(screen.getByText("Treino do dia")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Iniciar treino/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Exercícios do treino" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Músculos trabalhados" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Histórico de treinos" })).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Dieta/i })).toHaveAttribute("href", "/cliente/dieta");
    expect(screen.getByRole("link", { name: /Treino/i })).toHaveAttribute("href", "/cliente/treino");
    expect(screen.getByRole("link", { name: /Saúde/i })).toHaveAttribute("href", "/cliente/saude");
    expect(screen.queryByText(/CPF/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pacientes/i)).not.toBeInTheDocument();
  });

  it("atualiza o hero quando o Cliente seleciona outra divisão", () => {
    const workout = buildClientWorkout(raw);

    render(<ClientWorkoutView workout={workout} />);

    expect(screen.getByText("Treino do dia")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Treino B" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Treino B/i }));

    const hero = within(screen.getByTestId("client-workout-hero"));

    expect(hero.getByText("Treino selecionado")).toBeInTheDocument();
    expect(hero.getByText("Treino B")).toBeInTheDocument();
    expect(hero.getByRole("heading", { name: "Costas e Bíceps" })).toBeInTheDocument();
  });
});
