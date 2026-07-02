export type PartnerProtocolFoodCategory =
  | "carne"
  | "cereal"
  | "fruta"
  | "gordura"
  | "laticinio"
  | "leguminosa"
  | "outros"
  | "suplemento"
  | "verdura";

export type PartnerProtocolFoodSource = "custom" | "imported" | "taco" | "tbca";
export type PartnerProtocolStatus = "active" | "archived";

export type PartnerProtocolExerciseMuscleGroup =
  | "biceps"
  | "cardio_condicionamento"
  | "core"
  | "costas"
  | "gluteos"
  | "mobilidade"
  | "ombros"
  | "outros"
  | "peito"
  | "pernas"
  | "triceps";

export type PartnerProtocolExerciseEquipment =
  | "barra"
  | "elastico"
  | "halteres"
  | "kettlebell"
  | "maquina"
  | "outros"
  | "peso_corporal"
  | "polia";

export type PartnerProtocolExerciseLevel = "avancado" | "iniciante" | "intermediario";
export type PartnerProtocolExerciseObjective =
  | "condicionamento"
  | "forca"
  | "hipertrofia"
  | "mobilidade"
  | "reabilitacao"
  | "resistencia";

export type PartnerProtocolFoodRecord = {
  carbs_g: number;
  category: string;
  created_at: string;
  fat_g: number;
  fiber_g: number;
  household_measure: string | null;
  id: string;
  kcal: number;
  name: string;
  notes: string | null;
  partner_id?: string;
  protein_g: number;
  serving_size: number;
  serving_unit: string;
  sodium_mg: number;
  source: string;
  status: string;
  suggested_uses: string[];
  tags: string[];
  updated_at: string;
  usage_count: number;
};

export type PartnerProtocolExerciseRecord = {
  cadence: string | null;
  created_at: string;
  default_reps: string;
  default_sets: number;
  equipment: string;
  id: string;
  instructions: string | null;
  level: string;
  muscle_group: string;
  secondary_muscle_groups?: string[];
  name: string;
  objective: string;
  rest_seconds: number;
  status: string;
  tags: string[];
  thumbnail_url: string | null;
  updated_at: string;
  usage_count: number;
  variations: string[];
  video_url: string | null;
};

export type PartnerProtocolClient = {
  displayName: string;
  email: string;
  id: string;
  status: string;
};

export type PartnerProtocolFood = {
  carbs: number;
  category: PartnerProtocolFoodCategory;
  categoryLabel: string;
  fat: number;
  fiber: number;
  householdMeasure: string | null;
  id: string;
  kcal: number;
  name: string;
  notes: string | null;
  protein: number;
  servingLabel: string;
  servingSize: number;
  servingUnit: string;
  sodium: number;
  source: PartnerProtocolFoodSource;
  sourceLabel: string;
  status: PartnerProtocolStatus;
  suggestedUses: string[];
  tags: string[];
  updatedAt: string;
  usageCount: number;
};

export type PartnerProtocolExercise = {
  cadence: string | null;
  defaultReps: string;
  defaultSets: number;
  equipment: PartnerProtocolExerciseEquipment;
  equipmentLabel: string;
  id: string;
  instructions: string | null;
  level: PartnerProtocolExerciseLevel;
  levelLabel: string;
  muscleGroup: PartnerProtocolExerciseMuscleGroup;
  muscleGroupLabel: string;
  secondaryMuscleGroups?: PartnerProtocolExerciseMuscleGroup[];
  name: string;
  objective: PartnerProtocolExerciseObjective;
  objectiveLabel: string;
  restSeconds: number;
  status: PartnerProtocolStatus;
  tags: string[];
  thumbnailUrl: string | null;
  updatedAt: string;
  usageCount: number;
  variations: string[];
  videoUrl: string | null;
};

export type PartnerProtocolsData = {
  clients: PartnerProtocolClient[];
  exercises: PartnerProtocolExercise[];
  foods: PartnerProtocolFood[];
  metrics: {
    activeExercises: number;
    activeFoods: number;
    customFoods: number;
    exerciseWithoutVideo: number;
    foodWithoutCategory: number;
    importedFoods: number;
  };
  partner: {
    id: string;
    professionalName: string;
    professionalType: string;
  } | null;
  topExercises: PartnerProtocolExercise[];
  topFoods: PartnerProtocolFood[];
};

export type PartnerProtocolsRawData = {
  clients: PartnerProtocolClient[];
  exercises: PartnerProtocolExerciseRecord[];
  foods: PartnerProtocolFoodRecord[];
  partner: PartnerProtocolsData["partner"];
};

