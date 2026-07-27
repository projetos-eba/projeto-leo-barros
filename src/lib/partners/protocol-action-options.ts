import type {
  PartnerProtocolExerciseEquipment,
  PartnerProtocolExerciseLevel,
  PartnerProtocolExerciseMuscleGroup,
  PartnerProtocolExerciseObjective,
  PartnerProtocolFoodCategory,
  PartnerProtocolFoodSource,
} from "./protocols-metrics";

export const protocolActionOptions = {
  equipments: ["barra", "halteres", "maquina", "polia", "peso_corporal", "elastico", "kettlebell", "outros"] satisfies PartnerProtocolExerciseEquipment[],
  foodCategories: ["cereal", "carne", "fruta", "gordura", "laticinio", "leguminosa", "suplemento", "verdura", "outros"] satisfies PartnerProtocolFoodCategory[],
  foodSources: ["taco", "tbca", "custom", "imported"] satisfies PartnerProtocolFoodSource[],
  levels: ["iniciante", "intermediario", "avancado"] satisfies PartnerProtocolExerciseLevel[],
  muscleGroups: ["peito", "costas", "pernas", "ombros", "biceps", "triceps", "core", "gluteos", "cardio_condicionamento", "mobilidade", "outros"] satisfies PartnerProtocolExerciseMuscleGroup[],
  objectives: ["forca", "hipertrofia", "resistencia", "mobilidade", "reabilitacao", "condicionamento"] satisfies PartnerProtocolExerciseObjective[],
};
