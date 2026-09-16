import { z } from "zod";

export const partnerProfessionalTypes = [
  "personal_trainer",
  "nutricionista",
  "medico",
] as const;

export const partnerRegistryTypes = ["cref", "crm", "crn", "outro"] as const;

export const partnerAccountSchema = z.object({
  displayName: z.string().trim().min(2, "Informe seu nome.").max(160, "O nome deve ter no máximo 160 caracteres."),
  phone: z.string().trim().refine((value) => !value || /^\+[1-9][0-9]{7,14}$/.test(value), "Informe um telefone com DDI válido."),
  professionalType: z.enum(partnerProfessionalTypes, {
    errorMap: () => ({ message: "Selecione o tipo profissional." }),
  }),
  professionalRegistryType: z.string().trim().toLowerCase().max(24, "Informe um tipo de registro válido."),
  professionalRegistryNumber: z.string().trim().max(64, "Informe um número de registro válido."),
}).superRefine((value, context) => {
  const hasType = Boolean(value.professionalRegistryType);
  const hasNumber = Boolean(value.professionalRegistryNumber);

  if (hasType && !partnerRegistryTypes.includes(value.professionalRegistryType as typeof partnerRegistryTypes[number])) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Informe um tipo de registro válido.", path: ["professionalRegistryType"] });
  }
  if (hasType !== hasNumber) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: hasType ? "Informe o número do registro." : "Informe o tipo do registro.",
      path: [hasType ? "professionalRegistryNumber" : "professionalRegistryType"],
    });
  }
});

export type PartnerAccountInput = z.input<typeof partnerAccountSchema>;
export type PartnerAccountData = z.infer<typeof partnerAccountSchema> & { email: string };

export const professionalTypeLabels: Record<typeof partnerProfessionalTypes[number], string> = {
  medico: "Médico",
  nutricionista: "Nutricionista",
  personal_trainer: "Personal trainer",
};

export const registryTypeLabels: Record<typeof partnerRegistryTypes[number], string> = {
  cref: "CREF",
  crm: "CRM",
  crn: "CRN",
  outro: "Outro",
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function phoneDigitsWithDefaultCountry(value: string) {
  const digits = digitsOnly(value).slice(0, 15);
  if (!digits) return "";
  if (!value.trim().startsWith("+") && !digits.startsWith("55")) return `55${digits}`.slice(0, 15);
  return digits;
}

/** Formata telefones brasileiros com DDI e mantém uma saída legível para outros países. */
export function formatPartnerPhone(value: string) {
  const digits = phoneDigitsWithDefaultCountry(value);
  if (!digits) return "";

  if (digits.startsWith("55")) {
    const national = digits.slice(2, 13);
    if (digits.length <= 2) return `+${digits}`;
    const area = national.slice(0, 2);
    const prefix = national.slice(2, 7);
    const suffix = national.slice(7, 11);
    if (national.length <= 2) return `+55 (${area}`;
    if (national.length <= 7) return `+55 (${area}) ${prefix}`;
    return `+55 (${area}) ${prefix}-${suffix}`;
  }

  if (digits.length <= 3) return `+${digits}`;
  if (digits.length <= 7) return `+${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `+${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
}

export function normalizePartnerPhone(value: string) {
  const digits = phoneDigitsWithDefaultCountry(value);
  return digits ? `+${digits}` : "";
}
