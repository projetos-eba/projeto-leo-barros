import { muscleGroups, type MuscleGroup } from "./types";

const aliases: Record<string, MuscleGroup> = {
  abdominal: "core",
  abdominais: "core",
  abdomen: "core",
  bicep: "biceps",
  "bíceps": "biceps",
  condicionamento: "cardio_condicionamento",
  costas: "costas",
  gluteo: "gluteos",
  "glúteo": "gluteos",
  "glúteos": "gluteos",
  inferior: "pernas",
  inferiores: "pernas",
  ombro: "ombros",
  perna: "pernas",
  tricep: "triceps",
  "tríceps": "triceps",
};

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");
}

export function normalizeMuscleGroup(value: string | null | undefined): MuscleGroup | null {
  if (!value) return null;
  const normalized = normalizeKey(value);
  if ((muscleGroups as readonly string[]).includes(normalized)) return normalized as MuscleGroup;
  return aliases[normalized] ?? null;
}
