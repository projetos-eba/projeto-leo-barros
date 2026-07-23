export type ClientDietRawItem = {
  carbsG: number | string;
  fatG: number | string;
  fiberG?: number | string;
  foodId: string | null;
  householdMeasure: string | null;
  id: string;
  kcal: number | string;
  name: string;
  proteinG: number | string;
  quantity: number | string;
  quantityUnit: string;
  sortOrder: number;
};

export type ClientDietRawMeal = {
  id: string;
  items: ClientDietRawItem[];
  mealTime: string;
  menuOption?: number | string;
  optionLabel?: string | null;
  sortOrder: number;
  title: string;
};

export type ClientDietRawData = {
  client: {
    avatarUrl: string | null;
    id: string;
    name: string;
    objective: string | null;
  } | null;
  dailyLog: {
    waterMl: number | string | null;
  } | null;
  generatedAt: string;
  mealLogs: Array<{
    completedAt: string | null;
    mealId: string;
    notes: string | null;
    photoMimeType: string | null;
    photoOriginalFilename: string | null;
    photoStoragePath: string | null;
    status: string;
  }>;
  substitutions?: Array<{
    appliedAt: string;
    foodId: string;
    itemId: string;
    mealId: string;
    replacementCarbsG: number | string;
    replacementFatG: number | string;
    replacementFiberG?: number | string;
    replacementKcal: number | string;
    replacementName: string;
    replacementProteinG: number | string;
    replacementServingSize: number | string;
    replacementServingUnit: string;
  }>;
  plan: {
    calorieStrategy: string;
    id: string;
    meals: ClientDietRawMeal[];
    partnerId: string;
    publishedAt?: string | null;
    reviewOn?: string | null;
    sentAt: string | null;
    startsOn?: string | null;
    status: string;
    targetCarbsG: number | string;
    targetFatG: number | string;
    targetKcal: number | string;
    targetProteinG: number | string;
    title: string;
    updatedAt: string;
    version?: number | string;
    waterLiters: number | string;
  } | null;
  selectedDate: string;
  suggestions: Array<{
    carbsG: number | string;
    category: string;
    fatG: number | string;
    fiberG?: number | string;
    id: string;
    kcal: number | string;
    name: string;
    proteinG: number | string;
    servingSize: number | string;
    servingUnit: string;
  }>;
  weekLogs: Array<{
    completedMeals: number | string;
    consumedKcal: number | string;
    date: string;
    totalMeals: number | string;
    waterMl: number | string;
  }>;
};

export type ClientDietMeal = {
  completedAtLabel: string | null;
  hasPhoto: boolean;
  id: string;
  imageSrc: string;
  isNext: boolean;
  items: Array<{
    amountLabel: string;
    carbs: number;
    fat: number;
    fiber: number;
    id: string;
    isSubstituted: boolean;
    kcal: number;
    name: string;
    originalName: string;
    protein: number;
    replacementLabel: string | null;
  }>;
  menuOption: number;
  notes: string | null;
  optionLabel: string;
  photoLabel: string | null;
  status: "completed" | "partial" | "pending" | "skipped";
  statusLabel: string;
  timeLabel: string;
  title: string;
  totals: MacroTotals;
};

export type MacroTotals = {
  carbs: number;
  fat: number;
  fiber: number;
  kcal: number;
  protein: number;
};

export type ClientDietData = {
  client: {
    avatarUrl: string | null;
    firstName: string;
    id: string;
    name: string;
    objectiveLabel: string;
  };
  generatedAt: string;
  hydration: {
    cups: boolean[];
    currentMl: number;
    label: string;
    remainingCups: number;
    targetMl: number;
  };
  meals: ClientDietMeal[];
  menuOptions: Array<{
    label: string;
    value: number;
  }>;
  nextMeal: ClientDietMeal | null;
  plan: {
    id: string;
    partnerId: string;
    reviewLabel: string;
    startsLabel: string;
    statusLabel: string;
    targetCarbs: number;
    targetFat: number;
    targetKcal: number;
    targetProtein: number;
    title: string;
    updatedLabel: string;
    versionLabel: string;
  } | null;
  progress: {
    consumed: MacroTotals;
    kcalPercent: number;
    remainingKcal: number;
    targets: MacroTotals;
  };
  selectedDate: {
    iso: string;
    label: string;
    shortLabel: string;
  };
  suggestions: Array<{
    carbs: number;
    category: string;
    fat: number;
    fiber: number;
    id: string;
    kcal: number;
    label: string;
    macroLabel: string;
    name: string;
    protein: number;
    servingSize: number;
    servingUnit: string;
  }>;
  week: {
    adherenceDays: number;
    averageKcal: number;
    points: Array<{
      completedMeals: number;
      date: string;
      kcal: number;
      label: string;
      percent: number;
      totalMeals: number;
      waterMl: number;
    }>;
    registeredMeals: number;
    totalMeals: number;
  };
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  weekday: "long",
});

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
});

