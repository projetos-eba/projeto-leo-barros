"use client";

import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  getPartnerProtocolExerciseForEdit,
  getPartnerProtocolFoodForEdit,
  updatePartnerProtocolExercise,
  updatePartnerProtocolFood,
} from "@/app/parceiros/cadastros/actions";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  equipmentLabels,
  foodCategoryLabels,
  foodSourceLabels,
  levelLabels,
  muscleGroupLabels,
  objectiveLabels,
  type PartnerProtocolExercise,
  type PartnerProtocolExerciseEquipment,
  type PartnerProtocolExerciseLevel,
  type PartnerProtocolExerciseMuscleGroup,
  type PartnerProtocolExerciseObjective,
  type PartnerProtocolFood,
  type PartnerProtocolFoodCategory,
  type PartnerProtocolFoodSource,
  type PartnerProtocolStatus,
} from "@/lib/partners/protocols-metrics";

const foodCategories = Object.keys(foodCategoryLabels) as PartnerProtocolFoodCategory[];
const foodSources = Object.keys(foodSourceLabels) as PartnerProtocolFoodSource[];
const muscleGroups = Object.keys(muscleGroupLabels) as PartnerProtocolExerciseMuscleGroup[];
const equipments = Object.keys(equipmentLabels) as PartnerProtocolExerciseEquipment[];
const levels = Object.keys(levelLabels) as PartnerProtocolExerciseLevel[];
const objectives = Object.keys(objectiveLabels) as PartnerProtocolExerciseObjective[];
const suggestedUses = ["pre_treino", "pos_treino", "lanche", "refeicao_principal", "ceia", "outro"] as const;
const secondaryMuscleGroupOptions = ["peito", "costas", "pernas", "ombros", "biceps", "triceps", "core", "gluteos"] as const;
type SuggestedUse = (typeof suggestedUses)[number];
type EditorKind = "exercise" | "food";

type FoodDraft = {
  carbs: number; category: PartnerProtocolFoodCategory; fat: number; fiber: number; householdMeasure: string; kcal: number; name: string;
  notes: string; protein: number; servingSize: number; servingUnit: string; sodium: number; source: PartnerProtocolFoodSource;
  status: PartnerProtocolStatus; suggestedUses: SuggestedUse[]; tags: string;
};
type ExerciseDraft = {
  cadence: string; defaultReps: string; defaultSets: number; equipment: PartnerProtocolExerciseEquipment; instructions: string; level: PartnerProtocolExerciseLevel;
  muscleGroup: PartnerProtocolExerciseMuscleGroup; name: string; objective: PartnerProtocolExerciseObjective; restSeconds: number;
  secondaryMuscleGroups: string; status: PartnerProtocolStatus; tags: string; thumbnailUrl: string; variations: string; videoUrl: string;
};

function foodDraft(food: PartnerProtocolFood): FoodDraft {
  return {
    carbs: food.carbs, category: food.category, fat: food.fat, fiber: food.fiber, householdMeasure: food.householdMeasure ?? "", kcal: food.kcal,
    name: food.name, notes: food.notes ?? "", protein: food.protein, servingSize: food.servingSize, servingUnit: food.servingUnit,
    sodium: food.sodium, source: food.source, status: food.status, suggestedUses: food.suggestedUses.filter((value): value is SuggestedUse => suggestedUses.includes(value as SuggestedUse)), tags: food.tags.join(", "),
  };
}

function exerciseDraft(exercise: PartnerProtocolExercise): ExerciseDraft {
  return {
    cadence: exercise.cadence ?? "", defaultReps: exercise.defaultReps, defaultSets: exercise.defaultSets, equipment: exercise.equipment,
    instructions: exercise.instructions ?? "", level: exercise.level, muscleGroup: exercise.muscleGroup, name: exercise.name, objective: exercise.objective,
    restSeconds: exercise.restSeconds, secondaryMuscleGroups: (exercise.secondaryMuscleGroups ?? []).map((group) => muscleGroupLabels[group]).join(", "),
    status: exercise.status, tags: exercise.tags.join(", "), thumbnailUrl: exercise.thumbnailUrl ?? "", variations: exercise.variations.join(", "), videoUrl: exercise.videoUrl ?? "",
  };
}

