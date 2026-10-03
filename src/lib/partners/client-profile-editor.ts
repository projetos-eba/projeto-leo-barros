import { z } from "zod";

export const clientBioSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && date <= new Date();
  }),
  biologicalSex: z.enum(["female", "male", "not_informed"]),
  objective: z.string().trim().min(1).max(120),
});
export const clientProfileEditorSchema = clientBioSchema.extend({
  patientId: z.string().uuid(),
  displayName: z.string().trim().min(2).max(160),
  phone: z.string().trim().refine((value) => !value || /^\+[1-9]\d{7,14}$/.test(value)),
});
export type ClientBioDraft = z.infer<typeof clientBioSchema>;
export type ClientProfileEditorData = ClientBioDraft & { displayName: string; email: string; phone: string };
