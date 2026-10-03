import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientProfileDrawer } from "./client-profile-drawer";
import { loadPartnerClientProfile, savePartnerClientProfile } from "@/app/parceiros/clientes/[id]/_actions/profile";
import { completePartnerClientProfile } from "@/app/parceiros/clientes/[id]/_actions/assessments";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/parceiros/clientes/[id]/_actions/profile", () => ({ loadPartnerClientProfile: vi.fn(), savePartnerClientProfile: vi.fn() }));
vi.mock("@/app/parceiros/clientes/[id]/_actions/assessments", () => ({ completePartnerClientProfile: vi.fn() }));
const data = { displayName: "Cliente Teste", email: "client@example.invalid", phone: "+5511999999999", biologicalSex: "not_informed" as const, birthDate: "2000-01-01", objective: "Hipertrofia" };
beforeEach(() => { vi.clearAllMocks(); vi.mocked(loadPartnerClientProfile).mockResolvedValue({ data }); });
describe("profile drawer", () => {
  it("loads a full editable profile, keeps email readonly, and stays open on save failure", async () => {
    vi.mocked(savePartnerClientProfile).mockResolvedValue({ ok: false, error: "Não foi possível salvar." });
    const close = vi.fn();
    render(<ClientProfileDrawer patientId="client-id" mode="full" open onOpenChange={close} />);
    await screen.findByDisplayValue(data.displayName);
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("readonly");
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Novo Nome" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar cadastro" }));
    await screen.findByRole("alert");
    expect(savePartnerClientProfile).toHaveBeenCalledWith(expect.objectContaining({ displayName: "Novo Nome", patientId: "client-id" }));
    expect(close).not.toHaveBeenCalled();
  });
  it("reuses the bio action and cancel does not save", async () => {
    const close = vi.fn();
    const { rerender } = render(<ClientProfileDrawer patientId="id" open initialBio={data} onOpenChange={close} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(completePartnerClientProfile).not.toHaveBeenCalled();
    rerender(<ClientProfileDrawer patientId="id" open={false} initialBio={data} onOpenChange={close} />);
    rerender(<ClientProfileDrawer patientId="id" open initialBio={data} onOpenChange={close} />);
    vi.mocked(completePartnerClientProfile).mockResolvedValue({ ok: true });
    fireEvent.click(screen.getByRole("button", { name: "Salvar bio" }));
    await waitFor(() => expect(completePartnerClientProfile).toHaveBeenCalledWith({ patientId: "id", birthDate: data.birthDate, biologicalSex: data.biologicalSex, objective: data.objective }));
    expect(loadPartnerClientProfile).not.toHaveBeenCalled();
  });
});
