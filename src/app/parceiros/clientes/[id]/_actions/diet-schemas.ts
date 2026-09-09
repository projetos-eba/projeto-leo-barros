import { z } from "zod";

const patientIdSchema = z.string().uuid();

const dietPlanFields = {
  calorieStrategy: z.enum(["deficit", "maintenance", "surplus"]),
  notes: z.string().trim().max(2000).nullable(),
  patientId: patientIdSchema,
  targetCarbsG: z.number().min(0).max(2000),
  targetFatG: z.number().min(0).max(1000),
  targetFiberMaxG: z.number().min(0).max(500).nullable(),
  targetFiberMinG: z.number().min(0).max(500).nullable(),
  targetKcal: z.number().int().min(0).max(20000),
  targetProteinG: z.number().min(0).max(2000),
  title: z.string().trim().min(2).max(140),
  waterLiters: z.number().min(0).max(15),
};

function validateFiberTarget(
  data: { targetFiberMaxG: number | null; targetFiberMinG: number | null },
  context: z.RefinementCtx,
) {
  if ((data.targetFiberMinG === null) !== (data.targetFiberMaxG === null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Informe a faixa completa de fibra.", path: ["targetFiberMinG"] });
  }
  if (data.targetFiberMinG !== null && data.targetFiberMaxG !== null && data.targetFiberMaxG < data.targetFiberMinG) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "A meta máxima de fibra deve ser maior ou igual à mínima.", path: ["targetFiberMaxG"] });
  }
}

export const dietPlanSchema = z.object(dietPlanFields).superRefine(validateFiberTarget);
export const dietPlanIdSchema = z.object({ patientId: patientIdSchema, planId: z.string().uuid() });
export const dietPlanTargetsSchema = z.object({
  calorieStrategy: dietPlanFields.calorieStrategy,
  patientId: patientIdSchema,
  planId: z.string().uuid(),
  targetCarbsG: dietPlanFields.targetCarbsG,
  targetFatG: dietPlanFields.targetFatG,
  targetFiberMaxG: dietPlanFields.targetFiberMaxG,
  targetFiberMinG: dietPlanFields.targetFiberMinG,
  targetKcal: dietPlanFields.targetKcal,
  targetProteinG: dietPlanFields.targetProteinG,
  waterLiters: dietPlanFields.waterLiters,
}).superRefine(validateFiberTarget);
export const dietNotesSchema = z.object({ notes: z.string().trim().max(2000).nullable(), patientId: patientIdSchema, planId: z.string().uuid() });
export const dietMealSchema = z.object({ dayOfWeek: z.number().int().min(1).max(7), mealTime: z.string().regex(/^\d{2}:\d{2}$/), menuOption: z.number().int().min(1).max(4).default(1), optionLabel: z.string().trim().min(2).max(40).default("Cardápio 1"), patientId: patientIdSchema, planId: z.string().uuid(), title: z.string().trim().min(2).max(80) });
export const dietMealIdSchema = z.object({ mealId: z.string().uuid(), patientId: patientIdSchema, planId: z.string().uuid() });
export const dietItemSchema = z.object({ draftId: z.string().uuid().nullable(), foodId: z.string().uuid(), mealId: z.string().uuid(), patientId: patientIdSchema, planId: z.string().uuid(), quantity: z.number().min(0.01).max(100000) });
export const dietItemUpdateSchema = z.object({ itemId: z.string().uuid(), patientId: patientIdSchema, planId: z.string().uuid(), quantity: z.number().min(0.01).max(100000) });
export const dietItemIdSchema = z.object({ itemId: z.string().uuid(), patientId: patientIdSchema, planId: z.string().uuid() });
