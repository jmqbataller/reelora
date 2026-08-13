import type { EditingStyle, ShotDistribution, TransitionMode } from "./types.js";

export interface EditingDna {
  averageShotLength: number;
  openingShotLength: number;
  transitionFrequency: number;
  transitionMode: TransitionMode;
  motionIntensity: number;
  closeUpShare: number;
  wholeBodyShare: number;
  detailShare: number;
  style: EditingStyle;
}

export interface ReferenceReelObservation {
  duration: number;
  cutTimes: number[];
  wholeBodyShare?: number;
  closeUpShare?: number;
  detailShare?: number;
  transitionFrequency?: number;
  motionIntensity?: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function deriveEditingDna(observation: ReferenceReelObservation, fallbackStyle: EditingStyle = "premium"): EditingDna {
  const cuts = [...observation.cutTimes].filter((value) => value > 0 && value < observation.duration).sort((a, b) => a - b);
  const boundaries = [0, ...cuts, observation.duration];
  const durations = boundaries.slice(1).map((end, index) => Math.max(0.05, end - boundaries[index]));
  const averageShotLength = durations.reduce((sum, value) => sum + value, 0) / Math.max(1, durations.length);
  const openingShotLength = durations[0] ?? Math.min(1.5, observation.duration);
  const closeUpShare = clamp01(observation.closeUpShare ?? 0.6);
  const wholeBodyShare = clamp01(observation.wholeBodyShare ?? 0.25);
  const detailShare = clamp01(observation.detailShare ?? Math.max(0, 1 - closeUpShare - wholeBodyShare));
  const total = Math.max(0.001, closeUpShare + wholeBodyShare + detailShare);
  return {
    averageShotLength,
    openingShotLength,
    transitionFrequency: clamp01(observation.transitionFrequency ?? 0.35),
    transitionMode: (observation.transitionFrequency ?? 0.35) > 0.55 ? "motion" : "auto",
    motionIntensity: clamp01(observation.motionIntensity ?? 0.5),
    closeUpShare: closeUpShare / total,
    wholeBodyShare: wholeBodyShare / total,
    detailShare: detailShare / total,
    style: fallbackStyle,
  };
}

export function editingDnaDistribution(dna: EditingDna): ShotDistribution {
  return { focus: dna.closeUpShare, wholeBody: dna.wholeBodyShare, detail: dna.detailShare };
}

export const REFERENCE_STYLE_RULES = {
  copyOnlyStructure: true,
  neverCopyLogos: true,
  neverCopyText: true,
  neverCopyMusic: true,
  neverCopyBrandAssets: true,
  neverGenerateMissingVisuals: true,
};
