export type ExamReferenceSex = "female" | "male" | "unisex";
export type ExamResultStatus = "high" | "low" | "normal" | "unknown";
export type PartnerExamStatus = "active" | "archived";

export type PartnerClientExamsRawData = {
  categories: Array<{
    iconKey: string;
    id: string;
    name: string;
    slug: string;
    sortOrder: number;
    status: string;
  }>;
  collections: Array<{
    collectedAt: string;
    createdAt: string;
    id: string;
    notes: string | null;
    results: PartnerClientExamRawResult[];
    status: string;
    title: string;
    updatedAt: string;
  }>;
  definitions: PartnerClientExamRawDefinition[];
  events: Array<{
    actorName: string | null;
    createdAt: string;
    detail: string;
    details: Record<string, unknown>;
    eventType: string;
    id: string;
  }>;
  generatedAt: string;
  patient: {
    birthDate: string | null;
    gender: string | null;
  };
};

export type PartnerClientExamRawDefinition = {
  alternativeUnits: Array<{
    factorFromDefault: number;
    id: string;
    status: string;
    unit: string;
  }>;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  defaultUnit: string;
  id: string;
  name: string;
  references: Array<{
    highValue: number | null;
    id: string;
    label: string | null;
    lowValue: number | null;
    sex: string;
    sortOrder: number;
    status: string;
  }>;
  slug: string;
  sortOrder: number;
  status: string;
};

export type PartnerClientExamRawResult = {
  collectionId: string;
  conversionFactorFromDefault: number | null;
  defaultUnit: string;
  examId: string;
  id: string;
  inputUnit: string;
  inputValue: number;
  notes: string | null;
  referenceHigh: number | null;
  referenceLow: number | null;
  referenceSex: string;
  snapshotCategoryName: string;
  snapshotCategorySlug: string;
  snapshotExamName: string;
  snapshotExamSlug: string;
  status: string;
  valueDefault: number;
};

export type PartnerClientExamCategory = {
  iconKey: string;
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  status: PartnerExamStatus;
};

export type PartnerClientExamReference = {
  highValue: number | null;
  id: string;
  label: string | null;
  lowValue: number | null;
  referenceLabel: string;
  sex: ExamReferenceSex;
  sexLabel: string;
  sortOrder: number;
  status: PartnerExamStatus;
};

export type PartnerClientExamAlternativeUnit = {
  factorFromDefault: number;
  id: string;
  status: PartnerExamStatus;
  unit: string;
};

export type PartnerClientExamDefinition = {
  alternativeUnits: PartnerClientExamAlternativeUnit[];
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  defaultUnit: string;
  id: string;
  name: string;
  references: PartnerClientExamReference[];
  searchText: string;
  slug: string;
  sortOrder: number;
  status: PartnerExamStatus;
  units: string[];
};

export type PartnerClientExamResult = {
  collectionId: string;
  collectedAt: string;
  collectedLabel: string;
  conversionFactorFromDefault: number | null;
  defaultUnit: string;
  deltaPct: number | null;
  examId: string;
  id: string;
  inputUnit: string;
  inputValue: number;
  notes: string | null;
  referenceHigh: number | null;
  referenceLabel: string;
  referenceLow: number | null;
  referenceSex: ExamReferenceSex;
  status: ExamResultStatus;
  statusLabel: string;
  statusTone: "blue" | "green" | "red" | "yellow";
  trendLabel: string;
  valueDefault: number;
  valueLabel: string;
  snapshotCategoryName: string;
  snapshotCategorySlug: string;
  snapshotExamName: string;
  snapshotExamSlug: string;
};

export type PartnerClientExamCollection = {
  collectedAt: string;
  collectedLabel: string;
  createdAt: string;
  id: string;
  notes: string | null;
  resultCount: number;
  results: PartnerClientExamResult[];
  status: PartnerExamStatus;
  title: string;
  updatedAt: string;
};

export type PartnerClientExamDashboardCategory = {
  alertCount: number;
  category: PartnerClientExamCategory;
  examCount: number;
  resultCount: number;
  results: PartnerClientExamResult[];
};

export type PartnerClientExamAlert = {
  categoryName: string;
  examName: string;
  id: string;
  referenceLabel: string;
  status: ExamResultStatus;
  statusLabel: string;
  valueLabel: string;
};

