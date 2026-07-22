"use client";

import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  Database,
  Dumbbell,
  Eye,
  Flame,
  FileUp,
  Grid2X2,
  LayoutList,
  Pencil,
  Plus,
  Save,
  Search,
  UploadCloud,
  Utensils,
  Wheat,
} from "lucide-react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  equipmentLabels,
  foodCategoryLabels,
  foodSourceLabels,
  levelLabels,
  muscleGroupLabels,
  objectiveLabels,
  parseFoodImportTable,
  suggestedUseLabels,
  type PartnerProtocolExercise,
  type PartnerProtocolExerciseEquipment,
  type PartnerProtocolExerciseLevel,
  type PartnerProtocolExerciseMuscleGroup,
  type PartnerProtocolExerciseObjective,
  type PartnerProtocolFood,
  type PartnerProtocolFoodCategory,
  type PartnerProtocolFoodSource,
  type PartnerProtocolsData,
} from "@/lib/partners/protocols-metrics";
import { cn } from "@/lib/utils";

import {
  createPartnerProtocolExercise,
  createPartnerProtocolFood,
  createPartnerProtocolUseDraft,
  importPartnerProtocolFoods,
  setPartnerProtocolArchived,
  updatePartnerProtocolExercise,
  updatePartnerProtocolFood,
} from "./actions";

type PartnerProtocolsViewProps = {
  data: PartnerProtocolsData;
};

type ActiveTab = "exercises" | "foods";
type ViewMode = "cards" | "table";
type DrawerMode = "exercise" | "food" | "import" | "use" | null;

type FoodForm = {
  carbs: number;
  category: PartnerProtocolFoodCategory;
  fat: number;
  fiber: number;
  foodId: string | null;
  householdMeasure: string;
  kcal: number;
  name: string;
  notes: string;
  protein: number;
  servingSize: number;
  servingUnit: string;
  sodium: number;
  source: PartnerProtocolFoodSource;
  status: "active" | "archived";
  suggestedUses: SuggestedUse[];
  tags: string;
};

type ExerciseForm = {
  cadence: string;
  defaultReps: string;
  defaultSets: number;
  equipment: PartnerProtocolExerciseEquipment;
  exerciseId: string | null;
  instructions: string;
  level: PartnerProtocolExerciseLevel;
  muscleGroup: PartnerProtocolExerciseMuscleGroup;
  secondaryMuscleGroups: string;
  name: string;
  objective: PartnerProtocolExerciseObjective;
  restSeconds: number;
  status: "active" | "archived";
  tags: string;
  thumbnailUrl: string;
  variations: string;
  videoUrl: string;
};

const foodCategories = Object.keys(foodCategoryLabels) as PartnerProtocolFoodCategory[];
const foodSources = Object.keys(foodSourceLabels) as PartnerProtocolFoodSource[];
const muscleGroups = Object.keys(muscleGroupLabels) as PartnerProtocolExerciseMuscleGroup[];
const secondaryMuscleGroups = ["peito", "costas", "pernas", "ombros", "biceps", "triceps", "core", "gluteos"] as const;
const equipments = Object.keys(equipmentLabels) as PartnerProtocolExerciseEquipment[];
const levels = Object.keys(levelLabels) as PartnerProtocolExerciseLevel[];
const objectives = Object.keys(objectiveLabels) as PartnerProtocolExerciseObjective[];
const suggestedUses = ["pre_treino", "pos_treino", "lanche", "refeicao_principal", "ceia", "outro"] as const;
type SuggestedUse = (typeof suggestedUses)[number];
const suggestedUseSet = new Set<string>(suggestedUses);

const emptyFood: FoodForm = {
  carbs: 0,
  category: "outros",
  fat: 0,
  fiber: 0,
  foodId: null,
  householdMeasure: "",
  kcal: 0,
  name: "",
  notes: "",
  protein: 0,
  servingSize: 100,
  servingUnit: "g",
  sodium: 0,
  source: "custom",
  status: "active",
  suggestedUses: [],
  tags: "",
};

const emptyExercise: ExerciseForm = {
  cadence: "2-0-2-0",
  defaultReps: "8-12",
  defaultSets: 4,
  equipment: "barra",
  exerciseId: null,
  instructions: "",
  level: "intermediario",
  muscleGroup: "pernas",
  secondaryMuscleGroups: "",
  name: "",
  objective: "hipertrofia",
  restSeconds: 90,
  status: "active",
  tags: "",
  thumbnailUrl: "",
  variations: "",
  videoUrl: "",
};

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[8px] border border-[#293b49] bg-[#101a24]/76", className)}>
      {children}
    </section>
  );
}

function SelectShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      {children}
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#7f91a0]" />
    </div>
  );
}

function fieldClass(className?: string) {
  return cn("h-9 w-full rounded-[7px] border border-[#2b3e4c] bg-[#0d1822] px-3 text-[12px] text-[#eaf2f7] outline-none transition-colors placeholder:text-[#6f8090] focus:border-[#2d9cff] sm:h-10 sm:text-[13px]", className);
}

function textareaClass(className?: string) {
  return cn("min-h-24 w-full rounded-[7px] border border-[#2b3e4c] bg-[#0d1822] px-3 py-2 text-[13px] text-[#eaf2f7] outline-none transition-colors placeholder:text-[#6f8090] focus:border-[#2d9cff]", className);
}

function parseTags(value: string) {
  return value.split(",").map((tag) => tag.trim()).filter(Boolean);
}

function parseList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",");
}

function FoodThumb() {
  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-[8px] border border-[#314555] bg-[radial-gradient(circle_at_30%_25%,rgba(70,189,125,0.32),rgba(16,29,39,0.95)_62%)] sm:size-[74px]">
      <Utensils className="size-5 text-[#55d58c] sm:size-8" />
    </div>
  );
}

function ExerciseThumb({ exercise }: { exercise: PartnerProtocolExercise }) {
  if (exercise.thumbnailUrl) {
    return <img alt="" className="size-12 shrink-0 rounded-[8px] border border-[#314555] object-cover sm:size-[74px]" src={exercise.thumbnailUrl} />;
  }

  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-[8px] border border-[#314555] bg-[radial-gradient(circle_at_30%_25%,rgba(45,156,255,0.32),rgba(16,29,39,0.95)_62%)] sm:size-[74px]">
      <Dumbbell className="size-5 text-[#56b5ff] sm:size-8" />
    </div>
  );
}