const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Cliente";
}

function formatNumber(value: number, maximumFractionDigits = 0) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits });
}

function mealDate(selectedDate: string, time: string) {
  return new Date(`${selectedDate}T${time}:00`);
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  const [weekday, rest] = dateFormatter.format(date).split(", ");
  return `${rest}, ${weekday}`;
}

function mealTotals(meal: ClientDietRawMeal): MacroTotals {
  return meal.items.reduce<MacroTotals>((totals, item) => ({
    carbs: totals.carbs + numberValue(item.carbsG),
    fat: totals.fat + numberValue(item.fatG),
    fiber: totals.fiber + numberValue(item.fiberG),
    kcal: totals.kcal + numberValue(item.kcal),
    protein: totals.protein + numberValue(item.proteinG),
  }), { carbs: 0, fat: 0, fiber: 0, kcal: 0, protein: 0 });
}

function sumMeals(meals: ClientDietMeal[]): MacroTotals {
  return meals.reduce<MacroTotals>((totals, meal) => {
    if (meal.status !== "completed" && meal.status !== "partial") return totals;
    const multiplier = meal.status === "partial" ? 0.5 : 1;
    return {
      carbs: totals.carbs + meal.totals.carbs * multiplier,
      fat: totals.fat + meal.totals.fat * multiplier,
      fiber: totals.fiber + meal.totals.fiber * multiplier,
      kcal: totals.kcal + meal.totals.kcal * multiplier,
      protein: totals.protein + meal.totals.protein * multiplier,
    };
  }, { carbs: 0, fat: 0, fiber: 0, kcal: 0, protein: 0 });
}

function percent(value: number, target: number) {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
}

function statusLabel(status: ClientDietMeal["status"], isNext: boolean) {
  if (status === "completed") return "Realizada";
  if (status === "partial") return "Parcial";
  if (status === "skipped") return "Pulada";
  return isNext ? "Próxima" : "Pendente";
}

function planStatusLabel(status: string) {
  return {
    active: "Plano ativo",
    published: "Plano ativo",
    scheduled: "Plano programado",
    sent: "Plano ativo",
  }[status] ?? "Plano alimentar";
}

