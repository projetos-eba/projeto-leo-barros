export type AssessmentFormula = "mifflin" | "harris_benedict" | "cunningham" | "tinsley";
export type AssessmentActivityLevel = "sedentary" | "light" | "moderate" | "active" | "athlete";
export type AssessmentMethod =
  | "guedes_3"
  | "jackson_pollock_3"
  | "durnin_womersley_4"
  | "faulkner_4"
  | "jackson_pollock_7"
  | "bioimpedance"
  | "manual";
export type AssessmentGender = "female" | "male" | "non_binary" | "other" | "not_informed" | null;
export type AssessmentBiologicalSex = "female" | "male" | "not_informed";

export type PartnerClientAssessmentRawData = {
  assessments: PartnerClientAssessmentRawAssessment[];
  calculations: PartnerClientAssessmentRawCalculation[];
  goals: {
    adherenceTargetPct: number;
    targetBodyFatMaxPct: number | null;
    targetBodyFatMinPct: number | null;
    targetWeightKg: number | null;
  } | null;
  identity: {
    birthDate: string | null;
    displayName: string;
    email: string;
    gender: AssessmentGender;
    biologicalSex: AssessmentBiologicalSex;
    objective: string | null;
    patientId: string;
    serviceScopes: string[];
    status: string;
  };
};

export type PartnerClientAssessmentRawAssessment = {
  activityLevel: AssessmentActivityLevel;
  assessmentMethod?: AssessmentMethod;
  assessedAt: string;
  bodyFatPercentage: number | null;
  calculations: PartnerClientAssessmentRawCalculation[];
  circumferences: Array<{
    id: string;
    metricKey: string;
    valueCm: number;
  }>;
  heightCm: number;
  id: string;
  muscleMassKg: number | null;
  notes: string | null;
  skinfolds?: Array<{
    id: string;
    metricKey: string;
    valueMm: number;
  }>;
  targetDays: number;
  targetWeightKg: number | null;
  title: string;
  weightKg: number;
};

export type PartnerClientAssessmentRawCalculation = {
  activityFactor: number;
  assessmentId?: string | null;
  bmrKcal: number;
  createdAt: string;
  dailyEnergyDeltaKcal: number;
  formula: AssessmentFormula;
  id: string;
  inputs: Record<string, unknown>;
  projectedWeightDeltaKg: number;
  status: "saved" | "applied" | "archived";
  targetDays: number;
  targetKcal: number;
  targetWeightKg: number | null;
  tdeeKcal: number;
  weeklyEnergyDeltaKcal: number;
};

export type CalorieCalculationInput = {
  activityLevel: AssessmentActivityLevel;
  age: number;
  bodyFatPercentage: number | null;
  formula: AssessmentFormula;
  biologicalSex: AssessmentBiologicalSex;
  heightCm: number;
  targetDays: number;
  targetWeightKg: number | null;
  weightKg: number;
};

export type CalorieCalculation = {
  activityFactor: number;
  activityLabel: string;
  bmrKcal: number;
  dailyEnergyDeltaKcal: number;
  formula: AssessmentFormula;
  formulaLabel: string;
  projectedWeightDeltaKg: number;
  strategyLabel: string;
  targetDays: number;
  targetKcal: number;
  targetWeightKg: number | null;
  tdeeKcal: number;
  weeklyEnergyDeltaKcal: number;
};

