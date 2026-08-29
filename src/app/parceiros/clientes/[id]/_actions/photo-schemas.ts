import { z } from "zod";

const patientIdSchema = z.string().uuid();
const photoAngleSchema = z.enum(["back", "front", "left", "right"]);
const photoMimeSchema = z.enum(["image/jpeg", "image/png", "image/webp"]);
const photoItemInputSchema = z.object({
  angle: photoAngleSchema,
  heightPx: z.number().int().min(1).max(12000).nullable(),
  mimeType: photoMimeSchema,
  originalFilename: z.string().trim().min(1).max(220),
  sizeBytes: z.number().int().min(1).max(15 * 1024 * 1024),
  storagePath: z.string().trim().min(1).max(700),
  widthPx: z.number().int().min(1).max(12000).nullable(),
});

export const photoSessionSchema = z.object({
  capturedAt: z.string().datetime(),
  notes: z.string().trim().max(700).nullable(),
  patientId: patientIdSchema,
  photos: z.array(photoItemInputSchema).min(1).max(4),
  sessionId: z.string().uuid(),
  title: z.string().trim().min(2).max(120),
}).refine((value) => new Set(value.photos.map((photo) => photo.angle)).size === value.photos.length, { message: "Não envie o mesmo ângulo duas vezes." });

export const photoSessionIdSchema = z.object({ patientId: patientIdSchema, sessionId: z.string().uuid() });
export const photoComparisonNoteSchema = z.object({ afterSessionId: z.string().uuid(), beforeSessionId: z.string().uuid(), notes: z.string().trim().min(1).max(500), patientId: patientIdSchema }).refine((value) => value.beforeSessionId !== value.afterSessionId, { message: "Selecione duas sessões diferentes." });
