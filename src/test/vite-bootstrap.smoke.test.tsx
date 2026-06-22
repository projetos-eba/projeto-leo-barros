import { act, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../App.tsx", () => ({
  default: function MockApp() {
    return <main>Aplicação Vite montada</main>;
  },
}));

describe("bootstrap Vite", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.resetModules();
  });

  it("monta a aplicação no elemento root sem crash", async () => {
    document.body.innerHTML = '<div id="root"></div>';

    await act(async () => {
      await import("../main.tsx");
    });

    expect(screen.getByText("Aplicação Vite montada")).toBeInTheDocument();
  });
});
