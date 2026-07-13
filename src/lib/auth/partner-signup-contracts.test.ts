import { describe, expect, it } from "vitest";

import { partnerSignupSchema } from "./partner-signup-contracts";

const validInput = {
  confirmPassword: "senha-segura",
  displayName: "Vinicius Ferrari",
  email: "VINICIUS@example.com",
  password: "senha-segura",
  phone: "+55119984222461",
  professionalRegistryNumber: "",
  professionalRegistryType: "",
  professionalType: "personal_trainer" as const,
};

describe("partnerSignupSchema", () => {
  it("permite cadastro de Parceiro sem registro profissional", () => {
    const parsed = partnerSignupSchema.safeParse(validInput);

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toMatchObject({
        email: "vinicius@example.com",
        professionalRegistryNumber: "",
        professionalRegistryType: "",
      });
    }
  });

  it("normaliza registro preenchido em conjunto", () => {
    const parsed = partnerSignupSchema.safeParse({
      ...validInput,
      professionalRegistryNumber: "123456-G/SP",
      professionalRegistryType: "CREF",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.professionalRegistryType).toBe("cref");
      expect(parsed.data.professionalRegistryNumber).toBe("123456-G/SP");
    }
  });

  it("mostra erro especifico quando ha numero sem tipo", () => {
    const parsed = partnerSignupSchema.safeParse({
      ...validInput,
      professionalRegistryNumber: "123456-G/SP",
      professionalRegistryType: "",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.professionalRegistryType).toContain(
        "Informe o tipo do registro.",
      );
    }
  });

  it("mostra erro especifico quando ha tipo sem numero", () => {
    const parsed = partnerSignupSchema.safeParse({
      ...validInput,
      professionalRegistryNumber: "",
      professionalRegistryType: "CRN",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.professionalRegistryNumber).toContain(
        "Informe o numero do registro.",
      );
    }
  });
});
