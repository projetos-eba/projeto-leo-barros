import { z } from "zod";

const patientIdSchema = z.string().uuid();
const circumferenceKeys = ["chest", "waist", "abdomen", "hip", "right_arm_relaxed", "right_arm_contracted", "left_arm_relaxed", "left_arm_contracted", "right_forearm", "left_forearm", "right_thigh", "left_thigh", "right_calf", "left_calf"] as const;
const skinfoldKeys = ["biceps", "pectoral", "abdominal", "triceps", "subscapular", "axillary", "suprailiac", "thigh", "medial_calf"] as const;
const activityLevelSchema = z.enum(["sedentary", "light", "moderate", "active", "athlete"]);
const formulaSchema = z.enum(["mifflin", "harris_benedict", "cunningham", "tinsley"]);
const assessmentMethodSchema = z.enum(["guedes_3", "jackson_pollock_3", "durnin_womersley_4", "faulkner_4", "jackson_pollock_7", "bioimpedance", "manual"]);

export const assessmentSchema = z.object({
  activityLevel: activityLevelSchema,
  assessmentMethod: assessmentMethodSchema,
  assessedAt: z.string().datetime(),
  assessmentId: z.string().uuid().optional(),
  bodyFatPercentage: z.number().min(1).max(80).nullable(),
  circumferences: z.array(z.object({ metricKey: z.enum(circumferenceKeys), valueCm: z.number().min(5).max(250) })).max(circumferenceKeys.length),
  heightCm: z.number().min(80).max(260),
  muscleMassKg: z.number().min(5).max(200).nullable(),
  notes: z.string().trim().max(700).nullable(),
  patientId: patientIdSchema,
  skinfolds: z.array(z.object({ metricKey: z.enum(skinfoldKeys), valueMm: z.number().min(1).max(100) })).max(skinfoldKeys.length),
  targetDays: z.number().int().min(7).max(730),
  targetWeightKg: z.number().min(20).max(350).nullable(),
  title: z.string().trim().min(3).max(100),
  weightKg: z.number().min(20).max(350),
});

export const calorieCalculationSchema = z.object({
  activityFactor: z.number().min(1).max(2.5), assessmentId: z.string().uuid().nullable(), bmrKcal: z.number().int().positive(), dailyEnergyDeltaKcal: z.number().int(), formula: formulaSchema, inputs: z.record(z.unknown()), patientId: patientIdSchema, projectedWeightDeltaKg: z.number().min(-200).max(200), targetDays: z.number().int().min(7).max(730), targetKcal: z.number().int().positive(), targetWeightKg: z.number().min(20).max(350).nullable(), tdeeKcal: z.number().int().positive(), weeklyEnergyDeltaKcal: z.number().int(),
});

export const completeClientProfileSchema = z.object({
  biologicalSex: z.enum(["female", "male", "not_informed"]), birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), objective: z.string().trim().min(2).max(120), patientId: patientIdSchema,
});

export const applyCalculationSchema = z.object({ calculationId: z.string().uuid(), patientId: patientIdSchema });