export const foodCategoryLabels: Record<PartnerProtocolFoodCategory, string> = {
  carne: "Carne",
  cereal: "Cereal",
  fruta: "Fruta",
  gordura: "Gordura",
  laticinio: "Laticínio",
  leguminosa: "Leguminosa",
  outros: "Outros",
  suplemento: "Suplemento",
  verdura: "Verdura",
};

export const foodSourceLabels: Record<PartnerProtocolFoodSource, string> = {
  custom: "Custom",
  imported: "Importado",
  taco: "TACO",
  tbca: "TBCA",
};

export const muscleGroupLabels: Record<PartnerProtocolExerciseMuscleGroup, string> = {
  biceps: "Bíceps",
  cardio_condicionamento: "Condicionamento",
  core: "Core",
  costas: "Costas",
  gluteos: "Glúteos",
  mobilidade: "Mobilidade",
  ombros: "Ombros",
  outros: "Outros",
  peito: "Peito",
  pernas: "Pernas",
  triceps: "Tríceps",
};

export const equipmentLabels: Record<PartnerProtocolExerciseEquipment, string> = {
  barra: "Barra",
  elastico: "Elástico",
  halteres: "Halteres",
  kettlebell: "Kettlebell",
  maquina: "Máquina",
  outros: "Outros",
  peso_corporal: "Peso corporal",
  polia: "Polia",
};

export const levelLabels: Record<PartnerProtocolExerciseLevel, string> = {
  avancado: "Avançado",
  iniciante: "Iniciante",
  intermediario: "Intermediário",
};

export const objectiveLabels: Record<PartnerProtocolExerciseObjective, string> = {
  condicionamento: "Condicionamento",
  forca: "Força",
  hipertrofia: "Hipertrofia",
  mobilidade: "Mobilidade",
  reabilitacao: "Reabilitação",
  resistencia: "Resistência",
};

export const suggestedUseLabels: Record<string, string> = {
  ceia: "Ceia",
  lanche: "Lanche",
  outro: "Outro",
  pos_treino: "Pós-treino",
  pre_treino: "Pré-treino",
  refeicao_principal: "Refeição principal",
};

const foodCategories = Object.keys(foodCategoryLabels) as PartnerProtocolFoodCategory[];
const foodSources = Object.keys(foodSourceLabels) as PartnerProtocolFoodSource[];
const muscleGroups = Object.keys(muscleGroupLabels) as PartnerProtocolExerciseMuscleGroup[];
const equipments = Object.keys(equipmentLabels) as PartnerProtocolExerciseEquipment[];
const levels = Object.keys(levelLabels) as PartnerProtocolExerciseLevel[];
const objectives = Object.keys(objectiveLabels) as PartnerProtocolExerciseObjective[];

function normalizeNumber(value: number | string | null | undefined) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function asStatus(value: string): PartnerProtocolStatus {
  return value === "archived" ? "archived" : "active";
}

export function parseProtocolTags(value: string | string[]) {
  const parts = Array.isArray(value) ? value : value.split(",");
  return Array.from(new Set(parts.map((part) => part.trim().toLowerCase()).filter(Boolean))).slice(0, 12);
}