export type PartnerClientAssessmentsData = {
  calculations: PartnerClientAssessmentRawCalculation[];
  calorie: {
    comparison: CalorieCalculation[];
    latestApplied: PartnerClientAssessmentRawCalculation | null;
    projection: Array<{
      day: number;
      goalKcal: number;
      maintenanceKcal: number;
      weightKg: number;
    }>;
    selected: CalorieCalculation | null;
  };
  charts: {
    compositionSeries: Array<Record<string, number | string | null>>;
    circumferenceSeries: Array<Record<string, number | string | null>>;
    skinfoldSeries: Array<Record<string, number | string | null>>;
  };
  client: {
    age: number | null;
    birthDate: string | null;
    gender: AssessmentGender;
    biologicalSex: AssessmentBiologicalSex;
    id: string;
    name: string;
    objective: string | null;
  };
  circumferences: {
    availableMetrics: Array<{
      key: string;
      label: string;
    }>;
    latest: Array<{
      delta: number | null;
      key: string;
      label: string;
      valueCm: number;
    }>;
  };
  skinfolds: {
    availableMetrics: Array<{
      key: string;
      label: string;
      region: string;
    }>;
    latest: Array<{
      delta: number | null;
      key: string;
      label: string;
      region: string;
      valueMm: number;
    }>;
  };
  generatedAt: string;
  history: Array<{
    assessmentMethod: AssessmentMethod;
    assessedAt: string;
    bmi: number;
    bmiClassification: string;
    bodyFatPercentage: number | null;
    dateLabel: string;
    fatMassKg: number | null;
    ffmi: number | null;
    heightCm: number;
    id: string;
    leanMassKg: number | null;
    notes: string | null;
    sumSkinfoldsMm: number | null;
    targetDays: number;
    targetWeightKg: number | null;
    title: string;
    weightKg: number;
  }>;
  kpis: {
    bodyFat: AssessmentKpi;
    bmi: AssessmentKpi & { classification: string };
    ffmi: AssessmentKpi;
    lastAssessment: {
      dateLabel: string;
      daysAgoLabel: string;
      value: string;
    };
    leanMass: AssessmentKpi;
    muscleMass: AssessmentKpi;
    weight: AssessmentKpi;
  };
  latestAssessment: PartnerClientAssessment | null;
  records: PartnerClientAssessment[];
  formulaEligibility: Record<AssessmentFormula, { status: "available" | "invalid_inputs" | "missing_inputs"; reason: string | null }>;
};

export type PartnerClientAssessment = Omit<PartnerClientAssessmentRawAssessment, "calculations" | "circumferences" | "skinfolds"> & {
  assessmentMethod: AssessmentMethod;
  bmi: number;
  bmiClassification: string;
  calculations: PartnerClientAssessmentRawCalculation[];
  circumferences: Array<{
    id: string;
    label: string;
    metricKey: string;
    valueCm: number;
  }>;
  fatMassKg: number | null;
  ffmi: number | null;
  leanMassKg: number | null;
  sumSkinfoldsMm: number | null;
  skinfolds: Array<{
    id: string;
    label: string;
    metricKey: string;
    region: string;
    valueMm: number;
  }>;
};

