import type { MuscleHeat, PartnerClientWorkoutExercise } from "@/lib/partners/client-workout-metrics";
import { workoutMuscleHeat, workoutMuscleLabels } from "@/lib/partners/client-workout-metrics";
import { cn } from "@/lib/utils";

const regionGeometry: Record<string, Array<{ cx?: number; cy?: number; h?: number; r?: number; rx?: number; ry?: number; type: "circle" | "ellipse" | "rect"; w?: number; x?: number; y?: number }>> = {
  biceps: [{ type: "ellipse", cx: 38, cy: 70, rx: 7, ry: 17 }, { type: "ellipse", cx: 122, cy: 70, rx: 7, ry: 17 }],
  core: [{ type: "rect", x: 61, y: 72, w: 38, h: 38 }],
  costas: [{ type: "rect", x: 61, y: 40, w: 38, h: 38 }],
  gluteos: [{ type: "ellipse", cx: 70, cy: 112, rx: 11, ry: 8 }, { type: "ellipse", cx: 90, cy: 112, rx: 11, ry: 8 }],
  ombros: [{ type: "circle", cx: 52, cy: 44, r: 9 }, { type: "circle", cx: 108, cy: 44, r: 9 }],
  peito: [{ type: "ellipse", cx: 68, cy: 51, rx: 13, ry: 10 }, { type: "ellipse", cx: 92, cy: 51, rx: 13, ry: 10 }],
  pernas: [{ type: "rect", x: 57, y: 112, w: 18, h: 62 }, { type: "rect", x: 85, y: 112, w: 18, h: 62 }],
  triceps: [{ type: "ellipse", cx: 38, cy: 70, rx: 7, ry: 17 }, { type: "ellipse", cx: 122, cy: 70, rx: 7, ry: 17 }],
};

function BodyFigure({ back, heat }: { back?: boolean; heat: MuscleHeat[] }) {
  const fill = (group: string) => {
    const level = heat.find((item) => item.group === group)?.level ?? 0;
    return level === 3 ? "#0b73c9" : level === 2 ? "#3196e6" : level === 1 ? "#8fcfff" : "#1b303e";
  };
  const visible = back ? ["costas", "ombros", "triceps", "gluteos", "pernas"] : ["peito", "ombros", "biceps", "core", "pernas"];

  return (
    <svg aria-label={back ? "Mapa muscular posterior" : "Mapa muscular anterior"} className="h-[190px] w-[150px]" viewBox="0 0 160 190">
      <circle cx="80" cy="17" fill="#253946" r="13" />
      <rect fill="#253946" height="76" rx="24" width="54" x="53" y="30" />
      <rect fill="#253946" height="68" rx="10" width="16" x="29" y="39" />
      <rect fill="#253946" height="68" rx="10" width="16" x="115" y="39" />
      <rect fill="#253946" height="76" rx="10" width="20" x="55" y="104" />
      <rect fill="#253946" height="76" rx="10" width="20" x="85" y="104" />
      {visible.flatMap((group) => (regionGeometry[group] ?? []).map((shape, index) => {
        const props = { fill: fill(group), opacity: 0.95, stroke: "#07131b", strokeWidth: 1 };
        if (shape.type === "circle") return <circle {...props} cx={shape.cx} cy={shape.cy} key={`${group}-${index}`} r={shape.r} />;
        if (shape.type === "ellipse") return <ellipse {...props} cx={shape.cx} cy={shape.cy} key={`${group}-${index}`} rx={shape.rx} ry={shape.ry} />;
        return <rect {...props} height={shape.h} key={`${group}-${index}`} rx={5} width={shape.w} x={shape.x} y={shape.y} />;
      }))}
    </svg>
  );
}

export function WorkoutMuscleMap({
  className,
  exercises,
  heat,
  title = "Músculos trabalhados",
}: {
  className?: string;
  exercises?: PartnerClientWorkoutExercise[];
  heat?: MuscleHeat[];
  title?: string;
}) {
  const muscleHeat = heat ?? workoutMuscleHeat(exercises ?? []);

  return (
    <section className={cn("rounded-[14px] border border-[#213444] bg-[linear-gradient(146deg,rgba(17,31,43,0.96)_0%,rgba(8,18,27,0.94)_100%)] p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[18px] font-bold text-white">{title}</h3>
          <p className="mt-1 text-[12px] leading-5 text-[#8fa3b4]">Coloração por estímulo prescrito no treino selecionado.</p>
        </div>
        <div className="hidden items-center gap-2 text-[11px] text-[#8fa3b4] sm:flex">
          <span className="size-2 rounded-full bg-[#8fcfff]" />
          Leve
          <span className="size-2 rounded-full bg-[#3196e6]" />
          Médio
          <span className="size-2 rounded-full bg-[#0b73c9]" />
          Alto
        </div>
      </div>
      <div className="mt-4 flex justify-center overflow-hidden rounded-[12px] border border-[#1e3343] bg-[#07141d]/55 py-4">
        <BodyFigure heat={muscleHeat} />
        <BodyFigure back heat={muscleHeat} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {muscleHeat.slice(0, 8).map((item) => (
          <span className="rounded-full border border-[#255a80] bg-[#0a2c48]/45 px-3 py-1 text-[11px] font-semibold text-[#c8d4df]" key={item.group}>
            {workoutMuscleLabels[item.group] ?? item.group} · {item.score}x
          </span>
        ))}
        {muscleHeat.length === 0 ? <span className="text-[12px] text-[#718394]">Sem estímulo muscular registrado.</span> : null}
      </div>
    </section>
  );
}
