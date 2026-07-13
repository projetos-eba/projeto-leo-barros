import { z } from "zod";

import { OFFICIAL_ROLES } from "./identity-contracts";

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  expectedRole: z.enum(OFFICIAL_ROLES),
});

export const passwordResetUpdateSchema = z
  .object({
    confirmPassword: z.string().min(8).max(72),
    password: z.string().min(8).max(72),
    resetSessionId: z.string().min(24).max(200),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "As senhas nao coincidem.",
    path: ["confirmPassword"],
  });

export type PasswordResetRequestInput = z.input<
  typeof passwordResetRequestSchema
>;

export type PasswordResetUpdateInput = z.input<typeof passwordResetUpdateSchema>;
