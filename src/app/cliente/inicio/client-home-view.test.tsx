import { render, screen } from "@testing-library/react";
import { forwardRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { buildClientHome } from "@/lib/clients/home-metrics";

import { ClientHomeView } from "./client-home-view";

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

describe("ClientHomeView", () => {
  it("renderiza a seleção de módulos do Cliente sem expor dados sensíveis", () => {
    render(<ClientHomeView home={home} />);

    expect(screen.getByRole("heading", { name: "Olá, Ana" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dieta" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Treino" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Saúde" })).toBeInTheDocument();
    expect(screen.getByText("Plano vence em")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("jul")).toBeInTheDocument();
    expect(screen.getByText("2026")).toBeInTheDocument();
    expect(screen.getByText("Próxima atualização")).toBeInTheDocument();
    expect(screen.getByText("Calorias do dia")).toBeInTheDocument();
    expect(screen.getByText("Água")).toBeInTheDocument();
    expect(screen.getByText("Treino do dia")).toBeInTheDocument();
    expect(screen.queryByText(/3 módulos/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Jornada integrada/i)).not.toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Acessar painel de dieta/i })).toHaveAttribute("href", "/cliente/dieta");
    expect(screen.getByRole("link", { name: /Acessar painel de treino/i })).toHaveAttribute("href", "/cliente/treino");
    expect(screen.getByRole("link", { name: /Acessar painel de saúde/i })).toHaveAttribute("href", "/cliente/saude");

    expect(screen.queryByText(/CPF/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pacientes/i)).not.toBeInTheDocument();
  });
});
