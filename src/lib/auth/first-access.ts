import { z } from "zod";

export const firstAccessSchema = z
  .object({
    confirmPassword: z.string().min(8).max(72),
    email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
    password: z.string().min(8).max(72),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "As senhas nao coincidem.",
    path: ["confirmPassword"],
  });

export type FirstAccessInput = z.input<typeof firstAccessSchema>;
