import { z } from "zod";

import { cardioActivityKeys } from "@/lib/partners/client-profile/cardio";

const patientIdSchema = z.string().uuid();
const cardioActivitySchema = z.enum(cardioActivityKeys);
const cardioZoneSchema = z.enum(["z1", "z2", "z3", "z4", "z5"]);

export const cardioCalculationInputSchema = z.object({
  activityKey: cardioActivitySchema,
  comparisonActivityKey: cardioActivitySchema,
  durationMinutes: z.number().int().min(1).max(600),
  patientId: patientIdSchema,
  planId: z.string().uuid(),
  targetZone: cardioZoneSchema,
  weeklyTargetMinutes: z.number().int().min(0).max(3000),
  weightKg: z.number().min(20).max(350),
});

export const cardioSessionSchema = z.object({
  activityKey: cardioActivitySchema,
  durationMinutes: z.number().int().min(1).max(600),
  notes: z.string().trim().max(400).nullable(),
  patientId: patientIdSchema,
  performedAt: z.string().datetime(),
  planId: z.string().uuid(),
  targetZone: cardioZoneSchema,
  weightKg: z.number().min(20).max(350),
});

export const cardioSessionIdSchema = z.object({
  patientId: patientIdSchema,
  planId: z.string().uuid(),
  sessionId: z.string().uuid(),
});