export type PartnerClientExamsData = {
  alerts: PartnerClientExamAlert[];
  categories: PartnerClientExamCategory[];
  collections: PartnerClientExamCollection[];
  dashboard: PartnerClientExamDashboardCategory[];
  definitions: PartnerClientExamDefinition[];
  events: Array<{
    actorName: string | null;
    dateLabel: string;
    detail: string;
    eventType: string;
    id: string;
  }>;
  generatedAt: string;
  latestCollection: PartnerClientExamCollection | null;
  patient: {
    birthDate: string | null;
    gender: string | null;
    referenceSex: ExamReferenceSex;
  };
  summary: {
    alertCount: number;
    categoryCount: number;
    lastCollectionLabel: string;
    latestResultCount: number;
    totalExams: number;
  };
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const sexLabels: Record<ExamReferenceSex, string> = {
  female: "Feminino",
  male: "Masculino",
  unisex: "Unissex",
};

export const examResultStatusLabels: Record<ExamResultStatus, string> = {
  high: "Acima",
  low: "Abaixo",
  normal: "Normal",
  unknown: "Sem referência",
};

export const examCategoryIconLabels: Record<string, string> = {
  bone: "Minerais",
  droplet: "Bioquímica",
  fileText: "Exames",
  flask: "Metabólico",
  heartPulse: "Inflamação",
  pill: "Vitaminas",
  syringe: "Hematologia",
};

function asStatus(value: string): PartnerExamStatus {
  return value === "archived" ? "archived" : "active";
}

function asReferenceSex(value: string): ExamReferenceSex {
  if (value === "male" || value === "female") return value;
  return "unisex";
}

function asResultStatus(value: string): ExamResultStatus {
  if (value === "high" || value === "low" || value === "normal") return value;
  return "unknown";
}

export function patientReferenceSex(gender: string | null | undefined): ExamReferenceSex {
  if (gender === "male" || gender === "female") return gender;
  return "unisex";
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || typeof value === "undefined") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function formatExamNumber(value: number, digits = 1) {
  const rounded = round(value, digits);
  return rounded.toLocaleString("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : digits,
  });
}

export function formatReferenceRange(lowValue: number | null, highValue: number | null, unit?: string) {
  const suffix = unit && unit !== "—" ? ` ${unit}` : "";
  if (lowValue !== null && highValue !== null) return `${formatExamNumber(lowValue)} - ${formatExamNumber(highValue)}${suffix}`;
  if (lowValue !== null) return `>= ${formatExamNumber(lowValue)}${suffix}`;
  if (highValue !== null) return `<= ${formatExamNumber(highValue)}${suffix}`;
  return "Sem referência";
}

export function classifyExamValue(
  value: number,
  reference: Pick<PartnerClientExamReference, "highValue" | "lowValue"> | null,
): ExamResultStatus {
  if (!reference || (reference.lowValue === null && reference.highValue === null)) return "unknown";
  if (reference.lowValue !== null && value < reference.lowValue) return "low";
  if (reference.highValue !== null && value > reference.highValue) return "high";
  return "normal";
}

export function selectExamReference(
  definition: Pick<PartnerClientExamDefinition, "references">,
  referenceSex: ExamReferenceSex,
) {
  return definition.references.find((reference) => reference.sex === referenceSex)
    ?? definition.references.find((reference) => reference.sex === "unisex")
    ?? definition.references[0]
    ?? null;
}

export function convertExamValueToDefault(
  value: number,
  unit: string,
  definition: Pick<PartnerClientExamDefinition, "alternativeUnits" | "defaultUnit">,
) {
  if (unit.trim().toLowerCase() === definition.defaultUnit.trim().toLowerCase()) {
    return { factorFromDefault: null, valueDefault: value };
  }

  const alternative = definition.alternativeUnits.find(
    (candidate) => candidate.unit.trim().toLowerCase() === unit.trim().toLowerCase(),
  );

  if (!alternative) return { factorFromDefault: null, valueDefault: value };
  return {
    factorFromDefault: alternative.factorFromDefault,
    valueDefault: value / alternative.factorFromDefault,
  };
}

