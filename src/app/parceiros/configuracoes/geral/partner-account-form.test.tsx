import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PartnerAccountData } from "@/lib/auth/partner-account-contracts";

import { savePartnerAccount } from "./actions";
import { PartnerAccountForm } from "./partner-account-form";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("./actions", () => ({
  savePartnerAccount: vi.fn(),
}));

const account: PartnerAccountData = {
  displayName: "Antonio Ferrari",
  email: "antonio@example.invalid",
  phone: "+5511999998888",
  professionalType: "personal_trainer",
  professionalRegistryType: "cref",
  professionalRegistryNumber: "12345-G/SP",
};

describe("PartnerAccountForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(savePartnerAccount).mockResolvedValue({ ok: true, message: "Dados atualizados." });
  });

  it("mantém e-mail somente para consulta e salva os dados básicos", async () => {
    render(<PartnerAccountForm initialData={account} />);

    fireEvent.click(screen.getByRole("button", { name: "Editar dados básicos" }));
    expect(screen.getByLabelText("E-mail")).toBeDisabled();
    expect(screen.getByLabelText("Telefone com DDI")).toHaveValue("+55 (11) 99999-8888");

    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Novo Nome" } });
    fireEvent.change(screen.getByLabelText("Telefone com DDI"), { target: { value: "+55 (11) 98888-7777" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(savePartnerAccount).toHaveBeenCalledWith(expect.objectContaining({
      displayName: "Novo Nome",
      phone: "+55 (11) 98888-7777",
      professionalType: "personal_trainer",
    })));
    expect(refresh).toHaveBeenCalled();
  });
});