function dateLabel(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  return shortDateFormatter.format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

function mealImageSrc(title: string) {
  const normalized = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (normalized.includes("cafe")) return "/cliente/dieta/refeicoes/cafe-da-manha.avif";
  if (normalized.includes("almoco")) return "/cliente/dieta/refeicoes/almoco.avif";
  if (normalized.includes("lanche")) return "/cliente/dieta/refeicoes/lanche.avif";
  if (normalized.includes("jantar")) return "/cliente/dieta/refeicoes/jantar.avif";
  if (normalized.includes("ceia")) return "/cliente/dieta/refeicoes/ceia.avif";
  return "/cliente/inicio/capa-dieta.png";
}

export function buildClientDiet(raw: ClientDietRawData, now = new Date()): ClientDietData {
  const selectedDate = raw.selectedDate;
  const clientName = raw.client?.name ?? "Cliente";
  const plan = raw.plan;
  const logs = new Map(raw.mealLogs.map((log) => [log.mealId, log]));
  const substitutions = new Map((raw.substitutions ?? []).map((item) => [item.itemId, item]));
  const rawMeals = (plan?.meals ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const menuOptions = Array.from(new Map(rawMeals.map((meal) => {
    const value = Math.max(1, Math.round(numberValue(meal.menuOption ?? 1)));
    return [value, { label: meal.optionLabel || `Cardápio ${value}`, value }];
  })).values()).sort((a, b) => a.value - b.value);
  const defaultMenuOption = menuOptions[0]?.value ?? 1;
  const defaultMeals = rawMeals.filter((meal) => Math.max(1, Math.round(numberValue(meal.menuOption ?? 1))) === defaultMenuOption);

  const nextMealId = defaultMeals.find((meal) => {
    const log = logs.get(meal.id);
    if (log?.status === "completed" || log?.status === "partial" || log?.status === "skipped") return false;
    return mealDate(selectedDate, meal.mealTime).getTime() >= now.getTime();
  })?.id ?? defaultMeals.find((meal) => {
    const status = logs.get(meal.id)?.status;
    return status !== "completed" && status !== "partial" && status !== "skipped";
  })?.id ?? null;

  const meals = rawMeals.map<ClientDietMeal>((meal) => {
    const log = logs.get(meal.id);
    const status = (log?.status === "completed" || log?.status === "partial" || log?.status === "skipped" ? log.status : "pending") as ClientDietMeal["status"];
    const isNext = meal.id === nextMealId && status === "pending";
    const completedAt = log?.completedAt ? new Date(log.completedAt) : null;

    return {
      completedAtLabel: completedAt ? timeFormatter.format(completedAt) : null,
      hasPhoto: Boolean(log?.photoStoragePath),
      id: meal.id,
      imageSrc: mealImageSrc(meal.title),
      isNext,
      items: meal.items
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => {
          const substitution = substitutions.get(item.id);
          const isSubstituted = Boolean(substitution);
          const servingSize = numberValue(substitution?.replacementServingSize ?? item.quantity);
          const servingUnit = substitution?.replacementServingUnit ?? item.quantityUnit;
          return {
            amountLabel: `${formatNumber(isSubstituted ? servingSize : numberValue(item.quantity), 1)}${servingUnit}`,
            carbs: numberValue(substitution?.replacementCarbsG ?? item.carbsG),
            fat: numberValue(substitution?.replacementFatG ?? item.fatG),
            fiber: numberValue(substitution?.replacementFiberG ?? item.fiberG),
            id: item.id,
            isSubstituted,
            kcal: numberValue(substitution?.replacementKcal ?? item.kcal),
            name: substitution?.replacementName ?? item.name,
            originalName: item.name,
            protein: numberValue(substitution?.replacementProteinG ?? item.proteinG),
            replacementLabel: substitution ? `Substitui ${item.name}` : null,
          };
        }),
      menuOption: Math.max(1, Math.round(numberValue(meal.menuOption ?? 1))),
      notes: log?.notes ?? null,
      optionLabel: meal.optionLabel || `Cardápio ${Math.max(1, Math.round(numberValue(meal.menuOption ?? 1)))}`,
      photoLabel: log?.photoOriginalFilename ?? (log?.photoStoragePath ? "Foto anexada" : null),
      status,
      statusLabel: statusLabel(status, isNext),
      timeLabel: meal.mealTime,
      title: meal.title,
      totals: meal.items.reduce<MacroTotals>((totals, item) => {
        const substitution = substitutions.get(item.id);
        return {
          carbs: totals.carbs + numberValue(substitution?.replacementCarbsG ?? item.carbsG),
          fat: totals.fat + numberValue(substitution?.replacementFatG ?? item.fatG),
          fiber: totals.fiber + numberValue(substitution?.replacementFiberG ?? item.fiberG),
          kcal: totals.kcal + numberValue(substitution?.replacementKcal ?? item.kcal),
          protein: totals.protein + numberValue(substitution?.replacementProteinG ?? item.proteinG),
        };
      }, { carbs: 0, fat: 0, fiber: 0, kcal: 0, protein: 0 }),
    };
  });

  const targetKcal = numberValue(plan?.targetKcal);
  const targetProtein = numberValue(plan?.targetProteinG);
  const targetCarbs = numberValue(plan?.targetCarbsG);
  const targetFat = numberValue(plan?.targetFatG);
  const consumed = sumMeals(meals.filter((meal) => meal.menuOption === defaultMenuOption));
  const targetMl = Math.max(250, Math.round(numberValue(plan?.waterLiters) * 1000));
  const currentMl = numberValue(raw.dailyLog?.waterMl);
  const totalCups = Math.max(1, Math.round(targetMl / 250));
  const completedCups = Math.min(totalCups, Math.floor(currentMl / 250));
  const registeredMeals = raw.weekLogs.reduce((total, item) => total + numberValue(item.completedMeals), 0);
  const prescribedMeals = raw.weekLogs.reduce((total, item) => total + numberValue(item.totalMeals), 0);
  const totalMeals = Math.max(prescribedMeals, registeredMeals);
  const kcalValues = raw.weekLogs.map((item) => numberValue(item.consumedKcal));

  return {
    client: {
      avatarUrl: raw.client?.avatarUrl ?? null,
      firstName: firstName(clientName),
      id: raw.client?.id ?? "cliente",
      name: clientName,
      objectiveLabel: raw.client?.objective ?? "Jornada integrada",
    },
    generatedAt: raw.generatedAt,
    hydration: {
      cups: Array.from({ length: Math.min(totalCups, 12) }, (_, index) => index < completedCups),
      currentMl,
      label: `${formatNumber(currentMl / 1000, 1)}L / ${formatNumber(targetMl / 1000, 1)}L`,
      remainingCups: Math.max(0, totalCups - completedCups),
      targetMl,
    },
    meals,
    menuOptions,
    nextMeal: meals.find((meal) => meal.isNext) ?? null,
    plan: plan ? {
      id: plan.id,
      partnerId: plan.partnerId,
      reviewLabel: dateLabel(plan.reviewOn, "Sem revisão"),
      startsLabel: dateLabel(plan.startsOn ?? plan.publishedAt ?? plan.sentAt ?? plan.updatedAt, "Sem início"),
      statusLabel: planStatusLabel(plan.status),
      targetCarbs,
      targetFat,
      targetKcal,
      targetProtein,
      title: plan.title,
      updatedLabel: dateLabel(plan.updatedAt, "Sem atualização"),
      versionLabel: `v${Math.max(1, Math.round(numberValue((plan as { version?: number | string }).version ?? 1)))}`,
    } : null,
    progress: {
      consumed,
      kcalPercent: percent(consumed.kcal, targetKcal),
      remainingKcal: Math.max(0, targetKcal - consumed.kcal),
      targets: {
        carbs: targetCarbs,
        fat: targetFat,
        fiber: 0,
        kcal: targetKcal,
        protein: targetProtein,
      },
    },
    selectedDate: {
      iso: selectedDate,
      label: formatDate(selectedDate),
      shortLabel: shortDateFormatter.format(new Date(`${selectedDate}T12:00:00`)),
    },
    suggestions: raw.suggestions.slice(0, 6).map((item) => ({
      carbs: numberValue(item.carbsG),
      category: item.category,
      fat: numberValue(item.fatG),
      fiber: numberValue(item.fiberG),
      id: item.id,
      kcal: numberValue(item.kcal),
      label: `${formatNumber(numberValue(item.kcal))} kcal em ${formatNumber(numberValue(item.servingSize), 1)}${item.servingUnit}`,
      macroLabel: `P ${formatNumber(numberValue(item.proteinG), 1)}g · C ${formatNumber(numberValue(item.carbsG), 1)}g · G ${formatNumber(numberValue(item.fatG), 1)}g`,
      name: item.name,
      protein: numberValue(item.proteinG),
      servingSize: numberValue(item.servingSize),
      servingUnit: item.servingUnit,
    })),
    week: {
      adherenceDays: raw.weekLogs.filter((item) => numberValue(item.completedMeals) > 0).length,
      averageKcal: kcalValues.length ? Math.round(kcalValues.reduce((total, item) => total + item, 0) / kcalValues.length) : 0,
      points: raw.weekLogs.map((item) => {
        const date = new Date(`${item.date}T12:00:00`);
        const completedMeals = numberValue(item.completedMeals);
        const totalDayMeals = Math.max(completedMeals, numberValue(item.totalMeals), 1);
        const kcal = numberValue(item.consumedKcal);
        return {
          completedMeals,
          date: item.date,
          kcal,
          label: `${weekdayFormatter.format(date)} ${shortDateFormatter.format(date)}`,
          percent: percent(completedMeals, totalDayMeals),
          totalMeals: totalDayMeals,
          waterMl: numberValue(item.waterMl),
        };
      }),
      registeredMeals,
      totalMeals,
    },
  };
}
