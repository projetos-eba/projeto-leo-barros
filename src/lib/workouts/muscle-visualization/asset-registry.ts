import type { MappableMuscleGroup, MuscleAssetLayer, MusclePreviewView } from "./types";

type MusclePreviewBase = {
  asset: string;
  height: number;
  left: number;
  top: number;
  width: number;
};

export type MusclePreviewViewDefinition = {
  base: MusclePreviewBase;
  height: number;
  label: string;
  width: number;
};

const asset = (path: string) => `/workout-body/${path}`;

export const musclePreviewViews: Record<MusclePreviewView, MusclePreviewViewDefinition> = {
  "upper-front": {
    base: { asset: asset("base/upper-front.png"), height: 604, left: 0, top: 0, width: 565 },
    height: 604,
    label: "vista frontal superior",
    width: 565,
  },
  "upper-back": {
    base: { asset: asset("base/upper-back.png"), height: 604, left: 0, top: 0, width: 694 },
    height: 604,
    label: "vista posterior superior",
    width: 694,
  },
  "lower-front": {
    base: { asset: asset("base/lower-front.png"), height: 604, left: 0, top: 0, width: 300 },
    height: 604,
    label: "vista frontal inferior",
    width: 300,
  },
  "lower-back": {
    base: { asset: asset("base/lower-back.png"), height: 604, left: 77, top: 0, width: 273 },
    height: 604,
    label: "vista posterior inferior",
    width: 430,
  },
};

const layers = (group: MappableMuscleGroup, entries: Array<Omit<MuscleAssetLayer, "group">>): MuscleAssetLayer[] =>
  entries.map((entry) => ({ ...entry, group }));

/**
 * Pixel coordinates were transcribed from Figma node 630:2. They use each
 * view's native canvas, rather than CSS offsets scattered across the UI.
 */
export const muscleAssetRegistry: Partial<Record<MappableMuscleGroup, Partial<Record<MusclePreviewView, MuscleAssetLayer[]>>>> = {
  biceps: {
    "upper-front": layers("biceps", [{ asset: asset("muscles/front/biceps.png"), height: 135, id: "front-biceps", left: 112, top: 252, width: 348 }]),
  },
  core: {
    "upper-front": layers("core", [{ asset: asset("muscles/front/abdominal.png"), height: 259, id: "front-abdominal", left: 203, top: 281, width: 193 }]),
  },
  costas: {
    "upper-back": layers("costas", [{ asset: asset("muscles/back/costas.png"), height: 372, id: "back-corners", left: 159, top: 140, width: 372 }]),
  },
  gluteos: {
    "lower-back": layers("gluteos", [{ asset: asset("muscles/back/gluteos.png"), height: 221, id: "back-glutes", left: 103, top: 4, width: 221 }]),
  },
  ombros: {
    "upper-back": layers("ombros", [{ asset: asset("muscles/back/ombros.png"), height: 130, id: "back-shoulders", left: 159, top: 187, width: 375 }]),
    "upper-front": layers("ombros", [{ asset: asset("muscles/front/ombros.png"), height: 140, id: "front-shoulders", left: 118, top: 147, width: 363 }]),
  },
  peito: {
    "upper-front": layers("peito", [{ asset: asset("muscles/front/peito.png"), height: 125, id: "front-chest", left: 161, top: 180, width: 243 }]),
  },
  pernas: {
    "lower-back": layers("pernas", [
      { asset: asset("muscles/lower/posteriores-back.png"), height: 196, id: "back-thighs", left: 85, top: 150, width: 259 },
      { asset: asset("muscles/lower/panturrilha-back.png"), height: 221, id: "back-calves", left: 0, top: 329, width: 430 },
    ]),
    "lower-front": layers("pernas", [
      { asset: asset("muscles/lower/posteriores-front.png"), height: 243, id: "front-thighs", left: 3.386, top: 82.395, width: 282.982 },
      { asset: asset("muscles/lower/panturrilha-front.png"), height: 205, id: "front-calves", left: 28, top: 335, width: 246 },
    ]),
  },
  triceps: {
    "upper-back": layers("triceps", [{ asset: asset("muscles/back/triceps.png"), height: 172, id: "back-triceps", left: 138, top: 250, width: 415 }]),
  },
};
