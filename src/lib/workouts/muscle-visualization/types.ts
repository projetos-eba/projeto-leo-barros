export const muscleGroups = [
  "biceps",
  "cardio_condicionamento",
  "core",
  "costas",
  "gluteos",
  "mobilidade",
  "ombros",
  "outros",
  "peito",
  "pernas",
  "triceps",
] as const;

export type MuscleGroup = (typeof muscleGroups)[number];

export type MappableMuscleGroup = Exclude<
  MuscleGroup,
  "cardio_condicionamento" | "mobilidade" | "outros"
>;

export type MuscleHeatInput = {
  group: string;
  level: 1 | 2 | 3;
  score: number;
};

export type MusclePreviewView =
  | "upper-front"
  | "upper-back"
  | "lower-front"
  | "lower-back";

export type MuscleAssetLayer = {
  asset: string;
  group: MappableMuscleGroup;
  height: number;
  id: string;
  left: number;
  top: number;
  width: number;
};

export type MusclePreviewLayer = MuscleAssetLayer & {
  level: 1 | 2 | 3;
  opacity: number;
  score: number;
};

export type WorkoutMusclePreviewModel = {
  groups: MappableMuscleGroup[];
  layers: MusclePreviewLayer[];
  view: MusclePreviewView | null;
};
