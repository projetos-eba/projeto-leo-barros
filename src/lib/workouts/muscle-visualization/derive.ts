import { muscleAssetRegistry } from "./asset-registry";
import { normalizeMuscleGroup } from "./normalization";
import type {
  MappableMuscleGroup,
  MuscleHeatInput,
  MusclePreviewLayer,
  MusclePreviewView,
  WorkoutMusclePreviewModel,
} from "./types";

const viewPriority: MusclePreviewView[] = ["upper-front", "upper-back", "lower-front", "lower-back"];
const primaryViewWeight = 3;

function opacityForLevel(level: 1 | 2 | 3) {
  return level === 3 ? 1 : level === 2 ? 0.78 : 0.58;
}

function isMappable(group: ReturnType<typeof normalizeMuscleGroup>): group is MappableMuscleGroup {
  return Boolean(group && muscleAssetRegistry[group as MappableMuscleGroup]);
}

export function deriveWorkoutMusclePreview(
  heat: MuscleHeatInput[],
  options: { primaryGroups?: string[] } = {},
): WorkoutMusclePreviewModel {
  const byGroup = new Map<MappableMuscleGroup, MuscleHeatInput>();

  heat.forEach((item) => {
    const group = normalizeMuscleGroup(item.group);
    if (!isMappable(group) || byGroup.has(group)) return;
    byGroup.set(group, item);
  });

  const viewScores = new Map<MusclePreviewView, number>();
  byGroup.forEach((item, group) => {
    Object.keys(muscleAssetRegistry[group] ?? {}).forEach((view) => {
      const typedView = view as MusclePreviewView;
      viewScores.set(typedView, (viewScores.get(typedView) ?? 0) + item.score);
    });
  });

  // Heat keeps its established primary/secondary parity. View selection gives
  // the prescribed primary muscle extra weight, so a back exercise with arm or
  // core stabilizers still presents its posterior anatomy.
  const primaryViewScores = new Map<MusclePreviewView, number>();
  options.primaryGroups?.forEach((value) => {
    const group = normalizeMuscleGroup(value);
    if (!isMappable(group)) return;
    Object.keys(muscleAssetRegistry[group] ?? {}).forEach((view) => {
      const typedView = view as MusclePreviewView;
      primaryViewScores.set(typedView, (primaryViewScores.get(typedView) ?? 0) + 1);
    });
  });

  const view = viewPriority.reduce<MusclePreviewView | null>((winner, candidate) => {
    if (!winner) return (viewScores.get(candidate) ?? 0) > 0 ? candidate : null;
    const candidateScore = (viewScores.get(candidate) ?? 0) + (primaryViewScores.get(candidate) ?? 0) * primaryViewWeight;
    const winnerScore = (viewScores.get(winner) ?? 0) + (primaryViewScores.get(winner) ?? 0) * primaryViewWeight;
    if (candidateScore !== winnerScore) return candidateScore > winnerScore ? candidate : winner;
    return winner;
  }, null);

  if (!view) return { groups: [], layers: [], view: null };

  const layers = new Map<string, MusclePreviewLayer>();
  const groups: MappableMuscleGroup[] = [];
  byGroup.forEach((item, group) => {
    const mappedLayers = muscleAssetRegistry[group]?.[view] ?? [];
    if (mappedLayers.length === 0) return;
    groups.push(group);
    mappedLayers.forEach((layer) => {
      if (!layers.has(layer.id)) {
        layers.set(layer.id, { ...layer, level: item.level, opacity: opacityForLevel(item.level), score: item.score });
      }
    });
  });

  return { groups, layers: Array.from(layers.values()), view };
}
