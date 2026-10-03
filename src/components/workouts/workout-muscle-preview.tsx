import type { PartnerClientWorkoutExercise } from "@/lib/partners/client-workout-metrics";
import { workoutMuscleHeat } from "@/lib/partners/client-workout-metrics";
import {
  deriveWorkoutMusclePreview,
  deriveWorkoutMusclePreviewForView,
  musclePreviewViews,
  type MusclePreviewLayer,
  type MusclePreviewView,
} from "@/lib/workouts/muscle-visualization";
import { cn } from "@/lib/utils";

const groupLabels: Record<string, string> = {
  biceps: "Bíceps", core: "Abdômen", costas: "Costas", gluteos: "Glúteos", ombros: "Ombros", peito: "Peito", pernas: "Pernas", triceps: "Tríceps",
};

function percent(value: number, total: number) {
  return `${(value / total) * 100}%`;
}

function ariaLabel(view: MusclePreviewView, groups: string[]) {
  return `Representação muscular: ${musclePreviewViews[view].label}. ${groups.map((group) => groupLabels[group] ?? group).join(", ")}.`;
}

function AnatomyLayer({ layer, view }: { layer: MusclePreviewLayer; view: MusclePreviewView }) {
  const definition = musclePreviewViews[view];
  return <img alt="" aria-hidden="true" className="pointer-events-none absolute select-none transition-opacity duration-200" data-layer={layer.id} draggable={false} height={layer.height} src={layer.asset} style={{ clipPath: layer.clipPath, height: percent(layer.height, definition.height), left: percent(layer.left, definition.width), opacity: layer.opacity, top: percent(layer.top, definition.height), transform: layer.transform, transformOrigin: layer.transformOrigin, width: percent(layer.width, definition.width) }} width={layer.width} />;
}

function FullBodyPose({ heat, side }: { heat: ReturnType<typeof workoutMuscleHeat>; side: "back" | "front" }) {
  const view = side === "front" ? "full-front" : "full-back";
  const model = deriveWorkoutMusclePreviewForView(heat, view);
  const definition = musclePreviewViews[view];

  return (
    <div aria-label={`Representação muscular: vista ${side === "front" ? "frontal" : "posterior"}. ${model.groups.map((group) => groupLabels[group] ?? group).join(", ") || "Sem músculos mapeados"}.`} className="relative h-full shrink-0" data-pose-canvas={side} data-workout-muscle-pose={side} role="img" style={{ aspectRatio: `${definition.width} / ${definition.height}` }}>
      <img alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full select-none" draggable={false} src={definition.base.asset} />
      {model.layers.map((layer) => <AnatomyLayer key={layer.id} layer={layer} view={view} />)}
    </div>
  );
}

export function WorkoutMusclePreview({ className, exercises, mode = "compact" }: {
  className?: string;
  exercises: PartnerClientWorkoutExercise[];
  mode?: "compact" | "summary";
}) {
  const heat = workoutMuscleHeat(exercises);
  const model = deriveWorkoutMusclePreview(heat, { primaryGroups: exercises.map((exercise) => exercise.muscleGroup) });

  if (mode === "summary" && heat.length) {
    const hasMappedGroup = ["full-front", "full-back"].some((view) => deriveWorkoutMusclePreviewForView(heat, view as MusclePreviewView).groups.length > 0);
    if (hasMappedGroup) return <div className={cn("flex h-[245px] items-start justify-center gap-3 sm:h-[270px]", className)} data-workout-muscle-preview data-view="front-back"><FullBodyPose heat={heat} side="front" /><FullBodyPose heat={heat} side="back" /></div>;
  }

  if (!model.view) return <div aria-label="Representação muscular indisponível para os exercícios selecionados" className={cn("grid place-items-center text-center text-[10px] text-[#718394]", mode === "compact" ? "h-[112px] w-[92px]" : "h-[270px] w-full", className)} data-workout-muscle-preview data-view="none" role="img">Sem músculos mapeados</div>;

  const view = musclePreviewViews[model.view];
  return (
    <div aria-label={ariaLabel(model.view, model.groups)} className={cn("relative isolate block shrink-0", mode === "compact" ? "h-[112px]" : "h-[218px]", className)} data-workout-muscle-preview data-view={model.view} role="img" style={{ aspectRatio: `${view.width} / ${view.height}` }}>
      <img alt="" aria-hidden="true" className="pointer-events-none absolute select-none" draggable={false} height={view.base.height} src={view.base.asset} style={{ height: percent(view.base.height, view.height), left: percent(view.base.left, view.width), top: percent(view.base.top, view.height), width: percent(view.base.width, view.width) }} width={view.base.width} />
      {model.layers.map((layer) => <AnatomyLayer key={layer.id} layer={layer} view={model.view!} />)}
    </div>
  );
}