export function calculateExamDeltaPct(current: number, previous: number | null) {
  if (previous === null || previous === 0) return null;
  return round(((current - previous) / previous) * 100, 1);
}

function statusTone(status: ExamResultStatus): PartnerClientExamResult["statusTone"] {
  if (status === "normal") return "green";
  if (status === "high" || status === "low") return "red";
  return "yellow";
}

function trendLabel(deltaPct: number | null) {
  if (deltaPct === null) return "Sem histórico";
  const prefix = deltaPct > 0 ? "▲" : deltaPct < 0 ? "▼" : "•";
  return `${prefix} ${formatExamNumber(Math.abs(deltaPct), 1)}%`;
}

function resultLabel(value: number, unit: string) {
  return `${formatExamNumber(value, 1)} ${unit}`;
}

function mapReference(raw: PartnerClientExamRawDefinition["references"][number], defaultUnit: string): PartnerClientExamReference {
  const lowValue = toNumber(raw.lowValue);
  const highValue = toNumber(raw.highValue);
  return {
    highValue,
    id: raw.id,
    label: raw.label,
    lowValue,
    referenceLabel: raw.label ?? formatReferenceRange(lowValue, highValue, defaultUnit),
    sex: asReferenceSex(raw.sex),
    sexLabel: sexLabels[asReferenceSex(raw.sex)],
    sortOrder: Number(raw.sortOrder ?? 0),
    status: asStatus(raw.status),
  };
}

function mapDefinition(raw: PartnerClientExamRawDefinition): PartnerClientExamDefinition {
  const alternativeUnits = raw.alternativeUnits
    .filter((unit) => unit.status !== "archived")
    .map((unit) => ({
      factorFromDefault: Number(unit.factorFromDefault),
      id: unit.id,
      status: asStatus(unit.status),
      unit: unit.unit,
    }));

  return {
    alternativeUnits,
    categoryId: raw.categoryId,
    categoryName: raw.categoryName,
    categorySlug: raw.categorySlug,
    defaultUnit: raw.defaultUnit,
    id: raw.id,
    name: raw.name,
    references: raw.references
      .filter((reference) => reference.status !== "archived")
      .map((reference) => mapReference(reference, raw.defaultUnit))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.sex.localeCompare(b.sex)),
    searchText: `${raw.name} ${raw.slug} ${raw.categoryName} ${raw.defaultUnit}`.toLowerCase(),
    slug: raw.slug,
    sortOrder: Number(raw.sortOrder ?? 0),
    status: asStatus(raw.status),
    units: [raw.defaultUnit, ...alternativeUnits.map((unit) => unit.unit)],
  };
}

function mapRawResult(raw: PartnerClientExamRawResult, collectedAt: string, previousValue: number | null): PartnerClientExamResult {
  const status = asResultStatus(raw.status);
  const referenceLow = toNumber(raw.referenceLow);
  const referenceHigh = toNumber(raw.referenceHigh);
  const valueDefault = Number(raw.valueDefault);
  const deltaPct = calculateExamDeltaPct(valueDefault, previousValue);

  return {
    collectionId: raw.collectionId,
    collectedAt,
    collectedLabel: dateFormatter.format(new Date(`${collectedAt}T12:00:00`)),
    conversionFactorFromDefault: toNumber(raw.conversionFactorFromDefault),
    defaultUnit: raw.defaultUnit,
    deltaPct,
    examId: raw.examId,
    id: raw.id,
    inputUnit: raw.inputUnit,
    inputValue: Number(raw.inputValue),
    notes: raw.notes,
    referenceHigh,
    referenceLabel: formatReferenceRange(referenceLow, referenceHigh, raw.defaultUnit),
    referenceLow,
    referenceSex: asReferenceSex(raw.referenceSex),
    snapshotCategoryName: raw.snapshotCategoryName,
    snapshotCategorySlug: raw.snapshotCategorySlug,
    snapshotExamName: raw.snapshotExamName,
    snapshotExamSlug: raw.snapshotExamSlug,
    status,
    statusLabel: examResultStatusLabels[status],
    statusTone: statusTone(status),
    trendLabel: trendLabel(deltaPct),
    valueDefault,
    valueLabel: resultLabel(valueDefault, raw.defaultUnit),
  };
}

