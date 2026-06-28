import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClient } from "@/lib/supabase/client";

import { CreatePartnerForm } from "./create-partner-form.next";

const invoke = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    functions: {
      invoke,
    },
  })),
}));

function chooseSelectValue(index: number, option: string) {
  fireEvent.click(screen.getAllByRole("combobox")[index]);
  fireEvent.click(screen.getByRole("option", { name: option }));
}

describe("CreatePartnerForm", () => {
  beforeEach(() => {
    invoke.mockReset();
    vi.mocked(createClient).mockClear();
  });

  it("valida campos obrigatorios antes de chamar a Edge Function", async () => {
    render(<CreatePartnerForm />);

    fireEvent.click(screen.getByRole("button", { name: /Criar parceiro/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Dados incompletos",
    );
    expect(invoke).not.toHaveBeenCalled();
  });

  it("chama provision-partner com payload seguro do Admin", async () => {
    invoke.mockResolvedValue({
      data: {
        status: "created",
        partner: {
          accountStatus: "active",
          partnerId: "partner-id",
          profileId: "profile-id",
        },
        invite: {
          status: "pending_delivery",
        },
      },
      error: null,
    });

    render(<CreatePartnerForm />);

    fireEvent.change(screen.getByLabelText("Nome de exibicao"), {
      target: { value: "Parceiro Local" },
    });
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "PARCEIRO.LOCAL@EXAMPLE.COM" },
    });
    fireEvent.change(screen.getByLabelText("Telefone"), {
      target: { value: "+5511999999999" },
    });
    chooseSelectValue(0, "Nutricionista");
    chooseSelectValue(1, "CRN");
    fireEvent.change(screen.getByLabelText("Numero do registro"), {
      target: { value: "local-dev-001" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Criar parceiro/i }));

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("provision-partner", {
        body: expect.objectContaining({
          displayName: "Parceiro Local",
          email: "parceiro.local@example.com",
          phone: "+5511999999999",
          professionalRegistryNumber: "local-dev-001",
          professionalRegistryType: "crn",
          professionalType: "nutricionista",
        }),
      });
    });

    const payload = invoke.mock.calls[0][1].body;
    expect(payload).not.toHaveProperty("password");
    expect(payload).not.toHaveProperty("role");
    expect(payload).not.toHaveProperty("status");
    expect(payload).not.toHaveProperty("professionalName");
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Parceiro criado",
    );
    expect(screen.getByText("pending_delivery")).toBeInTheDocument();
  });

  it("mostra mensagem segura quando a funcao retorna existing", async () => {
    invoke.mockResolvedValue({
      data: {
        status: "existing",
        partner: {
          accountStatus: "active",
        },
        invite: {
          status: "pending_delivery",
        },
      },
      error: null,
    });

    render(<CreatePartnerForm />);

    fireEvent.change(screen.getByLabelText("Nome de exibicao"), {
      target: { value: "Parceiro Local" },
    });
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "parceiro.local@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Telefone"), {
      target: { value: "+5511999999999" },
    });
    chooseSelectValue(0, "Medico");
    chooseSelectValue(1, "CRM");
    fireEvent.change(screen.getByLabelText("Numero do registro"), {
      target: { value: "crm-12345" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Criar parceiro/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Parceiro ja existente",
    );
  });
});