function parseList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

const fieldClass = "mt-1 h-9 w-full rounded-[7px] border border-[#2b3b49] bg-[#091722] px-2 text-[12px] text-white outline-none focus:border-[#3b97e3]";
const labelClass = "grid gap-1 text-[12px] text-[#b9c6d1]";

export function ProtocolLibraryEditorSheet({ itemId, kind, open, onOpenChange }: {
  itemId: string | null;
  kind: EditorKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [loading, startLoading] = useTransition();
  const [saving, startSaving] = useTransition();
  const [food, setFood] = useState<FoodDraft | null>(null);
  const [exercise, setExercise] = useState<ExerciseDraft | null>(null);

  useEffect(() => {
    if (!open || !itemId) return;
    setFood(null);
    setExercise(null);
    startLoading(async () => {
      const result = kind === "food" ? await getPartnerProtocolFoodForEdit(itemId) : await getPartnerProtocolExerciseForEdit(itemId);
      if (!result.ok || !result.item) {
        toast.error(result.error ?? "Não foi possível carregar este item.");
        onOpenChange(false);
        return;
      }
      if (kind === "food") setFood(foodDraft(result.item as PartnerProtocolFood));
      else setExercise(exerciseDraft(result.item as PartnerProtocolExercise));
    });
  }, [itemId, kind, onOpenChange, open]);

  function saveFood() {
    if (!food || !itemId) return;
    startSaving(async () => {
      const result = await updatePartnerProtocolFood({
        ...food,
        foodId: itemId,
        householdMeasure: food.householdMeasure || null,
        notes: food.notes || null,
        tags: parseList(food.tags),
      });
      if (!result.ok) {
        toast.error(result.error ?? "Não foi possível salvar o alimento.");
        return;
      }
      toast.success(result.message ?? "Alimento atualizado.");
      onOpenChange(false);
      router.refresh();
    });
  }

  function saveExercise() {
    if (!exercise || !itemId) return;
    const groupByLabel = new Map(Object.entries(muscleGroupLabels).map(([key, value]) => [value.toLowerCase(), key]));
    const secondaryMuscleGroups = parseList(exercise.secondaryMuscleGroups)
      .map((value) => groupByLabel.get(value.toLowerCase()) ?? value.toLowerCase())
      .filter((value): value is (typeof secondaryMuscleGroupOptions)[number] => secondaryMuscleGroupOptions.includes(value as (typeof secondaryMuscleGroupOptions)[number]));
    startSaving(async () => {
      const result = await updatePartnerProtocolExercise({
        ...exercise,
        exerciseId: itemId,
        cadence: exercise.cadence || null,
        instructions: exercise.instructions || null,
        secondaryMuscleGroups,
        tags: parseList(exercise.tags),
        thumbnailUrl: exercise.thumbnailUrl || null,
        variations: parseList(exercise.variations),
        videoUrl: exercise.videoUrl || null,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Não foi possível salvar o exercício.");
        return;
      }
      toast.success(result.message ?? "Exercício atualizado.");
      onOpenChange(false);
      router.refresh();
    });
  }

  const updateFood = <K extends keyof FoodDraft>(key: K, value: FoodDraft[K]) => setFood((current) => current ? { ...current, [key]: value } : current);
  const updateExercise = <K extends keyof ExerciseDraft>(key: K, value: ExerciseDraft[K]) => setExercise((current) => current ? { ...current, [key]: value } : current);
  const isBusy = loading || saving;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-[#293b49] bg-[#0c1823] text-[#edf4f8] sm:max-w-[560px]">
        <SheetHeader>
          <SheetTitle className="text-white">Editar {kind === "food" ? "alimento" : "exercício"}</SheetTitle>
          <SheetDescription className="text-[#92a1ad]">As alterações serão usadas nas próximas prescrições; registros já incluídos no plano permanecem preservados.</SheetDescription>
        </SheetHeader>
        {isBusy && !(food || exercise) ? <div className="grid min-h-48 place-items-center"><Loader2 className="size-5 animate-spin text-[#8fcfff]" /></div> : null}
        {kind === "food" && food ? <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); saveFood(); }}>
          <label className={labelClass}>Nome do alimento<input className={fieldClass} required value={food.name} onChange={(event) => updateFood("name", event.target.value)} /></label>
          <div className="grid grid-cols-2 gap-3"><label className={labelClass}>Categoria<select className={fieldClass} value={food.category} onChange={(event) => updateFood("category", event.target.value as PartnerProtocolFoodCategory)}>{foodCategories.map((item) => <option key={item} value={item}>{foodCategoryLabels[item]}</option>)}</select></label><label className={labelClass}>Origem<select className={fieldClass} value={food.source} onChange={(event) => updateFood("source", event.target.value as PartnerProtocolFoodSource)}>{foodSources.map((item) => <option key={item} value={item}>{foodSourceLabels[item]}</option>)}</select></label></div>
          <div className="grid grid-cols-3 gap-3"><Numeric label="Porção padrão" value={food.servingSize} onChange={(value) => updateFood("servingSize", value)} /><label className={labelClass}>Unidade<input className={fieldClass} required value={food.servingUnit} onChange={(event) => updateFood("servingUnit", event.target.value)} /></label><label className={labelClass}>Medida caseira<input className={fieldClass} value={food.householdMeasure} onChange={(event) => updateFood("householdMeasure", event.target.value)} /></label></div>
          <div className="grid grid-cols-3 gap-3"><Numeric label="Kcal" value={food.kcal} onChange={(value) => updateFood("kcal", value)} /><Numeric label="Carboidratos" value={food.carbs} onChange={(value) => updateFood("carbs", value)} /><Numeric label="Proteínas" value={food.protein} onChange={(value) => updateFood("protein", value)} /><Numeric label="Gorduras" value={food.fat} onChange={(value) => updateFood("fat", value)} /><Numeric label="Fibras" value={food.fiber} onChange={(value) => updateFood("fiber", value)} /><Numeric label="Sódio" value={food.sodium} onChange={(value) => updateFood("sodium", value)} /></div>
          <label className={labelClass}>Observações<textarea className={`${fieldClass} h-24 py-2`} value={food.notes} onChange={(event) => updateFood("notes", event.target.value)} /></label>
          <label className={labelClass}>Tags<input className={fieldClass} value={food.tags} onChange={(event) => updateFood("tags", event.target.value)} /></label>
          <div><p className="text-[12px] text-[#b9c6d1]">Usos sugeridos</p><div className="mt-2 grid grid-cols-2 gap-2">{suggestedUses.map((use) => <label className="flex items-center gap-2 text-[12px] text-[#c8d4df]" key={use}><input checked={food.suggestedUses.includes(use)} type="checkbox" onChange={(event) => updateFood("suggestedUses", event.target.checked ? [...food.suggestedUses, use] : food.suggestedUses.filter((item) => item !== use))} />{use.replaceAll("_", " ")}</label>)}</div></div>
          <StatusField value={food.status} onChange={(value) => updateFood("status", value)} />
          <SaveButton busy={isBusy} />
        </form> : null}
        {kind === "exercise" && exercise ? <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); saveExercise(); }}>
          <label className={labelClass}>Nome do exercício<input className={fieldClass} required value={exercise.name} onChange={(event) => updateExercise("name", event.target.value)} /></label>
          <div className="grid grid-cols-2 gap-3"><EnumSelect label="Grupo muscular" options={muscleGroups} labels={muscleGroupLabels} value={exercise.muscleGroup} onChange={(value) => updateExercise("muscleGroup", value as PartnerProtocolExerciseMuscleGroup)} /><EnumSelect label="Equipamento" options={equipments} labels={equipmentLabels} value={exercise.equipment} onChange={(value) => updateExercise("equipment", value as PartnerProtocolExerciseEquipment)} /><EnumSelect label="Nível" options={levels} labels={levelLabels} value={exercise.level} onChange={(value) => updateExercise("level", value as PartnerProtocolExerciseLevel)} /><EnumSelect label="Objetivo" options={objectives} labels={objectiveLabels} value={exercise.objective} onChange={(value) => updateExercise("objective", value as PartnerProtocolExerciseObjective)} /></div>
          <label className={labelClass}>Grupos musculares secundários<input className={fieldClass} placeholder="Tríceps, Ombros" value={exercise.secondaryMuscleGroups} onChange={(event) => updateExercise("secondaryMuscleGroups", event.target.value)} /></label>
          <div className="grid grid-cols-4 gap-3"><Numeric label="Séries" value={exercise.defaultSets} onChange={(value) => updateExercise("defaultSets", value)} /><label className={labelClass}>Repetições<input className={fieldClass} required value={exercise.defaultReps} onChange={(event) => updateExercise("defaultReps", event.target.value)} /></label><Numeric label="Descanso" value={exercise.restSeconds} onChange={(value) => updateExercise("restSeconds", value)} /><label className={labelClass}>Cadência<input className={fieldClass} value={exercise.cadence} onChange={(event) => updateExercise("cadence", event.target.value)} /></label></div>
          <label className={labelClass}>Link do vídeo<input className={fieldClass} value={exercise.videoUrl} onChange={(event) => updateExercise("videoUrl", event.target.value)} /></label>
          <label className={labelClass}>Imagem / thumbnail<input className={fieldClass} value={exercise.thumbnailUrl} onChange={(event) => updateExercise("thumbnailUrl", event.target.value)} /></label>
          <label className={labelClass}>Orientações técnicas<textarea className={`${fieldClass} h-24 py-2`} value={exercise.instructions} onChange={(event) => updateExercise("instructions", event.target.value)} /></label>
          <label className={labelClass}>Tags<input className={fieldClass} value={exercise.tags} onChange={(event) => updateExercise("tags", event.target.value)} /></label>
          <label className={labelClass}>Variações relacionadas<input className={fieldClass} value={exercise.variations} onChange={(event) => updateExercise("variations", event.target.value)} /></label>
          <StatusField value={exercise.status} onChange={(value) => updateExercise("status", value)} />
          <SaveButton busy={isBusy} />
        </form> : null}
      </SheetContent>
    </Sheet>
  );
}

function Numeric({ label, onChange, value }: { label: string; onChange: (value: number) => void; value: number }) {
  return <label className={labelClass}>{label}<input className={fieldClass} inputMode="decimal" min="0" type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function EnumSelect({ label, labels, onChange, options, value }: { label: string; labels: Record<string, string>; onChange: (value: string) => void; options: readonly string[]; value: string }) {
  return <label className={labelClass}>{label}<select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>{options.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></label>;
}

function StatusField({ onChange, value }: { onChange: (value: PartnerProtocolStatus) => void; value: PartnerProtocolStatus }) {
  return <label className={labelClass}>Status<select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value as PartnerProtocolStatus)}><option value="active">Ativo</option><option value="archived">Arquivado</option></select></label>;
}

function SaveButton({ busy }: { busy: boolean }) {
  return <div className="flex justify-end border-t border-[#273847] pt-4"><button className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#3b97e3] px-4 text-[13px] font-semibold text-white disabled:opacity-60" disabled={busy} type="submit">{busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Salvar alterações</button></div>;
}
