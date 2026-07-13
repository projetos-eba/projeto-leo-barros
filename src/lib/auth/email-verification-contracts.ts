import { z } from "zod";

import { OFFICIAL_ROLES } from "./identity-contracts";

export const emailVerificationTokenSchema = z.object({
  token: z.string().min(32).max(200),
});

export const emailVerificationStatusSchema = z.object({
  profileId: z.string().uuid(),
  role: z.enum(OFFICIAL_ROLES).refine((role) => role !== "admin", {
    message: "Role sem confirmacao publica.",
  }),
});

export const emailVerificationPurposes = [
  "client_first_access",
  "partner_signup",
  "admin_approval",
] as const;

export type EmailVerificationPurpose =
  (typeof emailVerificationPurposes)[number];
export type EmailVerificationStatusInput = z.input<
  typeof emailVerificationStatusSchema
>;