function Badge({ children, className, tone = "blue" }: { children: ReactNode; className?: string; tone?: "blue" | "green" | "purple" | "yellow" }) {
  const tones = {
    blue: "border-[#1d7ece] bg-[#0c2840] text-[#61b8ff]",
    green: "border-[#1d7041] bg-[#102d21] text-[#64db8a]",
    purple: "border-[#7558d1] bg-[#2a2350] text-[#b294ff]",
    yellow: "border-[#86651c] bg-[#302713] text-[#f2c85b]",
  };
  return <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium", tones[tone], className)}>{children}</span>;
}

function MetricCard({ icon: Icon, label, value, tone }: { icon: typeof Database; label: string; tone: string; value: number }) {
  return (
    <Panel className="flex min-h-[72px] items-center gap-3 px-3 py-3 sm:min-h-[92px] sm:gap-4 sm:px-5 sm:py-4">
      <div className={cn("flex size-9 items-center justify-center rounded-[7px] sm:size-12 sm:rounded-[8px]", tone)}>
        <Icon className="size-4 sm:size-6" />
      </div>
      <div>
        <p className="text-[21px] font-bold leading-none text-[#edf4f8] sm:text-[25px]">{value}</p>
        <p className="mt-1 text-[11px] leading-3 text-[#8797a6] sm:mt-2 sm:text-[12px]">{label}</p>
      </div>
    </Panel>
  );
}

function FoodMacroChips({ food }: { food: PartnerProtocolFood }) {
  const macros = [
    { Icon: Dumbbell, label: "P", tone: "bg-[#0e2c1e] text-[#62d98b]", value: `${formatNumber(food.protein)}g` },
    { Icon: Wheat, label: "C", tone: "bg-[#302813] text-[#f2c84b]", value: `${formatNumber(food.carbs)}g` },
    { Icon: Flame, label: "G", tone: "bg-[#32171b] text-[#f27882]", value: `${formatNumber(food.fat)}g` },
    { Icon: Database, label: "Kcal", tone: "bg-[#0b2a45] text-[#58b8ff]", value: formatNumber(food.kcal) },
  ];
  return (
    <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
      {macros.map(({ Icon, label, tone, value }) => (
        <span className={cn("inline-flex h-6 items-center gap-1 rounded-[6px] px-1.5 text-[10px] font-bold sm:h-7 sm:gap-1.5 sm:rounded-[7px] sm:px-2 sm:text-[11px]", tone)} key={label}>
          <Icon className="size-3 sm:size-3.5" />
          {label} {value}
        </span>
      ))}
    </div>
  );
}

