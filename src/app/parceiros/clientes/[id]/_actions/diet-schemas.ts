import { z } from "zod";

const patientIdSchema = z.string().uuid();

export const dietPlanSchema = z.object({ calorieStrategy: z.enum(["deficit", "maintenance", "surplus"]), notes: z.string().trim().max(2000).nullable(), patientId: patientIdSchema, targetCarbsG: z.number().min(0).max(2000), targetFatG: z.number().min(0).max(1000), targetKcal: z.number().int().min(0).max(20000), targetProteinG: z.number().min(0).max(2000), title: z.string().trim().min(2).max(140), waterLiters: z.number().min(0).max(15) });
export const dietPlanIdSchema = z.object({ patientId: patientIdSchema, planId: z.string().uuid() });
export const dietPlanTargetsSchema = dietPlanSchema.pick({ calorieStrategy: true, targetCarbsG: true, targetFatG: true, targetKcal: true, targetProteinG: true, waterLiters: true }).extend({ patientId: patientIdSchema, planId: z.string().uuid() });
export const dietNotesSchema = z.object({ notes: z.string().trim().max(2000).nullable(), patientId: patientIdSchema, planId: z.string().uuid() });
export const dietMealSchema = z.object({ dayOfWeek: z.number().int().min(1).max(7), mealTime: z.string().regex(/^\d{2}:\d{2}$/), menuOption: z.number().int().min(1).max(4).default(1), optionLabel: z.string().trim().min(2).max(40).default("Cardápio 1"), patientId: patientIdSchema, planId: z.string().uuid(), title: z.string().trim().min(2).max(80) });
export const dietMealIdSchema = z.object({ mealId: z.string().uuid(), patientId: patientIdSchema, planId: z.string().uuid() });
export const dietItemSchema = z.object({ draftId: z.string().uuid().nullable(), foodId: z.string().uuid(), mealId: z.string().uuid(), patientId: patientIdSchema, planId: z.string().uuid(), quantity: z.number().min(0.01).max(100000) });
export const dietItemUpdateSchema = z.object({ itemId: z.string().uuid(), patientId: patientIdSchema, planId: z.string().uuid(), quantity: z.number().min(0.01).max(100000) });
export const dietItemIdSchema = z.object({ itemId: z.string().uuid(), patientId: patientIdSchema, planId: z.string().uuid() });
