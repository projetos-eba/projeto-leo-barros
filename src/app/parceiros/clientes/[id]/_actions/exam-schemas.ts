import { z } from "zod";

const patientIdSchema = z.string().uuid();
const referenceSexSchema = z.enum(["female", "male", "unisex"]);
const referenceSchema = z.object({ highValue: z.number().min(0).max(1000000).nullable(), lowValue: z.number().min(0).max(1000000).nullable(), sex: referenceSexSchema }).refine((value) => value.lowValue !== null || value.highValue !== null, { message: "Informe pelo menos um limite." });
const alternativeUnitSchema = z.object({ factorFromDefault: z.number().positive().max(1000000), unit: z.string().trim().min(1).max(30) });
const resultSchema = z.object({ examId: z.string().uuid(), notes: z.string().trim().max(300).nullable(), unit: z.string().trim().min(1).max(30), value: z.number().min(0).max(1000000) });

export const examCollectionSchema = z.object({ collectedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), notes: z.string().trim().max(700).nullable(), patientId: patientIdSchema, results: z.array(resultSchema).min(1).max(140), title: z.string().trim().min(2).max(140) });
export const examCollectionIdSchema = z.object({ collectionId: z.string().uuid(), patientId: patientIdSchema });
export const examDefinitionSchema = z.object({ alternativeUnits: z.array(alternativeUnitSchema).max(8), categoryId: z.string().uuid(), defaultUnit: z.string().trim().min(1).max(30), definitionId: z.string().uuid().nullable(), name: z.string().trim().min(2).max(160), notes: z.string().trim().max(700).nullable(), references: z.array(referenceSchema).min(1).max(3), slug: z.string().trim().regex(/^[a-z0-9_]+$/).min(2).max(80) });
export const examDefinitionIdSchema = z.object({ definitionId: z.string().uuid(), patientId: patientIdSchema.optional() });
export const examCategorySchema = z.object({ name: z.string().trim().min(2).max(120), patientId: patientIdSchema.optional() });