export function buildPartnerClientExams(raw: PartnerClientExamsRawData): PartnerClientExamsData {
  const categories = raw.categories
    .filter((category) => category.status !== "archived")
    .map((category) => ({
      iconKey: category.iconKey,
      id: category.id,
      name: category.name,
      slug: category.slug,
      sortOrder: Number(category.sortOrder ?? 0),
      status: asStatus(category.status),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  const definitions = raw.definitions
    .filter((definition) => definition.status !== "archived")
    .map(mapDefinition)
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName) || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  const valueHistory = new Map<string, Array<{ collectedAt: string; value: number }>>();
  for (const collection of raw.collections) {
    for (const result of collection.results) {
      const list = valueHistory.get(result.examId) ?? [];
      list.push({ collectedAt: collection.collectedAt, value: Number(result.valueDefault) });
      valueHistory.set(result.examId, list);
    }
  }
  for (const list of valueHistory.values()) {
    list.sort((a, b) => a.collectedAt.localeCompare(b.collectedAt));
  }

  const collections = raw.collections
    .filter((collection) => collection.status !== "archived")
    .sort((a, b) => b.collectedAt.localeCompare(a.collectedAt) || b.createdAt.localeCompare(a.createdAt))
    .map((collection) => {
      const results = collection.results.map((result) => {
        const history = valueHistory.get(result.examId) ?? [];
        const currentIndex = history.findIndex((item) => item.collectedAt === collection.collectedAt && item.value === Number(result.valueDefault));
        const previousValue = currentIndex > 0 ? history[currentIndex - 1]?.value ?? null : null;
        return mapRawResult(result, collection.collectedAt, previousValue);
      });

      return {
        collectedAt: collection.collectedAt,
        collectedLabel: dateFormatter.format(new Date(`${collection.collectedAt}T12:00:00`)),
        createdAt: collection.createdAt,
        id: collection.id,
        notes: collection.notes,
        resultCount: results.length,
        results,
        status: asStatus(collection.status),
        title: collection.title,
        updatedAt: collection.updatedAt,
      };
    });

  const latestResultsByExam = new Map<string, PartnerClientExamResult>();
  for (const collection of collections) {
    for (const result of collection.results) {
      if (!latestResultsByExam.has(result.examId)) {
        latestResultsByExam.set(result.examId, result);
      }
    }
  }

  const dashboard = categories.map((category) => {
    const categoryDefinitions = definitions.filter((definition) => definition.categoryId === category.id);
    const results = categoryDefinitions
      .map((definition) => latestResultsByExam.get(definition.id))
      .filter((result): result is PartnerClientExamResult => Boolean(result));
    return {
      alertCount: results.filter((result) => result.status === "high" || result.status === "low").length,
      category,
      examCount: categoryDefinitions.length,
      resultCount: results.length,
      results,
    };
  });

  const alerts = Array.from(latestResultsByExam.values())
    .filter((result) => result.status === "high" || result.status === "low")
    .map((result) => ({
      categoryName: result.snapshotCategoryName,
      examName: result.snapshotExamName,
      id: result.id,
      referenceLabel: result.referenceLabel,
      status: result.status,
      statusLabel: result.statusLabel,
      valueLabel: result.valueLabel,
    }))
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName) || a.examName.localeCompare(b.examName));

  const latestCollection = collections[0] ?? null;

  return {
    alerts,
    categories,
    collections,
    dashboard,
    definitions,
    events: raw.events.map((event) => ({
      actorName: event.actorName,
      dateLabel: dateTimeFormatter.format(new Date(event.createdAt)),
      detail: event.detail,
      eventType: event.eventType,
      id: event.id,
    })),
    generatedAt: raw.generatedAt,
    latestCollection,
    patient: {
      birthDate: raw.patient.birthDate,
      gender: raw.patient.gender,
      referenceSex: patientReferenceSex(raw.patient.gender),
    },
    summary: {
      alertCount: alerts.length,
      categoryCount: categories.length,
      lastCollectionLabel: latestCollection?.collectedLabel ?? "Nenhuma coleta",
      latestResultCount: latestCollection?.resultCount ?? 0,
      totalExams: definitions.length,
    },
  };
}
