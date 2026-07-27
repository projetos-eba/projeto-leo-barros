import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PartnerFormTemplate } from "@/lib/partners/form-library";

import {
  changePartnerFormTemplateStatus,
  savePartnerFormTemplate,
  sendPartnerFormTemplate,
} from "./form-actions";
import { PartnerFormLibrary } from "./partner-form-library";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("./form-actions", () => ({
  changePartnerFormTemplateStatus: vi.fn(),
  savePartnerFormTemplate: vi.fn(),
  sendPartnerFormTemplate: vi.fn(),
}));

const template: PartnerFormTemplate = {
  defaultMessage: "Responda até a próxima consulta.",
  description: "Acompanhamento semanal",
  id: "11111111-1111-4111-8111-111111111111",
  questionCount: 1,
  questions: [{ helpText: "", options: [], prompt: "Como foi sua semana?", required: true, settings: { placeholder: "Conte aqui" }, type: "text_long" }],
  responseCount: 1,
  sendCount: 2,
  status: "active",
  title: "Check-in",
  updatedAt: "2026-07-27T12:00:00.000Z",
  version: 2,
};

const clients = [
  { avatarUrl: null, displayName: "Ana Cliente", email: "ana@example.invalid", id: "22222222-2222-4222-8222-222222222222", status: "active" },
  { avatarUrl: null, displayName: "Bruno Cliente", email: "bruno@example.invalid", id: "33333333-3333-4333-8333-333333333333", status: "active" },
];

describe("PartnerFormLibrary", () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.mocked(savePartnerFormTemplate).mockResolvedValue({ id: template.id, message: "Modelo publicado.", ok: true });
    vi.mocked(sendPartnerFormTemplate).mockResolvedValue({ id: "assignment", message: "Formulário enviado.", ok: true });
    vi.mocked(changePartnerFormTemplateStatus).mockResolvedValue({ message: "Modelo arquivado.", ok: true });
  });

  it("cria, configura e pré-visualiza um modelo", async () => {
    render(<PartnerFormLibrary clients={clients} templates={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Criar modelo" }));
    fireEvent.change(screen.getByLabelText("Título do modelo"), { target: { value: "Avaliação inicial" } });
    fireEvent.change(screen.getByPlaceholderText("Pergunta"), { target: { value: "Qual é sua meta?" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar pergunta" }));
    expect(screen.getByText("Pergunta 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));

    await waitFor(() => expect(savePartnerFormTemplate).toHaveBeenCalledWith(expect.objectContaining({
      status: "active",
      templateId: null,
      title: "Avaliação inicial",
    })));
    expect(refresh).toHaveBeenCalled();
  });

  it("duplica, arquiva e envia em lote com uma chave idempotente", async () => {
    render(<PartnerFormLibrary clients={clients} templates={[template]} />);
    fireEvent.click(screen.getByTitle("Duplicar"));
    expect(screen.getByLabelText("Título do modelo")).toHaveValue("Check-in (cópia)");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    fireEvent.click(screen.getByTitle("Arquivar"));
    await waitFor(() => expect(changePartnerFormTemplateStatus).toHaveBeenCalledWith({ status: "archived", templateId: template.id }));

    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    fireEvent.click(screen.getByRole("button", { name: /Selecionar todos os filtrados/ }));
    fireEvent.click(screen.getByRole("button", { name: /Confirmar envio/ }));

    await waitFor(() => expect(sendPartnerFormTemplate).toHaveBeenCalledWith(expect.objectContaining({
      patientIds: clients.map((client) => client.id),
      templateId: template.id,
    })));
    const requestKey = vi.mocked(sendPartnerFormTemplate).mock.calls[0][0].requestKey;
    expect(requestKey).toMatch(/^[0-9a-f-]{36}$/);
  });
});
