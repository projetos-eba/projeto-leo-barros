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
  "full-front": {
    base: { asset: asset("base/full-front.png"), height: 967, left: 0, top: 0, width: 597 },
    height: 967,
    label: "vista frontal completa",
    width: 597,
  },
  "full-back": {
    base: { asset: asset("base/full-back.png"), height: 967, left: 0, top: 0, width: 597 },
    height: 967,
    label: "vista posterior completa",
    width: 597,
  },
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
    "full-front": layers("biceps", [{ asset: asset("muscles/front/biceps.png"), height: 135, id: "full-front-biceps", left: 118, top: 252, width: 368 }]),
    "upper-front": layers("biceps", [{ asset: asset("muscles/front/biceps.png"), height: 135, id: "front-biceps", left: 112, top: 252, width: 348 }]),
  },
  core: {
    "full-front": layers("core", [{ asset: asset("muscles/front/abdominal.png"), height: 237, id: "full-front-abdominal", left: 215, top: 281, width: 204 }]),
    "upper-front": layers("core", [{ asset: asset("muscles/front/abdominal.png"), height: 259, id: "front-abdominal", left: 203, top: 281, width: 193 }]),
  },
  costas: {
    "full-back": layers("costas", [{ asset: asset("muscles/back/costas.png"), height: 339, id: "full-back-corners", left: 137, top: 127, width: 320 }]),
    "upper-back": layers("costas", [{ asset: asset("muscles/back/costas.png"), height: 372, id: "back-corners", left: 159, top: 140, width: 372 }]),
  },
  gluteos: {
    "full-back": layers("gluteos", [{ asset: asset("muscles/back/gluteos.png"), height: 220, id: "full-back-glutes", left: 176, top: 398, width: 245 }]),
    "lower-back": layers("gluteos", [{ asset: asset("muscles/back/gluteos.png"), height: 221, id: "back-glutes", left: 103, top: 4, width: 221 }]),
  },
  ombros: {
    "full-back": layers("ombros", [{ asset: asset("muscles/back/ombros.png"), height: 118, id: "full-back-shoulders", left: 137, top: 170, width: 323 }]),
    "full-front": layers("ombros", [{ asset: asset("muscles/front/ombros.png"), height: 140, id: "full-front-shoulders", left: 125, top: 147, width: 384 }]),
    "upper-back": layers("ombros", [{ asset: asset("muscles/back/ombros.png"), height: 130, id: "back-shoulders", left: 159, top: 187, width: 375 }]),
    "upper-front": layers("ombros", [{ asset: asset("muscles/front/ombros.png"), height: 140, id: "front-shoulders", left: 118, top: 147, width: 363 }]),
  },
  peito: {
    "full-front": layers("peito", [{ asset: asset("muscles/front/peito.png"), height: 125, id: "full-front-chest", left: 170, top: 180, width: 257 }]),
    "upper-front": layers("peito", [{ asset: asset("muscles/front/peito.png"), height: 125, id: "front-chest", left: 161, top: 180, width: 243 }]),
  },
  pernas: {
    "full-back": layers("pernas", [
      { asset: asset("muscles/lower/posteriores-back.png"), height: 218, id: "full-back-thighs", left: 158, top: 522, width: 280 },
      { asset: asset("muscles/lower/panturrilha-back.png"), clipPath: "inset(0 50% 0 0)", height: 215, id: "full-back-left-calf", left: 86, top: 680, transform: "rotate(8deg)", transformOrigin: "25% 50%", width: 425 },
      { asset: asset("muscles/lower/panturrilha-back.png"), clipPath: "inset(0 0 0 50%)", height: 215, id: "full-back-right-calf", left: 86, top: 680, transform: "rotate(-8deg)", transformOrigin: "75% 50%", width: 425 },
    ]),
    "full-front": layers("pernas", [
      { asset: asset("muscles/lower/posteriores-front.png"), height: 250, id: "full-front-thighs", left: 149, top: 460, width: 300 },
      { asset: asset("muscles/lower/panturrilha-front.png"), clipPath: "inset(0 50% 0 0)", height: 210, id: "full-front-left-calf", left: 170, top: 680, transform: "rotate(-6deg)", transformOrigin: "25% 50%", width: 258 },
      { asset: asset("muscles/lower/panturrilha-front.png"), clipPath: "inset(0 0 0 50%)", height: 210, id: "full-front-right-calf", left: 170, top: 680, transform: "rotate(6deg)", transformOrigin: "75% 50%", width: 258 },
    ]),
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
    "full-back": layers("triceps", [{ asset: asset("muscles/back/triceps.png"), height: 157, id: "full-back-triceps", left: 119, top: 228, width: 357 }]),
    "upper-back": layers("triceps", [{ asset: asset("muscles/back/triceps.png"), height: 172, id: "back-triceps", left: 138, top: 250, width: 415 }]),
  },
};
