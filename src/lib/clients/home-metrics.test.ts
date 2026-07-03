import { describe, expect, it } from "vitest";

import { buildClientHome } from "./home-metrics";

describe("buildClientHome", () => {
  it("monta a home do Cliente a partir do smoke principal", () => {
    const home = buildClientHome(
      {
        appointments: [
          {
            startsAt: "2026-07-09T13:30:00.000Z",
            status: "scheduled",
            title: "Consulta de acompanhamento",
          },
        ],
        client: {
          avatarUrl: "/avatars/ana-ribeiro-seed.png",
          displayName: "Ana Ribeiro",
          objective: "Hipertrofia",
          patientId: "a1000000-0000-4000-8000-000000000301",
        },
        measurements: [
          {
            bodyFatPercentage: 14.7,
            measuredAt: "2026-07-02T12:00:00.000Z",
            weightKg: 78.4,
          },
        ],
        serviceScopes: ["treino", "dieta"],
        subscription: {
          currentPeriodEnd: "2026-07-10T12:00:00.000Z",
          status: "active",
        },
      },
      new Date("2026-07-02T12:00:00.000Z"),
    );

    expect(home.client.firstName).toBe("Ana");
    expect(home.client.initial).toBe("A");
    expect(home.client.objectiveLabel).toBe("Hipertrofia");
    expect(home.modules).toEqual({ dieta: true, saude: true, treino: true });
    expect(home.subscription?.daysUntilRenewal).toBe(8);
    expect(home.nextAppointment?.title).toBe("Consulta de acompanhamento");
    expect(home.latestMetrics?.weightLabel).toBe("78,4 kg");
  });
});
