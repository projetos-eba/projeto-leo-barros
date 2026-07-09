import { z } from "zod";

export const emailVerificationTokenSchema = z.object({
  token: z.string().min(32).max(200),
});

export const emailVerificationPurposes = [
  "client_first_access",
  "partner_signup",
  "admin_approval",
] as const;

export type EmailVerificationPurpose =
  (typeof emailVerificationPurposes)[number];
