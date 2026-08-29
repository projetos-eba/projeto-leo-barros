import type { PartnerClientWorkoutExercise } from "@/lib/partners/client-workout-metrics";
import { workoutMuscleHeat } from "@/lib/partners/client-workout-metrics";
import {
  deriveWorkoutMusclePreview,
  musclePreviewViews,
  type MusclePreviewView,
} from "@/lib/workouts/muscle-visualization";
import { cn } from "@/lib/utils";

const groupLabels: Record<string, string> = {
  biceps: "Bíceps",
  core: "Abdômen",
  costas: "Costas",
  gluteos: "Glúteos",
  ombros: "Ombros",
  peito: "Peito",
  pernas: "Pernas",
  triceps: "Tríceps",
};

function percent(value: number, total: number) {
  return `${(value / total) * 100}%`;
}

function ariaLabel(view: MusclePreviewView, groups: string[]) {
  const names = groups.map((group) => groupLabels[group] ?? group).join(", ");
  return `Representação muscular: ${musclePreviewViews[view].label}. ${names}.`;
}

export function WorkoutMusclePreview({
  className,
  exercises,
  mode = "compact",
}: {
  className?: string;
  exercises: PartnerClientWorkoutExercise[];
  mode?: "compact" | "summary";
}) {
  const model = deriveWorkoutMusclePreview(workoutMuscleHeat(exercises), {
    primaryGroups: exercises.map((exercise) => exercise.muscleGroup),
  });

  if (!model.view) {
    return (
      <div
        aria-label="Representação muscular indisponível para os exercícios selecionados"
        className={cn("grid place-items-center text-center text-[10px] text-[#718394]", mode === "compact" ? "h-[112px] w-[92px]" : "h-[180px] w-full", className)}
        data-workout-muscle-preview
        data-view="none"
        role="img"
      >
        Sem músculos mapeados
      </div>
    );
  }

  const view = musclePreviewViews[model.view];
  return (
    <div
      aria-label={ariaLabel(model.view, model.groups)}
      className={cn("relative isolate block shrink-0", mode === "compact" ? "h-[112px]" : "h-[218px]", className)}
      data-workout-muscle-preview
      data-view={model.view}
      role="img"
      style={{ aspectRatio: `${view.width} / ${view.height}` }}
    >
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute select-none"
        draggable={false}
        height={view.base.height}
        src={view.base.asset}
        style={{
          height: percent(view.base.height, view.height),
          left: percent(view.base.left, view.width),
          top: percent(view.base.top, view.height),
          width: percent(view.base.width, view.width),
        }}
        width={view.base.width}
      />
      {model.layers.map((layer) => (
        <img
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute select-none transition-opacity duration-200"
          data-layer={layer.id}
          draggable={false}
          height={layer.height}
          key={layer.id}
          src={layer.asset}
          style={{
            height: percent(layer.height, view.height),
            left: percent(layer.left, view.width),
            opacity: layer.opacity,
            top: percent(layer.top, view.height),
            width: percent(layer.width, view.width),
          }}
          width={layer.width}
        />
      ))}
    </div>
  );
}