export type AssessmentKpi = {
  delta: number | null;
  helper: string;
  label: string;
  value: number | null;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export const activityLevels: Record<AssessmentActivityLevel, { factor: number; label: string; shortLabel: string }> = {
  active: { factor: 1.725, label: "Muito ativo - exercicio intenso 6-7x por semana", shortLabel: "Muito ativo" },
  athlete: { factor: 1.9, label: "Extremamente ativo - rotina intensa ou dupla sessão", shortLabel: "Extremamente ativo" },
  light: { factor: 1.375, label: "Levemente ativo - exercício 1-3x por semana", shortLabel: "Levemente ativo" },
  moderate: { factor: 1.55, label: "Moderadamente ativo - exercício 3-5x por semana", shortLabel: "Moderadamente ativo" },
  sedentary: { factor: 1.2, label: "Sedentário - pouca atividade física", shortLabel: "Sedentário" },
};

export const formulaLabels: Record<AssessmentFormula, string> = {
  cunningham: "Cunningham",
  harris_benedict: "Harris-Benedict",
  mifflin: "Mifflin-St Jeor",
  tinsley: "Tinsley",
};

export const assessmentMethodLabels: Record<AssessmentMethod, string> = {
  bioimpedance: "Bioimpedância",
  durnin_womersley_4: "4 dobras Durnin & Womersley",
  faulkner_4: "4 dobras Faulkner",
  guedes_3: "3 dobras Guedes",
  jackson_pollock_3: "3 dobras Jackson & Pollock",
  jackson_pollock_7: "7 dobras Jackson, Pollock & Ward",
  manual: "Manual técnico",
};

export function normalizeAssessmentMethod(value: string | null | undefined): AssessmentMethod {
  if (value === "pollock_7") return "jackson_pollock_7";
  if (value === "pollock_3") return "jackson_pollock_3";
  if (value && Object.hasOwn(assessmentMethodLabels, value)) return value as AssessmentMethod;
  return "jackson_pollock_7";
}

export const circumferenceLabels: Record<string, string> = {
  abdomen: "Abdômen",
  chest: "Tórax",
  hip: "Quadril",
  left_arm_contracted: "Braço E. contraído",
  left_arm_relaxed: "Braço E. relaxado",
  left_calf: "Panturrilha E.",
  left_forearm: "Antebraço E.",
  left_thigh: "Coxa E.",
  right_arm_contracted: "Braço D. contraído",
  right_arm_relaxed: "Braço D. relaxado",
  right_calf: "Panturrilha D.",
  right_forearm: "Antebraço D.",
  right_thigh: "Coxa D.",
  waist: "Cintura",
};

const circumferenceOrder = [
  "chest",
  "waist",
  "abdomen",
  "hip",
  "right_arm_relaxed",
  "right_arm_contracted",
  "left_arm_relaxed",
  "left_arm_contracted",
  "right_forearm",
  "left_forearm",
  "right_thigh",
  "left_thigh",
  "right_calf",
  "left_calf",
];

export const skinfoldLabels: Record<string, string> = {
  abdominal: "Abdominal",
  axillary: "Axilar média",
  biceps: "Bicipital",
  medial_calf: "Panturrilha medial",
  pectoral: "Peitoral",
  subscapular: "Subescapular",
  suprailiac: "Suprailíaca",
  thigh: "Coxa",
  triceps: "Tricipital",
};

export const skinfoldRegions: Record<string, string> = {
  abdominal: "Tronco",
  axillary: "Tronco",
  biceps: "Membros superiores",
  medial_calf: "Membros inferiores",
  pectoral: "Tronco",
  subscapular: "Tronco",
  suprailiac: "Tronco",
  thigh: "Membros inferiores",
  triceps: "Membros superiores",
};

const skinfoldOrder = [
  "biceps",
  "pectoral",
  "abdominal",
  "triceps",
  "subscapular",
  "axillary",
  "suprailiac",
  "thigh",
  "medial_calf",
];

export const assessmentProtocolSkinfolds: Record<AssessmentMethod, string[]> = {
  bioimpedance: [],
  durnin_womersley_4: ["biceps", "triceps", "subscapular", "suprailiac"],
  faulkner_4: ["triceps", "subscapular", "suprailiac", "abdominal"],
  guedes_3: ["triceps", "suprailiac", "abdominal"],
  jackson_pollock_3: ["pectoral", "abdominal", "thigh"],
  jackson_pollock_7: ["pectoral", "axillary", "triceps", "subscapular", "abdominal", "suprailiac", "thigh"],
  manual: [],
};

export function assessmentMethodUsesSkinfoldFormula(method: AssessmentMethod) {
  return assessmentProtocolSkinfolds[method].length > 0;
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

function roundInt(value: number) {
  return Math.round(value);
}

export function buildDynamicNumberDomain(values: Array<number | null | undefined>, paddingRatio = 0.1): [number, number] {
  const cleanValues = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (cleanValues.length === 0) return [0, 1];

  const min = Math.min(...cleanValues);
  const max = Math.max(...cleanValues);
  const range = Math.max(max - min, Math.max(Math.abs(max), 1) * 0.08);
  const padding = Math.max(range * paddingRatio, 1);

  return [
    Math.max(0, Math.floor(min - padding)),
    Math.ceil(max + padding),
  ];
}

export function buildChartDomain(
  rows: Array<Record<string, number | string | null>>,
  keys: string[],
  paddingRatio = 0.1,
): [number, number] {
  return buildDynamicNumberDomain(
    rows.flatMap((row) => keys.map((key) => row[key]).filter((value): value is number => typeof value === "number")),
    paddingRatio,
  );
}

export function calculateAgeFromBirthDate(birthDate: string | null, now: Date) {
  if (!birthDate) return null;
  const date = new Date(`${birthDate}T12:00:00`);
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) age -= 1;
  return age > 0 ? age : null;
}

function delta(current: number | null, previous: number | null) {
  if (current === null || previous === null) return null;
  return roundOne(current - previous);
}

function bmiClassification(bmi: number) {
  if (bmi < 18.5) return "Abaixo do peso";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Sobrepeso";
  if (bmi < 35) return "Obesidade I";
  if (bmi < 40) return "Obesidade II";
  return "Obesidade III";
}

export function getFormulaEligibility(input: Omit<CalorieCalculationInput, "formula">): PartnerClientAssessmentsData["formulaEligibility"] {
  const invalidCommon = !Number.isFinite(input.age) || input.age <= 0
    || !Number.isFinite(input.heightCm) || input.heightCm < 80
    || !Number.isFinite(input.weightKg) || input.weightKg < 20
    || !Number.isFinite(input.targetDays) || input.targetDays < 7;
  if (invalidCommon) {
    return Object.fromEntries((Object.keys(formulaLabels) as AssessmentFormula[]).map((formula) => [
      formula,
      { status: "invalid_inputs", reason: "Revise idade, peso, altura e prazo da avaliação." },
    ])) as PartnerClientAssessmentsData["formulaEligibility"];
  }
  const hasBodyComposition = input.bodyFatPercentage !== null;
  const validBodyComposition = !hasBodyComposition || (Number.isFinite(input.bodyFatPercentage) && input.bodyFatPercentage! >= 1 && input.bodyFatPercentage! <= 80);
  return {
    mifflin: input.biologicalSex === "not_informed" ? { status: "missing_inputs", reason: "Informe o sexo biológico para esta fórmula." } : { status: "available", reason: null },
    harris_benedict: input.biologicalSex === "not_informed" ? { status: "missing_inputs", reason: "Informe o sexo biológico para esta fórmula." } : { status: "available", reason: null },
    cunningham: !validBodyComposition
      ? { status: "invalid_inputs", reason: "Revise o percentual de gordura da avaliação." }
      : hasBodyComposition
        ? { status: "available", reason: null }
        : { status: "missing_inputs", reason: "Informe a composição corporal para esta fórmula." },
    tinsley: { status: "available", reason: null },
  };
}

export function calculateBmi(weightKg: number, heightCm: number) {
  return roundOne(weightKg / ((heightCm / 100) ** 2));
}

export function calculateFfmi(leanMassKg: number | null, heightCm: number) {
  if (leanMassKg === null) return null;
  return roundOne(leanMassKg / ((heightCm / 100) ** 2));
}

export function calculateLeanMass(weightKg: number, bodyFatPercentage: number | null) {
  if (bodyFatPercentage === null) return null;
  return roundOne(weightKg * (1 - bodyFatPercentage / 100));
}

export function calculateFatMass(weightKg: number, bodyFatPercentage: number | null) {
  if (bodyFatPercentage === null) return null;
  return roundOne(weightKg * bodyFatPercentage / 100);
}

export type PhysicalAssessmentCalculationInput = {
  age: number | null;
  assessmentMethod: AssessmentMethod;
  biologicalSex: AssessmentBiologicalSex;
  bodyFatPercentage: number | null;
  heightCm: number;
  skinfolds: Array<{
    metricKey: string;
    valueMm: number;
  }>;
  weightKg: number;
};

export type PhysicalAssessmentCalculation = {
  bodyFatPercentage: number | null;
  fatMassKg: number | null;
  ffmi: number | null;
  leanMassKg: number | null;
  reason: string | null;
  status: "calculated" | "manual" | "missing_inputs" | "invalid_inputs";
  sumSkinfoldsMm: number | null;
};

export function calculatePhysicalAssessment(input: PhysicalAssessmentCalculationInput): PhysicalAssessmentCalculation {
  const requiredSkinfolds = assessmentProtocolSkinfolds[input.assessmentMethod];
  const manualResult = (status: PhysicalAssessmentCalculation["status"], bodyFatPercentage: number | null, reason: string | null): PhysicalAssessmentCalculation => {
    const leanMassKg = calculateLeanMass(input.weightKg, bodyFatPercentage);
    return {
      bodyFatPercentage,
      fatMassKg: calculateFatMass(input.weightKg, bodyFatPercentage),
      ffmi: calculateFfmi(leanMassKg, input.heightCm),
      leanMassKg,
      reason,
      status,
      sumSkinfoldsMm: null,
    };
  };

  if (requiredSkinfolds.length === 0) {
    if (input.bodyFatPercentage === null) {
      return manualResult("missing_inputs", null, "Informe o percentual de gordura para este método.");
    }
    return manualResult("manual", input.bodyFatPercentage, null);
  }

  if (input.biologicalSex === "not_informed") {
    return manualResult("missing_inputs", null, "Informe o sexo biológico para calcular o protocolo.");
  }
  if (!input.age || input.age <= 0) {
    return manualResult("missing_inputs", null, "Informe a data de nascimento para calcular o protocolo.");
  }

  const valuesByKey = new Map(input.skinfolds.map((skinfold) => [skinfold.metricKey, skinfold.valueMm]));
  const missing = requiredSkinfolds.filter((key) => {
    const value = valuesByKey.get(key);
    return typeof value !== "number" || !Number.isFinite(value) || value <= 0;
  });
  if (missing.length > 0) {
    return manualResult("missing_inputs", null, "Preencha todas as dobras exigidas pelo protocolo.");
  }

  const sumSkinfoldsMm = requiredSkinfolds.reduce((total, key) => total + Number(valuesByKey.get(key)), 0);
  if (sumSkinfoldsMm <= 0) {
    return manualResult("invalid_inputs", null, "Revise as dobras cutâneas informadas.");
  }

  const male = input.biologicalSex === "male";
  let bodyFatPercentage = 0;

  if (input.assessmentMethod === "guedes_3") {
    const density = male
      ? 1.17136 - 0.06706 * Math.log10(sumSkinfoldsMm)
      : 1.16650 - 0.07063 * Math.log10(sumSkinfoldsMm);
    bodyFatPercentage = ((4.95 / density) - 4.50) * 100;
  } else if (input.assessmentMethod === "jackson_pollock_3") {
    const density = male
      ? 1.10938 - (0.0008267 * sumSkinfoldsMm) + (0.0000016 * sumSkinfoldsMm ** 2) - (0.0002574 * input.age)
      : 1.0994921 - (0.0009929 * sumSkinfoldsMm) + (0.0000023 * sumSkinfoldsMm ** 2) - (0.0001392 * input.age);
    bodyFatPercentage = ((4.95 / density) - 4.50) * 100;
  } else if (input.assessmentMethod === "durnin_womersley_4") {
    let c = 1.1620;
    let m = 0.0630;
    if (male) {
      if (input.age < 20) { c = 1.1620; m = 0.0630; }
      else if (input.age < 30) { c = 1.1631; m = 0.0632; }
      else if (input.age < 40) { c = 1.1422; m = 0.0544; }
      else if (input.age < 50) { c = 1.1620; m = 0.0700; }
      else { c = 1.1715; m = 0.0779; }
    } else {
      if (input.age < 20) { c = 1.1549; m = 0.0678; }
      else if (input.age < 30) { c = 1.1599; m = 0.0717; }
      else if (input.age < 40) { c = 1.1423; m = 0.0632; }
      else if (input.age < 50) { c = 1.1333; m = 0.0612; }
      else { c = 1.1339; m = 0.0645; }
    }
    const density = c - (m * Math.log10(sumSkinfoldsMm));
    bodyFatPercentage = ((4.95 / density) - 4.50) * 100;
  } else if (input.assessmentMethod === "faulkner_4") {
    bodyFatPercentage = (sumSkinfoldsMm * 0.153) + 5.783;
  } else {
    const density = male
      ? 1.112 - (0.00043499 * sumSkinfoldsMm) + (0.00000055 * sumSkinfoldsMm ** 2) - (0.00028826 * input.age)
      : 1.097 - (0.00046971 * sumSkinfoldsMm) + (0.00000056 * sumSkinfoldsMm ** 2) - (0.00012828 * input.age);
    bodyFatPercentage = ((4.95 / density) - 4.50) * 100;
  }

  if (!Number.isFinite(bodyFatPercentage)) {
    return manualResult("invalid_inputs", null, "Não foi possível calcular com os dados informados.");
  }

  bodyFatPercentage = roundOne(Math.max(2, Math.min(60, bodyFatPercentage)));
  const leanMassKg = calculateLeanMass(input.weightKg, bodyFatPercentage);
  return {
    bodyFatPercentage,
    fatMassKg: calculateFatMass(input.weightKg, bodyFatPercentage),
    ffmi: calculateFfmi(leanMassKg, input.heightCm),
    leanMassKg,
    reason: null,
    status: "calculated",
    sumSkinfoldsMm: roundOne(sumSkinfoldsMm),
  };
}

export function calculateBmr(input: CalorieCalculationInput) {
  const sex = input.biologicalSex;
  const leanMassKg = calculateLeanMass(input.weightKg, input.bodyFatPercentage);

  if (input.formula === "mifflin") {
    if (sex === "not_informed") throw new Error("biological_sex_required");
    const offset = sex === "female" ? -161 : 5;
    return roundInt(10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + offset);
  }

  if (input.formula === "harris_benedict") {
    if (sex === "not_informed") throw new Error("biological_sex_required");
    if (sex === "female") {
      return roundInt(447.593 + 9.247 * input.weightKg + 3.098 * input.heightCm - 4.33 * input.age);
    }
    return roundInt(88.362 + 13.397 * input.weightKg + 4.799 * input.heightCm - 5.677 * input.age);
  }

  if (input.formula === "cunningham") {
    if (leanMassKg === null) throw new Error("body_composition_required");
    return roundInt(500 + 22 * leanMassKg);
  }

  return roundInt(10 + 24.8 * input.weightKg);
}

export function calculateCalories(input: CalorieCalculationInput): CalorieCalculation {
  const activity = activityLevels[input.activityLevel];
  const bmr = calculateBmr(input);
  const tdee = roundInt(bmr * activity.factor);
  const targetWeight = input.targetWeightKg ?? input.weightKg;
  const weightDelta = roundOne(targetWeight - input.weightKg);
  const dailyEnergyDelta = roundInt((weightDelta * 7700) / input.targetDays);
  const targetKcal = Math.max(900, roundInt(tdee + dailyEnergyDelta));
  const strategyLabel =
    weightDelta < -0.2 ? "Déficit calórico" : weightDelta > 0.2 ? "Superávit calórico" : "Manutenção";

  return {
    activityFactor: activity.factor,
    activityLabel: activity.label,
    bmrKcal: bmr,
    dailyEnergyDeltaKcal: dailyEnergyDelta,
    formula: input.formula,
    formulaLabel: formulaLabels[input.formula],
    projectedWeightDeltaKg: weightDelta,
    strategyLabel,
    targetDays: input.targetDays,
    targetKcal,
    targetWeightKg: input.targetWeightKg,
    tdeeKcal: tdee,
    weeklyEnergyDeltaKcal: dailyEnergyDelta * 7,
  };
}

export function buildCalorieProjection(input: CalorieCalculationInput, selected: CalorieCalculation) {
  const days = Math.max(7, input.targetDays);
  const steps = Math.min(8, Math.max(4, Math.ceil(days / 15) + 1));
  const targetWeight = input.targetWeightKg ?? input.weightKg;

  return Array.from({ length: steps }, (_, index) => {
    const ratio = steps === 1 ? 0 : index / (steps - 1);
    const day = index === steps - 1 ? days : Math.round(days * ratio);
    const weightKg = roundOne(input.weightKg + (targetWeight - input.weightKg) * ratio);
    const maintenance = calculateCalories({ ...input, targetWeightKg: weightKg, weightKg }).tdeeKcal;
    return {
      day,
      goalKcal: Math.max(900, roundInt(maintenance + selected.dailyEnergyDeltaKcal)),
      maintenanceKcal: maintenance,
      weightKg,
    };
  });
}

function daysAgoLabel(value: string, now: Date) {
  const date = new Date(value);
  const days = Math.max(0, Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) / 86_400_000));
  if (days === 0) return "Hoje";
  if (days === 1) return "há 1 dia";
  return `há ${days} dias`;
}

