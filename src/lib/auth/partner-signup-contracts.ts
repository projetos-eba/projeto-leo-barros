import { z } from "zod";

export const professionalTypes = [
  "personal_trainer",
  "nutricionista",
  "medico",
] as const;

export const professionalRegistryTypes = ["cref", "crm", "crn", "outro"] as const;

const requiredMessageByField = {
  confirmPassword: "Confirme a senha.",
  displayName: "Informe seu nome.",
  email: "Informe um e-mail valido.",
  password: "Informe uma senha com pelo menos 8 caracteres.",
  phone: "Informe um telefone valido.",
  professionalType: "Selecione um tipo profissional.",
} as const;

export const partnerSignupSchema = z
  .object({
    confirmPassword: z.string().min(8, requiredMessageByField.confirmPassword).max(72),
    displayName: z.string().trim().min(2, requiredMessageByField.displayName).max(120),
    email: z.string().trim().email(requiredMessageByField.email).max(254).transform((email) => email.toLowerCase()),
    password: z.string().min(8, requiredMessageByField.password).max(72),
    phone: z.string().trim().regex(/^\+[1-9][0-9]{7,14}$/, requiredMessageByField.phone),
    professionalRegistryNumber: z.string().trim().max(64, "O numero do registro informado e invalido.").optional().transform((value) => value ?? ""),
    professionalRegistryType: z.string().trim().max(24, "Informe um tipo de registro valido.").optional().transform((value) => value?.toLowerCase() ?? ""),
    professionalType: z.enum(professionalTypes, {
      errorMap: () => ({ message: requiredMessageByField.professionalType }),
    }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "As senhas nao coincidem.",
    path: ["confirmPassword"],
  })
  .superRefine((value, context) => {
    const hasRegistryNumber = Boolean(value.professionalRegistryNumber);
    const hasRegistryType = Boolean(value.professionalRegistryType);

    if (
      hasRegistryType &&
      !professionalRegistryTypes.includes(value.professionalRegistryType as typeof professionalRegistryTypes[number])
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe um tipo de registro valido.",
        path: ["professionalRegistryType"],
      });
    }

    if (hasRegistryNumber && !hasRegistryType) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe o tipo do registro.",
        path: ["professionalRegistryType"],
      });
    }

    if (hasRegistryType && !hasRegistryNumber) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe o numero do registro.",
        path: ["professionalRegistryNumber"],
      });
    }
  });

export type PartnerSignupInput = z.input<typeof partnerSignupSchema>;
export type PartnerSignupField = keyof PartnerSignupInput;
export type PartnerSignupFieldErrors = Partial<Record<PartnerSignupField, string>>;