export function PartnerProtocolsView({ data }: PartnerProtocolsViewProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("foods");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [query, setQuery] = useState("");
  const [foodCategory, setFoodCategory] = useState<"all" | PartnerProtocolFoodCategory>("all");
  const [foodSource, setFoodSource] = useState<"all" | PartnerProtocolFoodSource>("all");
  const [exerciseGroup, setExerciseGroup] = useState<"all" | PartnerProtocolExerciseMuscleGroup>("all");
  const [exerciseEquipment, setExerciseEquipment] = useState<"all" | PartnerProtocolExerciseEquipment>("all");
  const [statusFilter, setStatusFilter] = useState<"active" | "all" | "archived">("active");
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [foodForm, setFoodForm] = useState<FoodForm>(emptyFood);
  const [exerciseForm, setExerciseForm] = useState<ExerciseForm>(emptyExercise);
  const [useTarget, setUseTarget] = useState<{ id: string; itemType: "exercise" | "food"; title: string } | null>(null);
  const [useClient, setUseClient] = useState("");
  const [useNotes, setUseNotes] = useState("");
  const [importText, setImportText] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredFoods = useMemo(() => {
    const term = query.trim().toLowerCase();
    return data.foods.filter((food) => {
      const matchesTerm = !term || [food.name, food.categoryLabel, food.sourceLabel, ...food.tags].join(" ").toLowerCase().includes(term);
      const matchesCategory = foodCategory === "all" || food.category === foodCategory;
      const matchesSource = foodSource === "all" || food.source === foodSource;
      const matchesStatus = statusFilter === "all" || food.status === statusFilter;
      return matchesTerm && matchesCategory && matchesSource && matchesStatus;
    });
  }, [data.foods, foodCategory, foodSource, query, statusFilter]);

  const filteredExercises = useMemo(() => {
    const term = query.trim().toLowerCase();
    return data.exercises.filter((exercise) => {
      const matchesTerm = !term || [exercise.name, exercise.muscleGroupLabel, exercise.objectiveLabel, ...exercise.tags].join(" ").toLowerCase().includes(term);
      const matchesGroup = exerciseGroup === "all" || exercise.muscleGroup === exerciseGroup;
      const matchesEquipment = exerciseEquipment === "all" || exercise.equipment === exerciseEquipment;
      const matchesStatus = statusFilter === "all" || exercise.status === statusFilter;
      return matchesTerm && matchesGroup && matchesEquipment && matchesStatus;
    });
  }, [data.exercises, exerciseEquipment, exerciseGroup, query, statusFilter]);

  const visibleCount = activeTab === "foods" ? filteredFoods.length : filteredExercises.length;

  function openFood(food?: PartnerProtocolFood) {
    setFoodForm(food ? {
      carbs: food.carbs,
      category: food.category,
      fat: food.fat,
      fiber: food.fiber,
      foodId: food.id,
      householdMeasure: food.householdMeasure ?? "",
      kcal: food.kcal,
      name: food.name,
      notes: food.notes ?? "",
      protein: food.protein,
      servingSize: food.servingSize,
      servingUnit: food.servingUnit,
      sodium: food.sodium,
      source: food.source,
      status: food.status,
      suggestedUses: food.suggestedUses.filter((use): use is SuggestedUse => suggestedUseSet.has(use)),
      tags: food.tags.join(", "),
    } : emptyFood);
    setDrawerMode("food");
  }

  function openExercise(exercise?: PartnerProtocolExercise) {
    setExerciseForm(exercise ? {
      cadence: exercise.cadence ?? "",
      defaultReps: exercise.defaultReps,
      defaultSets: exercise.defaultSets,
      equipment: exercise.equipment,
      exerciseId: exercise.id,
      instructions: exercise.instructions ?? "",
      level: exercise.level,
      muscleGroup: exercise.muscleGroup,
      secondaryMuscleGroups: (exercise.secondaryMuscleGroups ?? []).map((group) => muscleGroupLabels[group]).join(", "),
      name: exercise.name,
      objective: exercise.objective,
      restSeconds: exercise.restSeconds,
      status: exercise.status,
      tags: exercise.tags.join(", "),
      thumbnailUrl: exercise.thumbnailUrl ?? "",
      variations: exercise.variations.join(", "),
      videoUrl: exercise.videoUrl ?? "",
    } : emptyExercise);
    setDrawerMode("exercise");
  }

  function openUseDraft(item: PartnerProtocolExercise | PartnerProtocolFood, itemType: "exercise" | "food") {
    setUseTarget({ id: item.id, itemType, title: item.name });
    setUseClient("");
    setUseNotes("");
    setDrawerMode("use");
  }

  function handleFoodSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = {
      carbs: foodForm.carbs,
      category: foodForm.category,
      fat: foodForm.fat,
      fiber: foodForm.fiber,
      householdMeasure: foodForm.householdMeasure || null,
      kcal: foodForm.kcal,
      name: foodForm.name,
      notes: foodForm.notes || null,
      protein: foodForm.protein,
      servingSize: foodForm.servingSize,
      servingUnit: foodForm.servingUnit,
      sodium: foodForm.sodium,
      source: foodForm.source,
      status: foodForm.status,
      suggestedUses: foodForm.suggestedUses,
      tags: parseTags(foodForm.tags),
    };

    startTransition(async () => {
      const result = foodForm.foodId
        ? await updatePartnerProtocolFood({ ...payload, foodId: foodForm.foodId })
        : await createPartnerProtocolFood(payload);
      if (!result.ok) {
        toast.error(result.error ?? "Não foi possível salvar.");
        return;
      }
      toast.success(result.message ?? "Alimento salvo.");
      setDrawerMode(null);
    });
  }

  function handleExerciseSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = {
      cadence: exerciseForm.cadence || null,
      defaultReps: exerciseForm.defaultReps,
      defaultSets: exerciseForm.defaultSets,
      equipment: exerciseForm.equipment,
      instructions: exerciseForm.instructions || null,
      level: exerciseForm.level,
      muscleGroup: exerciseForm.muscleGroup,
      secondaryMuscleGroups: parseList(exerciseForm.secondaryMuscleGroups)
        .map((label) => muscleGroups.find((group) => muscleGroupLabels[group].toLowerCase() === label.toLowerCase()) ?? label)
        .filter((group): group is (typeof secondaryMuscleGroups)[number] => secondaryMuscleGroups.includes(group as (typeof secondaryMuscleGroups)[number]))
        .filter((group) => group !== exerciseForm.muscleGroup),
      name: exerciseForm.name,
      objective: exerciseForm.objective,
      restSeconds: exerciseForm.restSeconds,
      status: exerciseForm.status,
      tags: parseTags(exerciseForm.tags),
      thumbnailUrl: exerciseForm.thumbnailUrl || null,
      variations: parseList(exerciseForm.variations),
      videoUrl: exerciseForm.videoUrl || null,
    };

    startTransition(async () => {
      const result = exerciseForm.exerciseId
        ? await updatePartnerProtocolExercise({ ...payload, exerciseId: exerciseForm.exerciseId })
        : await createPartnerProtocolExercise(payload);
      if (!result.ok) {
        toast.error(result.error ?? "Não foi possível salvar.");
        return;
      }
      toast.success(result.message ?? "Exercício salvo.");
      setDrawerMode(null);
    });
  }

  function handleArchive(itemType: "exercise" | "food", id: string, archived: boolean) {
    startTransition(async () => {
      const result = await setPartnerProtocolArchived({ id, itemType, value: !archived });
      if (!result.ok) {
        toast.error(result.error ?? "Não foi possível alterar status.");
        return;
      }
      toast.success(result.message ?? "Status atualizado.");
    });
  }

  function handleUseSubmit(event: FormEvent) {
    event.preventDefault();
    if (!useTarget) return;
    startTransition(async () => {
      const result = await createPartnerProtocolUseDraft({
        exerciseId: useTarget.itemType === "exercise" ? useTarget.id : null,
        foodId: useTarget.itemType === "food" ? useTarget.id : null,
        itemType: useTarget.itemType,
        notes: useNotes || null,
        patientId: useClient || null,
        planContext: useTarget.itemType === "food" ? "dieta" : "treino",
      });
      if (!result.ok) {
        toast.error(result.error ?? "Não foi possível registrar o uso.");
        return;
      }
      toast.success(result.message ?? "Uso registrado.");
      setDrawerMode(null);
    });
  }

  function handleImportSubmit(event: FormEvent) {
    event.preventDefault();
    const rows = parseFoodImportTable(importText);
    if (rows.length === 0) {
      toast.error("A tabela precisa ter cabeçalho e ao menos um alimento válido.");
      return;
    }
    startTransition(async () => {
      const result = await importPartnerProtocolFoods({ rows });
      if (!result.ok) {
        toast.error(result.error ?? "Não foi possível importar.");
        return;
      }
      toast.success(`${result.count ?? rows.length} alimentos importados.`);
      setImportText("");
      setDrawerMode(null);
    });
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportText(await file.text());
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(11,48,74,0.54),transparent_34%),#07131d] px-3 py-4 text-[#eef4f8] sm:px-5 sm:py-8 md:px-10 lg:px-[42px]">
      <div className="mx-auto max-w-[1320px]">
        <header className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-[24px] font-bold leading-tight tracking-normal text-white sm:text-[30px] md:text-[34px]">Base de Protocolos</h1>
            <p className="mt-1 max-w-[780px] text-[12px] leading-4 text-[#a0adba] sm:mt-3 sm:text-[14px] sm:leading-6">
              Monte sua base de alimentos, exercícios e blocos reutilizáveis para criar planos com mais rapidez.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            <button className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] bg-[#188cef] px-3 text-[12px] font-semibold text-white shadow-[0_12px_30px_rgba(24,140,239,0.24)] hover:bg-[#2d9cff] sm:h-12 sm:gap-2 sm:px-5 sm:text-[14px]" onClick={() => openFood()} type="button">
              <Plus className="size-4" /> Novo alimento
            </button>
            <button className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] bg-[#188cef] px-3 text-[12px] font-semibold text-white shadow-[0_12px_30px_rgba(24,140,239,0.24)] hover:bg-[#2d9cff] sm:h-12 sm:gap-2 sm:px-5 sm:text-[14px]" onClick={() => openExercise()} type="button">
              <Plus className="size-4" /> Novo exercício
            </button>
            <button className="col-span-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] border border-[#2b3d4b] bg-[#111b27] px-3 text-[12px] font-semibold text-[#e7eef5] hover:border-[#2d9cff] sm:col-auto sm:h-12 sm:gap-2 sm:px-5 sm:text-[14px]" onClick={() => setDrawerMode("import")} type="button">
              <UploadCloud className="size-4" /> Importar base
            </button>
          </div>
        </header>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-8 sm:gap-4 md:grid-cols-3">
          <MetricCard icon={Utensils} label="alimentos ativos" tone="bg-[#0c2b1f] text-[#58d881]" value={data.metrics.activeFoods} />
          <MetricCard icon={Dumbbell} label="exercícios ativos" tone="bg-[#0b2a45] text-[#58b8ff]" value={data.metrics.activeExercises} />
          <MetricCard icon={Database} label="itens importados" tone="bg-[#2a2350] text-[#b294ff]" value={data.metrics.importedFoods} />
        </div>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-b border-[#253847] sm:mt-8 sm:gap-4">
          <div className="flex gap-3 sm:gap-6">
            <button className={cn("border-b-2 px-1 pb-3 text-[12px] sm:px-2 sm:pb-4 sm:text-[15px]", activeTab === "foods" ? "border-[#2d9cff] text-[#46adff]" : "border-transparent text-[#9aa8b4]")} onClick={() => setActiveTab("foods")} type="button">
              Base de Alimentos · {data.foods.length}
            </button>
            <button className={cn("border-b-2 px-1 pb-3 text-[12px] sm:px-2 sm:pb-4 sm:text-[15px]", activeTab === "exercises" ? "border-[#2d9cff] text-[#46adff]" : "border-transparent text-[#9aa8b4]")} onClick={() => setActiveTab("exercises")} type="button">
              Biblioteca de Exercícios · {data.exercises.length}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:mt-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap gap-2 sm:mb-5 sm:gap-3">
              <div className="relative min-w-[190px] flex-1 sm:min-w-[280px]">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7f91a0]" />
                <input className={fieldClass("pl-10")} onChange={(event) => setQuery(event.target.value)} placeholder={activeTab === "foods" ? "Buscar alimento por nome ou categoria..." : "Buscar exercício por nome, grupo ou objetivo..."} value={query} />
              </div>
              {activeTab === "foods" ? (
                <>
                  <SelectShell>
                    <select className={fieldClass("w-[134px] appearance-none pr-9 sm:w-[150px]")} onChange={(event) => setFoodCategory(event.target.value as typeof foodCategory)} value={foodCategory}>
                      <option value="all">Categoria</option>
                      {foodCategories.map((category) => <option key={category} value={category}>{foodCategoryLabels[category]}</option>)}
                    </select>
                  </SelectShell>
                  <SelectShell>
                    <select className={fieldClass("w-[118px] appearance-none pr-9 sm:w-[130px]")} onChange={(event) => setFoodSource(event.target.value as typeof foodSource)} value={foodSource}>
                      <option value="all">Origem</option>
                      {foodSources.map((source) => <option key={source} value={source}>{foodSourceLabels[source]}</option>)}
                    </select>
                  </SelectShell>
                </>
              ) : (
                <>
                  <SelectShell>
                    <select className={fieldClass("w-[146px] appearance-none pr-9 sm:w-[170px]")} onChange={(event) => setExerciseGroup(event.target.value as typeof exerciseGroup)} value={exerciseGroup}>
                      <option value="all">Grupo muscular</option>
                      {muscleGroups.map((group) => <option key={group} value={group}>{muscleGroupLabels[group]}</option>)}
                    </select>
                  </SelectShell>
                  <SelectShell>
                    <select className={fieldClass("w-[132px] appearance-none pr-9 sm:w-[150px]")} onChange={(event) => setExerciseEquipment(event.target.value as typeof exerciseEquipment)} value={exerciseEquipment}>
                      <option value="all">Equipamento</option>
                      {equipments.map((equipment) => <option key={equipment} value={equipment}>{equipmentLabels[equipment]}</option>)}
                    </select>
                  </SelectShell>
                </>
              )}
              <SelectShell>
                <select className={fieldClass("w-[118px] appearance-none pr-9 sm:w-[130px]")} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} value={statusFilter}>
                  <option value="active">Ativos</option>
                  <option value="archived">Arquivados</option>
                  <option value="all">Todos</option>
                </select>
              </SelectShell>
              <div className="ml-auto flex rounded-[8px] border border-[#2b3d4b] bg-[#111b27] p-1">
                <button aria-label="Visualização em tabela" className={cn("flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-[12px] sm:h-9 sm:gap-2 sm:px-3 sm:text-[13px]", viewMode === "table" ? "bg-[#0b2b45] text-[#55b4ff]" : "text-[#9aa8b4]")} onClick={() => setViewMode("table")} type="button">
                  <LayoutList className="size-4" /> Tabela
                </button>
                <button aria-label="Visualização em cards" className={cn("flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-[12px] sm:h-9 sm:gap-2 sm:px-3 sm:text-[13px]", viewMode === "cards" ? "bg-[#0b2b45] text-[#55b4ff]" : "text-[#9aa8b4]")} onClick={() => setViewMode("cards")} type="button">
                  <Grid2X2 className="size-4" /> Cards
                </button>
              </div>
            </div>
            <Panel className="overflow-hidden">
              {activeTab === "foods" ? (
                <FoodList foods={filteredFoods} onArchive={handleArchive} onEdit={openFood} onUse={openUseDraft} viewMode={viewMode} />
              ) : (
                <ExerciseList exercises={filteredExercises} onArchive={handleArchive} onEdit={openExercise} onUse={openUseDraft} viewMode={viewMode} />
              )}
              <div className="border-t border-[#223443] px-5 py-4 text-[12px] text-[#9aa8b4]">
                Mostrando {visibleCount} {activeTab === "foods" ? "alimentos" : "exercícios"}
              </div>
            </Panel>
          </div>

          <aside className="space-y-4">
            <Panel className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-semibold text-white">Pendências da base</h2>
                <span className="text-[#f6a81b]">△</span>
              </div>
              <div className="mt-4 space-y-3 text-[13px] text-[#cbd6df]">
                <p>{data.metrics.foodWithoutCategory} alimentos sem categoria</p>
                <p>{data.metrics.exerciseWithoutVideo} exercícios sem vídeo</p>
                <p>{data.metrics.customFoods} alimentos customizados</p>
              </div>
            </Panel>
            <Panel className="p-5">
              <h2 className="text-[16px] font-semibold text-white">Mais usados nos planos</h2>
              <div className="mt-4 space-y-3">
                {(activeTab === "foods" ? data.topFoods : data.topExercises).map((item, index) => (
                  <div className="flex items-start gap-3" key={item.id}>
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-[6px] bg-[#123f68] text-[12px] font-bold text-[#89caff]">{index + 1}</span>
                    <div>
                      <p className="text-[13px] font-semibold text-[#edf4f8]">{item.name}</p>
                      <p className="text-[11px] text-[#7f91a0]">usado em {item.usageCount} planos</p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel className="p-5">
              <h2 className="text-[16px] font-semibold text-white">Sugestões de melhoria</h2>
              <div className="mt-4 space-y-3 text-[13px] text-[#cbd6df]">
                <p>Revisar duplicados antes de criar novos protocolos.</p>
                <p>Completar vídeos ausentes nos exercícios principais.</p>
                <p>Padronizar itens customizados importados.</p>
              </div>
            </Panel>
          </aside>
        </div>
      </div>

      <Sheet open={drawerMode === "food"} onOpenChange={(open) => !open && setDrawerMode(null)}>
        <SheetContent className="w-full overflow-y-auto border-[#293b49] bg-[#0c1823] text-[#edf4f8] sm:max-w-[520px]">
          <SheetHeader>
            <SheetTitle className="text-white">{foodForm.foodId ? "Editar alimento" : "Novo alimento"}</SheetTitle>
            <SheetDescription className="text-[#92a1ad]">Adicione um item à sua base e use-o em planos alimentares.</SheetDescription>
          </SheetHeader>
          <form className="mt-6 space-y-5" onSubmit={handleFoodSubmit}>
            <Input label="Nome do alimento" onChange={(value) => setFoodForm((form) => ({ ...form, name: value }))} placeholder="Ex.: Batata doce cozida" required value={foodForm.name} />
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Categoria" onChange={(value) => setFoodForm((form) => ({ ...form, category: value as PartnerProtocolFoodCategory }))} value={foodForm.category}>
                {foodCategories.map((category) => <option key={category} value={category}>{foodCategoryLabels[category]}</option>)}
              </SelectField>
              <SelectField label="Origem" onChange={(value) => setFoodForm((form) => ({ ...form, source: value as PartnerProtocolFoodSource }))} value={foodForm.source}>
                {foodSources.map((source) => <option key={source} value={source}>{foodSourceLabels[source]}</option>)}
              </SelectField>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <NumberField label="Porção padrão" onChange={(value) => setFoodForm((form) => ({ ...form, servingSize: value }))} value={foodForm.servingSize} />
              <Input label="Unidade" onChange={(value) => setFoodForm((form) => ({ ...form, servingUnit: value }))} value={foodForm.servingUnit} />
              <Input label="Medida caseira" onChange={(value) => setFoodForm((form) => ({ ...form, householdMeasure: value }))} placeholder="Ex.: 1 concha" value={foodForm.householdMeasure} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <NumberField label="Kcal" onChange={(value) => setFoodForm((form) => ({ ...form, kcal: value }))} value={foodForm.kcal} />
              <NumberField label="Carboidratos" onChange={(value) => setFoodForm((form) => ({ ...form, carbs: value }))} value={foodForm.carbs} />
              <NumberField label="Proteínas" onChange={(value) => setFoodForm((form) => ({ ...form, protein: value }))} value={foodForm.protein} />
              <NumberField label="Gorduras" onChange={(value) => setFoodForm((form) => ({ ...form, fat: value }))} value={foodForm.fat} />
              <NumberField label="Fibras" onChange={(value) => setFoodForm((form) => ({ ...form, fiber: value }))} value={foodForm.fiber} />
              <NumberField label="Sódio" onChange={(value) => setFoodForm((form) => ({ ...form, sodium: value }))} value={foodForm.sodium} />
            </div>
            <label className="block text-[12px] font-medium text-[#cbd6df]">
              Observações
              <textarea className={textareaClass("mt-2")} onChange={(event) => setFoodForm((form) => ({ ...form, notes: event.target.value }))} placeholder="Informações adicionais sobre o alimento..." value={foodForm.notes} />
            </label>
            <Input label="Tags" onChange={(value) => setFoodForm((form) => ({ ...form, tags: value }))} placeholder="nutrição, hipertrofia, lanche" value={foodForm.tags} />
            <div>
              <p className="mb-2 text-[12px] font-medium text-[#cbd6df]">Usos sugeridos</p>
              <div className="grid grid-cols-2 gap-2">
                {suggestedUses.map((use) => (
                  <label className="flex items-center gap-2 text-[12px] text-[#aebbc6]" key={use}>
                    <input checked={foodForm.suggestedUses.includes(use)} onChange={(event) => setFoodForm((form) => ({ ...form, suggestedUses: event.target.checked ? [...form.suggestedUses, use] : form.suggestedUses.filter((item) => item !== use) }))} type="checkbox" />
                    {suggestedUseLabels[use]}
                  </label>
                ))}
              </div>
            </div>
            <DrawerFooter loading={isPending} onCancel={() => setDrawerMode(null)} submitLabel="Salvar alimento" />
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={drawerMode === "exercise"} onOpenChange={(open) => !open && setDrawerMode(null)}>
        <SheetContent className="w-full overflow-y-auto border-[#293b49] bg-[#0c1823] text-[#edf4f8] sm:max-w-[560px]">
          <SheetHeader>
            <SheetTitle className="text-white">{exerciseForm.exerciseId ? "Editar exercício" : "Novo exercício"}</SheetTitle>
            <SheetDescription className="text-[#92a1ad]">Adicione um exercício à biblioteca para reutilizar em planos e protocolos.</SheetDescription>
          </SheetHeader>
          <form className="mt-6 space-y-5" onSubmit={handleExerciseSubmit}>
            <Input label="Nome do exercício" onChange={(value) => setExerciseForm((form) => ({ ...form, name: value }))} placeholder="Ex.: Agachamento livre" required value={exerciseForm.name} />
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Grupo muscular" onChange={(value) => setExerciseForm((form) => ({ ...form, muscleGroup: value as PartnerProtocolExerciseMuscleGroup }))} value={exerciseForm.muscleGroup}>
                {muscleGroups.map((group) => <option key={group} value={group}>{muscleGroupLabels[group]}</option>)}
              </SelectField>
              <SelectField label="Equipamento" onChange={(value) => setExerciseForm((form) => ({ ...form, equipment: value as PartnerProtocolExerciseEquipment }))} value={exerciseForm.equipment}>
                {equipments.map((equipment) => <option key={equipment} value={equipment}>{equipmentLabels[equipment]}</option>)}
              </SelectField>
              <SelectField label="Nível" onChange={(value) => setExerciseForm((form) => ({ ...form, level: value as PartnerProtocolExerciseLevel }))} value={exerciseForm.level}>
                {levels.map((level) => <option key={level} value={level}>{levelLabels[level]}</option>)}
              </SelectField>
              <SelectField label="Objetivo" onChange={(value) => setExerciseForm((form) => ({ ...form, objective: value as PartnerProtocolExerciseObjective }))} value={exerciseForm.objective}>
                {objectives.map((objective) => <option key={objective} value={objective}>{objectiveLabels[objective]}</option>)}
              </SelectField>
            </div>
            <Input label="Grupos musculares secundários" onChange={(value) => setExerciseForm((form) => ({ ...form, secondaryMuscleGroups: value }))} placeholder="Tríceps, Ombros" value={exerciseForm.secondaryMuscleGroups} />
            <div className="grid grid-cols-4 gap-3">
              <NumberField label="Séries" onChange={(value) => setExerciseForm((form) => ({ ...form, defaultSets: value }))} value={exerciseForm.defaultSets} />
              <Input label="Repetições" onChange={(value) => setExerciseForm((form) => ({ ...form, defaultReps: value }))} value={exerciseForm.defaultReps} />
              <NumberField label="Descanso" onChange={(value) => setExerciseForm((form) => ({ ...form, restSeconds: value }))} value={exerciseForm.restSeconds} />
              <Input label="Cadência" onChange={(value) => setExerciseForm((form) => ({ ...form, cadence: value }))} value={exerciseForm.cadence} />
            </div>
            <Input label="Link do vídeo (YouTube ou Vimeo)" onChange={(value) => setExerciseForm((form) => ({ ...form, videoUrl: value }))} placeholder="https://youtube.com/watch?v=..." value={exerciseForm.videoUrl} />
            <Input label="Imagem / thumbnail" onChange={(value) => setExerciseForm((form) => ({ ...form, thumbnailUrl: value }))} placeholder="https://..." value={exerciseForm.thumbnailUrl} />
            <label className="block text-[12px] font-medium text-[#cbd6df]">
              Orientações técnicas
              <textarea className={textareaClass("mt-2")} onChange={(event) => setExerciseForm((form) => ({ ...form, instructions: event.target.value }))} placeholder="Pontos de execução, postura, respiração e cuidados..." value={exerciseForm.instructions} />
            </label>
            <Input label="Tags" onChange={(value) => setExerciseForm((form) => ({ ...form, tags: value }))} placeholder="força, base, lower" value={exerciseForm.tags} />
            <Input label="Variações relacionadas" onChange={(value) => setExerciseForm((form) => ({ ...form, variations: value }))} placeholder="Agachamento goblet, Leg press" value={exerciseForm.variations} />
            <DrawerFooter loading={isPending} onCancel={() => setDrawerMode(null)} submitLabel="Salvar exercício" />
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={drawerMode === "import"} onOpenChange={(open) => !open && setDrawerMode(null)}>
        <SheetContent className="w-full overflow-y-auto border-[#293b49] bg-[#0c1823] text-[#edf4f8] sm:max-w-[540px]">
          <SheetHeader>
            <SheetTitle className="text-white">Importar base de alimentos</SheetTitle>
            <SheetDescription className="text-[#92a1ad]">Cole ou envie uma tabela CSV/TSV exportada do Excel ou Google Sheets.</SheetDescription>
          </SheetHeader>
          <form className="mt-6 space-y-5" onSubmit={handleImportSubmit}>
            <label className="flex min-h-[130px] cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed border-[#365064] bg-[#0f1d28] text-center">
              <FileUp className="mb-3 size-8 text-[#58b8ff]" />
              <span className="text-[13px] font-semibold text-white">Clique para selecionar CSV ou TSV</span>
              <span className="mt-1 text-[12px] text-[#8fa0ad]">Colunas: nome, categoria, origem, porcao, unidade, kcal, carboidratos, proteinas, gorduras, fibras, sodio</span>
              <input accept=".csv,.tsv,text/csv,text/tab-separated-values" className="sr-only" onChange={handleImportFile} type="file" />
            </label>
            <label className="block text-[12px] font-medium text-[#cbd6df]">
              Conteúdo da tabela
              <textarea className={textareaClass("mt-2 min-h-[220px] font-mono text-[12px]")} onChange={(event) => setImportText(event.target.value)} placeholder={"nome;categoria;origem;porcao;unidade;kcal;carboidratos;proteinas;gorduras;fibras;sodio\nArroz branco cozido;cereal;taco;100;g;130;28.1;2.5;0.2;1.6;1"} value={importText} />
            </label>
            <p className="text-[12px] text-[#8fa0ad]">{parseFoodImportTable(importText).length} alimentos reconhecidos</p>
            <DrawerFooter loading={isPending} onCancel={() => setDrawerMode(null)} submitLabel="Importar alimentos" />
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={drawerMode === "use"} onOpenChange={(open) => !open && setDrawerMode(null)}>
        <SheetContent className="w-full border-[#293b49] bg-[#0c1823] text-[#edf4f8] sm:max-w-[440px]">
          <SheetHeader>
            <SheetTitle className="text-white">Usar em plano</SheetTitle>
            <SheetDescription className="text-[#92a1ad]">Registre este item como rascunho para reaproveitar no próximo plano.</SheetDescription>
          </SheetHeader>
          <form className="mt-6 space-y-5" onSubmit={handleUseSubmit}>
            <Panel className="p-4">
              <p className="text-[12px] text-[#8fa0ad]">Item selecionado</p>
              <p className="mt-1 text-[16px] font-semibold text-white">{useTarget?.title}</p>
            </Panel>
            <SelectField label="Cliente" onChange={setUseClient} value={useClient}>
              <option value="">Rascunho geral</option>
              {data.clients.map((client) => <option key={client.id} value={client.id}>{client.displayName}</option>)}
            </SelectField>
            <label className="block text-[12px] font-medium text-[#cbd6df]">
              Observações
              <textarea className={textareaClass("mt-2")} onChange={(event) => setUseNotes(event.target.value)} placeholder="Ex.: usar no plano de hipertrofia da próxima revisão" value={useNotes} />
            </label>
            <DrawerFooter loading={isPending} onCancel={() => setDrawerMode(null)} submitLabel="Registrar uso" />
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FoodList({ foods, onArchive, onEdit, onUse, viewMode }: {
  foods: PartnerProtocolFood[];
  onArchive: (itemType: "exercise" | "food", id: string, archived: boolean) => void;
  onEdit: (food: PartnerProtocolFood) => void;
  onUse: (item: PartnerProtocolFood, itemType: "food") => void;
  viewMode: ViewMode;
}) {
  if (foods.length === 0) return <EmptyState label="Nenhum alimento encontrado." />;
  if (viewMode === "cards") {
    return (
      <div className="grid gap-2 p-2 sm:gap-4 sm:p-4 md:grid-cols-2">
        {foods.map((food) => (
          <Panel className="p-3 sm:p-4" key={food.id}>
            <div className="flex gap-3 sm:gap-4">
              <FoodThumb />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-white sm:text-[16px]">{food.name}</p>
                <p className="mt-1 text-[11px] text-[#8fa0ad] sm:text-[12px]">{food.categoryLabel} · usado em {food.usageCount} planos</p>
                <p className="mt-1 text-[11px] text-[#aebbc6] sm:mt-2 sm:text-[12px]">{food.servingLabel}</p>
                <FoodMacroChips food={food} />
              </div>
            </div>
            <ItemActions archived={food.status === "archived"} onArchive={() => onArchive("food", food.id, food.status === "archived")} onEdit={() => onEdit(food)} onUse={() => onUse(food, "food")} sourceLabel={food.sourceLabel} />
          </Panel>
        ))}
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#223443]">
      {foods.map((food) => (
        <div className="grid min-h-[82px] grid-cols-[52px_minmax(0,1fr)] items-start gap-3 px-3 py-3 sm:min-h-[104px] sm:grid-cols-[82px_minmax(0,1fr)_100px_48px_48px_150px] sm:items-center sm:gap-4 sm:px-5 sm:py-4 max-lg:sm:grid-cols-[82px_minmax(0,1fr)_auto]" key={food.id}>
          <FoodThumb />
          <div className="min-w-0">
            <p className="line-clamp-2 text-[13px] font-semibold leading-5 text-white sm:truncate sm:text-[16px]">{food.name}</p>
            <p className="mt-1 text-[11px] text-[#8fa0ad] sm:text-[12px]">{food.categoryLabel} · usado em {food.usageCount} planos</p>
            <p className="mt-1 text-[11px] text-[#aebbc6] sm:mt-2 sm:text-[13px]">{food.servingLabel}</p>
            <FoodMacroChips food={food} />
          </div>
          <Badge className="hidden sm:inline-flex" tone={food.source === "custom" ? "green" : "blue"}>{food.sourceLabel}</Badge>
          <IconAction className="hidden sm:flex" label={`Ver ${food.name}`}><Eye className="size-4" /></IconAction>
          <IconAction className="hidden sm:flex" label={`Editar ${food.name}`} onClick={() => onEdit(food)}><Pencil className="size-4" /></IconAction>
          <UseButton className="hidden sm:inline-flex" onClick={() => onUse(food, "food")} />
          <div className="col-span-2 grid grid-cols-[auto_1fr] gap-2 sm:hidden">
            <div className="flex items-center gap-1.5">
              <Badge tone={food.source === "custom" ? "green" : "blue"}>{food.sourceLabel}</Badge>
              <IconAction label={`Ver ${food.name}`}><Eye className="size-4" /></IconAction>
              <IconAction label={`Editar ${food.name}`} onClick={() => onEdit(food)}><Pencil className="size-4" /></IconAction>
              <IconAction label={food.status === "archived" ? "Restaurar item" : "Arquivar item"} onClick={() => onArchive("food", food.id, food.status === "archived")}>{food.status === "archived" ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}</IconAction>
            </div>
            <UseButton className="w-full" onClick={() => onUse(food, "food")} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ExerciseList({ exercises, onArchive, onEdit, onUse, viewMode }: {
  exercises: PartnerProtocolExercise[];
  onArchive: (itemType: "exercise" | "food", id: string, archived: boolean) => void;
  onEdit: (exercise: PartnerProtocolExercise) => void;
  onUse: (item: PartnerProtocolExercise, itemType: "exercise") => void;
  viewMode: ViewMode;
}) {
  if (exercises.length === 0) return <EmptyState label="Nenhum exercício encontrado." />;
  if (viewMode === "cards") {
    return (
      <div className="grid gap-2 p-2 sm:gap-4 sm:p-4 md:grid-cols-2">
        {exercises.map((exercise) => (
          <Panel className="p-3 sm:p-4" key={exercise.id}>
            <div className="flex gap-3 sm:gap-4">
              <ExerciseThumb exercise={exercise} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-white sm:text-[16px]">{exercise.name}</p>
                <p className="mt-1 text-[11px] text-[#8fa0ad] sm:text-[12px]">{exercise.muscleGroupLabel} · {exercise.equipmentLabel} · {exercise.levelLabel}</p>
                <p className="mt-1 text-[11px] text-[#aebbc6] sm:mt-2 sm:text-[13px]">{exercise.defaultSets} séries · {exercise.defaultReps} reps · {exercise.restSeconds}s</p>
              </div>
            </div>
            <ItemActions archived={exercise.status === "archived"} onArchive={() => onArchive("exercise", exercise.id, exercise.status === "archived")} onEdit={() => onEdit(exercise)} onUse={() => onUse(exercise, "exercise")} sourceLabel={exercise.objectiveLabel} />
          </Panel>
        ))}
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#223443]">
      {exercises.map((exercise) => (
        <div className="grid min-h-[82px] grid-cols-[52px_minmax(0,1fr)] items-start gap-3 px-3 py-3 sm:min-h-[104px] sm:grid-cols-[82px_minmax(0,1fr)_116px_48px_48px_150px] sm:items-center sm:gap-4 sm:px-5 sm:py-4 max-lg:sm:grid-cols-[82px_minmax(0,1fr)_auto]" key={exercise.id}>
          <ExerciseThumb exercise={exercise} />
          <div className="min-w-0">
            <p className="line-clamp-2 text-[13px] font-semibold leading-5 text-white sm:truncate sm:text-[16px]">{exercise.name}</p>
            <p className="mt-1 text-[11px] text-[#8fa0ad] sm:text-[12px]">{exercise.muscleGroupLabel} · {exercise.equipmentLabel} · {exercise.levelLabel}</p>
            <p className="mt-1 text-[11px] text-[#aebbc6] sm:mt-2 sm:text-[13px]">{exercise.defaultSets} séries · {exercise.defaultReps} reps · {exercise.restSeconds}s</p>
          </div>
          <Badge className="hidden sm:inline-flex" tone={exercise.objective === "forca" ? "green" : exercise.objective === "resistencia" ? "purple" : "yellow"}>{exercise.objectiveLabel}</Badge>
          <IconAction className="hidden sm:flex" label={`Ver ${exercise.name}`}><Eye className="size-4" /></IconAction>
          <IconAction className="hidden sm:flex" label={`Editar ${exercise.name}`} onClick={() => onEdit(exercise)}><Pencil className="size-4" /></IconAction>
          <UseButton className="hidden sm:inline-flex" onClick={() => onUse(exercise, "exercise")} />
          <div className="col-span-2 grid grid-cols-[auto_1fr] gap-2 sm:hidden">
            <div className="flex items-center gap-1.5">
              <Badge tone={exercise.objective === "forca" ? "green" : exercise.objective === "resistencia" ? "purple" : "yellow"}>{exercise.objectiveLabel}</Badge>
              <IconAction label={`Ver ${exercise.name}`}><Eye className="size-4" /></IconAction>
              <IconAction label={`Editar ${exercise.name}`} onClick={() => onEdit(exercise)}><Pencil className="size-4" /></IconAction>
              <IconAction label={exercise.status === "archived" ? "Restaurar item" : "Arquivar item"} onClick={() => onArchive("exercise", exercise.id, exercise.status === "archived")}>{exercise.status === "archived" ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}</IconAction>
            </div>
            <UseButton className="w-full" onClick={() => onUse(exercise, "exercise")} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="flex min-h-[220px] items-center justify-center text-[14px] text-[#8fa0ad]">{label}</div>;
}

function UseButton({ className, onClick }: { className?: string; onClick: () => void }) {
  return (
    <button className={cn("inline-flex h-8 items-center justify-center rounded-[7px] border border-[#1d7ece] bg-[#0c2840] px-3 text-[12px] font-semibold text-[#c9e8ff] hover:bg-[#123f68] sm:h-10 sm:px-4 sm:text-[13px]", className)} onClick={onClick} type="button">
      Usar em plano
    </button>
  );
}

function IconAction({ children, className, label, onClick }: { children: ReactNode; className?: string; label: string; onClick?: () => void }) {
  return (
    <button aria-label={label} className={cn("flex size-8 items-center justify-center rounded-[7px] text-[#b8c4cf] hover:bg-[#172a38] hover:text-white sm:size-10", className)} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function ItemActions({ archived, onArchive, onEdit, onUse, sourceLabel }: { archived: boolean; onArchive: () => void; onEdit: () => void; onUse: () => void; sourceLabel: string }) {
  return (
    <div className="mt-3 flex items-center justify-between gap-2 sm:mt-4">
      <Badge>{sourceLabel}</Badge>
      <div className="flex gap-1">
        <IconAction label="Editar item" onClick={onEdit}><Pencil className="size-4" /></IconAction>
        <IconAction label={archived ? "Restaurar item" : "Arquivar item"} onClick={onArchive}>{archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}</IconAction>
        <UseButton onClick={onUse} />
      </div>
    </div>
  );
}

function Input({ label, onChange, placeholder, required, value }: { label: string; onChange: (value: string) => void; placeholder?: string; required?: boolean; value: string }) {
  return (
    <label className="block text-[12px] font-medium text-[#cbd6df]">
      {label}
      <input className={fieldClass("mt-2")} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} value={value} />
    </label>
  );
}

function NumberField({ label, onChange, value }: { label: string; onChange: (value: number) => void; value: number }) {
  return (
    <label className="block text-[12px] font-medium text-[#cbd6df]">
      {label}
      <input className={fieldClass("mt-2")} min="0" onChange={(event) => onChange(Number(event.target.value))} step="0.01" type="number" value={value} />
    </label>
  );
}

function SelectField({ children, label, onChange, value }: { children: ReactNode; label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="block text-[12px] font-medium text-[#cbd6df]">
      {label}
      <SelectShell className="mt-2">
        <select className={fieldClass("appearance-none pr-9")} onChange={(event) => onChange(event.target.value)} value={value}>
          {children}
        </select>
      </SelectShell>
    </label>
  );
}

function DrawerFooter({ loading, onCancel, submitLabel }: { loading: boolean; onCancel: () => void; submitLabel: string }) {
  return (
    <div className="sticky bottom-0 -mx-6 mt-6 flex gap-3 border-t border-[#223443] bg-[#0c1823] px-6 py-4">
      <button className="h-11 flex-1 rounded-[7px] border border-[#314555] text-[13px] font-semibold text-[#e7eef5] hover:bg-[#132431]" onClick={onCancel} type="button">
        Cancelar
      </button>
      <button className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[7px] bg-[#188cef] text-[13px] font-semibold text-white hover:bg-[#2d9cff] disabled:opacity-60" disabled={loading} type="submit">
        <Save className="size-4" />
        {loading ? "Salvando..." : submitLabel}
      </button>
    </div>
  );
}