export function normalizeProtocolVideoUrl(value: string | null | undefined) {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/watch?v=${id}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = url.pathname.startsWith("/embed/")
        ? url.pathname.split("/")[2]
        : url.searchParams.get("v");
      return id ? `https://www.youtube.com/watch?v=${id}` : null;
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
      return id ? `https://vimeo.com/${id}` : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function parseFoodImportTable(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const delimiter = lines[0].includes("\t") ? "\t" : ";";
  const headers = lines[0].split(delimiter).map((header) => header.trim().toLowerCase());

  function value(row: string[], keys: string[]) {
    const index = headers.findIndex((header) => keys.includes(header));
    return index >= 0 ? row[index]?.trim() ?? "" : "";
  }

  return lines.slice(1).map((line) => {
    const row = line.split(delimiter);
    return {
      carbs_g: normalizeNumber(value(row, ["carboidratos", "carbs", "carbs_g"])),
      category: value(row, ["categoria", "category"]) || "outros",
      fat_g: normalizeNumber(value(row, ["gorduras", "gordura", "fat", "fat_g"])),
      fiber_g: normalizeNumber(value(row, ["fibras", "fibra", "fiber", "fiber_g"])),
      household_measure: value(row, ["medida caseira", "medida", "household_measure"]) || null,
      kcal: normalizeNumber(value(row, ["kcal", "calorias", "calories"])),
      name: value(row, ["nome", "name", "alimento"]),
      protein_g: normalizeNumber(value(row, ["proteinas", "proteínas", "protein", "protein_g"])),
      serving_size: normalizeNumber(value(row, ["porcao", "porção", "serving_size"])) || 100,
      serving_unit: value(row, ["unidade", "unit", "serving_unit"]) || "g",
      sodium_mg: normalizeNumber(value(row, ["sodio", "sódio", "sodium", "sodium_mg"])),
      source: value(row, ["origem", "source"]) || "imported",
    };
  }).filter((row) => row.name.length >= 2);
}

export function buildPartnerProtocolsData(raw: PartnerProtocolsRawData): PartnerProtocolsData {
  const foods = raw.foods.map((row): PartnerProtocolFood => {
    const category = foodCategories.includes(row.category as PartnerProtocolFoodCategory)
      ? row.category as PartnerProtocolFoodCategory
      : "outros";
    const source = foodSources.includes(row.source as PartnerProtocolFoodSource)
      ? row.source as PartnerProtocolFoodSource
      : "custom";
    const servingSize = normalizeNumber(row.serving_size);

    return {
      carbs: normalizeNumber(row.carbs_g),
      category,
      categoryLabel: foodCategoryLabels[category],
      fat: normalizeNumber(row.fat_g),
      fiber: normalizeNumber(row.fiber_g),
      householdMeasure: row.household_measure,
      id: row.id,
      kcal: normalizeNumber(row.kcal),
      name: row.name,
      notes: row.notes,
      protein: normalizeNumber(row.protein_g),
      servingLabel: `${servingSize} ${row.serving_unit}`,
      servingSize,
      servingUnit: row.serving_unit,
      sodium: normalizeNumber(row.sodium_mg),
      source,
      sourceLabel: foodSourceLabels[source],
      status: asStatus(row.status),
      suggestedUses: row.suggested_uses,
      tags: row.tags,
      updatedAt: row.updated_at,
      usageCount: row.usage_count,
    };
  });

  const exercises = raw.exercises.map((row): PartnerProtocolExercise => {
    const muscleGroup = muscleGroups.includes(row.muscle_group as PartnerProtocolExerciseMuscleGroup)
      ? row.muscle_group as PartnerProtocolExerciseMuscleGroup
      : "outros";
    const equipment = equipments.includes(row.equipment as PartnerProtocolExerciseEquipment)
      ? row.equipment as PartnerProtocolExerciseEquipment
      : "outros";
    const level = levels.includes(row.level as PartnerProtocolExerciseLevel)
      ? row.level as PartnerProtocolExerciseLevel
      : "intermediario";
    const objective = objectives.includes(row.objective as PartnerProtocolExerciseObjective)
      ? row.objective as PartnerProtocolExerciseObjective
      : "hipertrofia";

    return {
      cadence: row.cadence,
      defaultReps: row.default_reps,
      defaultSets: row.default_sets,
      equipment,
      equipmentLabel: equipmentLabels[equipment],
      id: row.id,
      instructions: row.instructions,
      level,
      levelLabel: levelLabels[level],
      muscleGroup,
      muscleGroupLabel: muscleGroupLabels[muscleGroup],
      secondaryMuscleGroups: (row.secondary_muscle_groups ?? [])
        .filter((group): group is PartnerProtocolExerciseMuscleGroup => muscleGroups.includes(group as PartnerProtocolExerciseMuscleGroup)),
      name: row.name,
      objective,
      objectiveLabel: objectiveLabels[objective],
      restSeconds: row.rest_seconds,
      status: asStatus(row.status),
      tags: row.tags,
      thumbnailUrl: row.thumbnail_url,
      updatedAt: row.updated_at,
      usageCount: row.usage_count,
      variations: row.variations,
      videoUrl: row.video_url,
    };
  });

  return {
    clients: raw.clients,
    exercises,
    foods,
    metrics: {
      activeExercises: exercises.filter((exercise) => exercise.status === "active").length,
      activeFoods: foods.filter((food) => food.status === "active").length,
      customFoods: foods.filter((food) => food.source === "custom").length,
      exerciseWithoutVideo: exercises.filter((exercise) => exercise.status === "active" && !exercise.videoUrl).length,
      foodWithoutCategory: foods.filter((food) => food.status === "active" && food.category === "outros").length,
      importedFoods: foods.filter((food) => food.source === "imported" || food.source === "taco" || food.source === "tbca").length,
    },
    partner: raw.partner,
    topExercises: [...exercises].sort((a, b) => b.usageCount - a.usageCount).slice(0, 4),
    topFoods: [...foods].sort((a, b) => b.usageCount - a.usageCount).slice(0, 4),
  };
}
