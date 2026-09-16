import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PartnerAccountMenu } from "./partner-account-menu";

describe("PartnerAccountMenu", () => {
  it("abre Minha conta, assinatura e saída ao ser acionado", () => {
    render(<PartnerAccountMenu accountName="Contato" planActive />);

    fireEvent.click(screen.getByRole("button", { name: /contato/i }));

    expect(screen.getByRole("menuitem", { name: "Minha conta" })).toHaveAttribute(
      "href",
      "/parceiros/configuracoes/geral",
    );
    expect(screen.getByRole("menuitem", { name: "Ver assinatura" })).toHaveAttribute(
      "href",
      "/parceiros/configuracoes/assinatura",
    );
    expect(screen.getByRole("menuitem", { name: "Sair" })).toBeInTheDocument();
  });

  it("fecha ao pressionar Escape", () => {
    render(<PartnerAccountMenu />);

    fireEvent.click(screen.getByRole("button", { name: /minha conta/i }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
