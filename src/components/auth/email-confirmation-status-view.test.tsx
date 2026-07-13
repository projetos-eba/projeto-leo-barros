import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmailConfirmationStatusView } from "./email-confirmation-status-view";

describe("EmailConfirmationStatusView", () => {
  it("usa o login segmentado retornado pela confirmacao", () => {
    render(
      <EmailConfirmationStatusView
        loginHref="/login/parceiros"
        message="E-mail confirmado com sucesso."
        ok
      />,
    );

    expect(screen.getByRole("link", { name: "Ir para o login" }))
      .toHaveAttribute("href", "/login/parceiros");
  });
});