function mapAssessment(raw: PartnerClientAssessmentRawAssessment): PartnerClientAssessment {
  const bmi = calculateBmi(raw.weightKg, raw.heightCm);
  const leanMassKg = calculateLeanMass(raw.weightKg, raw.bodyFatPercentage);
  const sumSkinfoldsMm = raw.skinfolds?.length
    ? roundOne(raw.skinfolds.reduce((total, skinfold) => total + skinfold.valueMm, 0))
    : null;
  return {
    ...raw,
    assessmentMethod: normalizeAssessmentMethod(raw.assessmentMethod),
    bmi,
    bmiClassification: bmiClassification(bmi),
    circumferences: raw.circumferences.map((item) => ({
      id: item.id,
      label: circumferenceLabels[item.metricKey] ?? item.metricKey,
      metricKey: item.metricKey,
      valueCm: item.valueCm,
    })),
    fatMassKg: calculateFatMass(raw.weightKg, raw.bodyFatPercentage),
    ffmi: calculateFfmi(leanMassKg, raw.heightCm),
    leanMassKg,
    sumSkinfoldsMm,
    skinfolds: (raw.skinfolds ?? []).map((item) => ({
      id: item.id,
      label: skinfoldLabels[item.metricKey] ?? item.metricKey,
      metricKey: item.metricKey,
      region: skinfoldRegions[item.metricKey] ?? "Outros",
      valueMm: item.valueMm,
    })),
  };
}

