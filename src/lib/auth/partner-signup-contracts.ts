import { z } from "zod";

export const professionalTypes = [
  "personal_trainer",
  "nutricionista",
  "medico",
] as const;

export const partnerSignupSchema = z
  .object({
    confirmPassword: z.string().min(8).max(72),
    displayName: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
    password: z.string().min(8).max(72),
    phone: z.string().trim().regex(/^\+[1-9][0-9]{7,14}$/),
    professionalRegistryNumber: z.string().trim().max(64).optional(),
    professionalRegistryType: z.string().trim().max(24).optional(),
    professionalType: z.enum(professionalTypes),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "As senhas nao coincidem.",
    path: ["confirmPassword"],
  })
  .refine(
    (value) =>
      Boolean(value.professionalRegistryNumber) ===
      Boolean(value.professionalRegistryType),
    {
      message: "Informe tipo e numero do registro profissional.",
      path: ["professionalRegistryNumber"],
    },
  );

export type PartnerSignupInput = z.input<typeof partnerSignupSchema>;