export function buildPartnerClientAssessments(
  raw: PartnerClientAssessmentRawData,
  now = new Date(),
): PartnerClientAssessmentsData {
  const assessments = [...raw.assessments]
    .sort((left, right) => new Date(left.assessedAt).getTime() - new Date(right.assessedAt).getTime())
    .map(mapAssessment);
  const latest = assessments.at(-1) ?? null;
  const previous = assessments.at(-2) ?? null;
  const age = calculateAgeFromBirthDate(raw.identity.birthDate, now);
  const targetWeight = latest?.targetWeightKg ?? raw.goals?.targetWeightKg ?? latest?.weightKg ?? null;
  const targetDays = latest?.targetDays ?? 90;

  const calorieInput: CalorieCalculationInput | null = latest && age
    ? {
        activityLevel: latest.activityLevel,
        age,
        bodyFatPercentage: latest.bodyFatPercentage,
        formula: "mifflin",
        biologicalSex: raw.identity.biologicalSex,
        heightCm: latest.heightCm,
        targetDays,
        targetWeightKg: targetWeight,
        weightKg: latest.weightKg,
      }
    : null;
  const formulaEligibility = calorieInput ? getFormulaEligibility(calorieInput) : Object.fromEntries((Object.keys(formulaLabels) as AssessmentFormula[]).map((formula) => [formula, { status: "missing_inputs", reason: "Registre uma avaliação e a data de nascimento." }])) as PartnerClientAssessmentsData["formulaEligibility"];
  const comparison = calorieInput
    ? (Object.keys(formulaLabels) as AssessmentFormula[]).filter((formula) => formulaEligibility[formula].status === "available").map((formula) => calculateCalories({ ...calorieInput, formula }))
    : [];
  const selectedFormula =
    raw.calculations.find((calculation) => calculation.status === "applied")?.formula ??
    latest?.calculations.find((calculation) => calculation.status === "applied")?.formula ??
    "mifflin";
  const selected = comparison.find((item) => item.formula === selectedFormula) ?? comparison[0] ?? null;

  const availableMetricKeys = circumferenceOrder.filter((key) =>
    assessments.some((assessment) => assessment.circumferences.some((item) => item.metricKey === key)),
  );
  const availableSkinfoldKeys = skinfoldOrder.filter((key) =>
    assessments.some((assessment) => assessment.skinfolds.some((item) => item.metricKey === key)),
  );
  const latestCircumferences = availableMetricKeys.map((key) => {
    const current = latest?.circumferences.find((item) => item.metricKey === key)?.valueCm ?? null;
    const previousValue = previous?.circumferences.find((item) => item.metricKey === key)?.valueCm ?? null;
    return current === null
      ? null
      : {
          delta: delta(current, previousValue),
          key,
          label: circumferenceLabels[key] ?? key,
          valueCm: current,
        };
  }).filter((item): item is NonNullable<typeof item> => item !== null);
  const latestSkinfolds = availableSkinfoldKeys.map((key) => {
    const current = latest?.skinfolds.find((item) => item.metricKey === key)?.valueMm ?? null;
    const previousValue = previous?.skinfolds.find((item) => item.metricKey === key)?.valueMm ?? null;
    return current === null
      ? null
      : {
          delta: delta(current, previousValue),
          key,
          label: skinfoldLabels[key] ?? key,
          region: skinfoldRegions[key] ?? "Outros",
          valueMm: current,
        };
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    calculations: raw.calculations,
    calorie: {
      comparison,
      latestApplied: raw.calculations.find((calculation) => calculation.status === "applied") ?? null,
      projection: calorieInput && selected ? buildCalorieProjection({ ...calorieInput, formula: selected.formula }, selected) : [],
      selected,
    },
    charts: {
      compositionSeries: assessments.map((assessment) => ({
        bodyFatPercentage: assessment.bodyFatPercentage,
        date: dateFormatter.format(new Date(assessment.assessedAt)),
        fatMassKg: assessment.fatMassKg,
        ffmi: assessment.ffmi,
        leanMassKg: assessment.leanMassKg,
        muscleMassKg: assessment.muscleMassKg,
        sumSkinfoldsMm: assessment.sumSkinfoldsMm,
        weightKg: assessment.weightKg,
      })),
      circumferenceSeries: assessments.map((assessment) => {
        const row: Record<string, number | string | null> = {
          date: dateFormatter.format(new Date(assessment.assessedAt)),
        };
        availableMetricKeys.forEach((key) => {
          row[key] = assessment.circumferences.find((item) => item.metricKey === key)?.valueCm ?? null;
        });
        return row;
      }),
      skinfoldSeries: assessments.map((assessment) => {
        const row: Record<string, number | string | null> = {
          date: dateFormatter.format(new Date(assessment.assessedAt)),
        };
        availableSkinfoldKeys.forEach((key) => {
          row[key] = assessment.skinfolds.find((item) => item.metricKey === key)?.valueMm ?? null;
        });
        return row;
      }),
    },
    client: {
      age,
      birthDate: raw.identity.birthDate,
      gender: raw.identity.gender,
      biologicalSex: raw.identity.biologicalSex,
      id: raw.identity.patientId,
      name: raw.identity.displayName,
      objective: raw.identity.objective,
    },
    circumferences: {
      availableMetrics: availableMetricKeys.map((key) => ({ key, label: circumferenceLabels[key] ?? key })),
      latest: latestCircumferences,
    },
    skinfolds: {
      availableMetrics: availableSkinfoldKeys.map((key) => ({
        key,
        label: skinfoldLabels[key] ?? key,
        region: skinfoldRegions[key] ?? "Outros",
      })),
      latest: latestSkinfolds,
    },
    generatedAt: now.toISOString(),
    history: assessments.map((assessment) => ({
      assessmentMethod: assessment.assessmentMethod,
      assessedAt: assessment.assessedAt,
      bmi: assessment.bmi,
      bmiClassification: assessment.bmiClassification,
      bodyFatPercentage: assessment.bodyFatPercentage,
      dateLabel: dateFormatter.format(new Date(assessment.assessedAt)),
      fatMassKg: assessment.fatMassKg,
      ffmi: assessment.ffmi,
      heightCm: assessment.heightCm,
      id: assessment.id,
      leanMassKg: assessment.leanMassKg,
      notes: assessment.notes,
      sumSkinfoldsMm: assessment.sumSkinfoldsMm,
      targetDays: assessment.targetDays,
      targetWeightKg: assessment.targetWeightKg,
      title: assessment.title,
      weightKg: assessment.weightKg,
    })).reverse(),
    kpis: {
      bmi: {
        classification: latest?.bmiClassification ?? "Sem dados",
        delta: delta(latest?.bmi ?? null, previous?.bmi ?? null),
        helper: latest ? latest.bmiClassification : "Sem avaliação",
        label: "IMC",
        value: latest?.bmi ?? null,
      },
      ffmi: {
        delta: delta(latest?.ffmi ?? null, previous?.ffmi ?? null),
        helper: "Massa magra ajustada pela altura",
        label: "FFMI",
        value: latest?.ffmi ?? null,
      },
      bodyFat: {
        delta: delta(latest?.bodyFatPercentage ?? null, previous?.bodyFatPercentage ?? null),
        helper: raw.goals?.targetBodyFatMinPct != null && raw.goals?.targetBodyFatMaxPct != null
          ? `Meta ${raw.goals.targetBodyFatMinPct}-${raw.goals.targetBodyFatMaxPct}%`
          : "Sem meta definida",
        label: "% Gordura",
        value: latest?.bodyFatPercentage ?? null,
      },
      lastAssessment: {
        dateLabel: latest ? dateFormatter.format(new Date(latest.assessedAt)) : "Sem avaliação",
        daysAgoLabel: latest ? daysAgoLabel(latest.assessedAt, now) : "Sem histórico",
        value: latest ? dateFormatter.format(new Date(latest.assessedAt)) : "Sem dados",
      },
      leanMass: {
        delta: delta(latest?.leanMassKg ?? null, previous?.leanMassKg ?? null),
        helper: "Peso sem massa gorda",
        label: "Massa magra",
        value: latest?.leanMassKg ?? null,
      },
      muscleMass: {
        delta: delta(latest?.muscleMassKg ?? latest?.leanMassKg ?? null, previous?.muscleMassKg ?? previous?.leanMassKg ?? null),
        helper: latest?.muscleMassKg === null ? "Estimativa por massa magra" : "Informada na avaliação",
        label: "Massa muscular",
        value: latest?.muscleMassKg ?? latest?.leanMassKg ?? null,
      },
      weight: {
        delta: delta(latest?.weightKg ?? null, previous?.weightKg ?? null),
        helper: targetWeight ? `Meta ${roundOne(targetWeight)} kg` : "Sem meta definida",
        label: "Peso atual",
        value: latest?.weightKg ?? null,
      },
    },
    latestAssessment: latest,
    records: [...assessments].reverse(),
    formulaEligibility,
  };
}
