import type { HighlightIntent, ReeloraAdvancedOptions, ShotDistribution } from "./types.js";

export const REELORA_FEATURES = [
  "vision-director",
  "smart-subject-tracking",
  "garment-visibility-score",
  "best-moment-detector",
  "duplicate-shot-detector",
  "pose-variety-engine",
  "product-region-presets",
  "custom-percentage-control",
  "auto-duration",
  "hook-generator",
  "retention-editing",
  "dynamic-zoom-director",
  "motion-match-cuts",
  "camera-motion-detection",
  "smart-transition-selection",
  "beat-sync",
  "music-energy-matching",
  "outro-beat-alignment",
  "audio-ducking",
  "original-audio-preservation",
  "auto-music-trim",
  "product-color-lock",
  "fabric-texture-guard",
  "logo-print-lock",
  "face-integrity-guard",
  "hand-integrity-guard",
  "crop-safety-zones",
  "auto-orientation-fix",
  "mixed-resolution-support",
  "frame-rate-normalization",
  "high-fps-slow-motion",
  "shaky-clip-rescue",
  "blur-filter",
  "occlusion-filter",
  "bad-pose-filter",
  "safe-frame-selector",
  "front-back-balance",
  "variant-balance",
  "single-model-consistency",
  "reference-face-lock",
  "reference-product-lock",
  "brand-style-profile",
  "platform-presets",
  "safe-zone-preview",
  "multiple-output-variants",
  "ab-reel-generator",
  "auto-thumbnail-selector",
  "cover-crop-generator",
  "quality-score-report",
  "edit-decision-report",
  "before-after-preservation-check",
  "auto-reedit-on-validation-failure",
  "fail-safe-preservation",
  "no-generative-mode-lock",
  "batch-reel-mode",
  "folder-convention-support",
  "job-progress",
  "resume-safe-workflow",
  "preset-save-load",
  "edit-json-export",
  "re-edit-from-plan",
  "ffmpeg-command-audit",
  "local-processing",
  "hardware-acceleration",
  "proxy-analysis",
  "4k-input-support",
  "loss-minimized-export",
  "file-size-targeting",
  "versioned-output-names",
  "natural-language-rule-parser",
  "conflict-resolution",
  "persistent-brand-preferences",
  "confidence-score",
] as const;

export type ReeloraFeature = (typeof REELORA_FEATURES)[number];

export function defaultDistribution(highlight: HighlightIntent): ShotDistribution {
  if (highlight === "top_wear") return { focus: 0.7, wholeBody: 0.2, detail: 0.1 };
  if (highlight === "fit" || highlight === "front_back") return { focus: 0.5, wholeBody: 0.4, detail: 0.1 };
  if (highlight === "fabric" || highlight === "print" || highlight === "logo" || highlight === "neckline" || highlight === "sleeves") {
    return { focus: 0.55, wholeBody: 0.15, detail: 0.3 };
  }
  return { focus: 0.6, wholeBody: 0.25, detail: 0.15 };
}

export function normalizeDistribution(input: ShotDistribution): ShotDistribution {
  const values = [input.focus, input.wholeBody, input.detail];
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error("Shot distribution values must be non-negative numbers.");
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) throw new Error("Shot distribution cannot total zero.");
  return {
    focus: input.focus / total,
    wholeBody: input.wholeBody / total,
    detail: input.detail / total,
  };
}

export function defaultAdvancedOptions(highlight: HighlightIntent, overrides: ReeloraAdvancedOptions = {}): ReeloraAdvancedOptions {
  const distribution = normalizeDistribution(overrides.distribution ?? defaultDistribution(highlight));
  return {
    style: overrides.style ?? "premium",
    platform: overrides.platform ?? "instagram_reels",
    distribution,
    autoDuration: overrides.autoDuration ?? true,
    retentionEditing: overrides.retentionEditing ?? true,
    dynamicSubjectTracking: overrides.dynamicSubjectTracking ?? true,
    beatSync: overrides.beatSync ?? true,
    musicEnergyMatching: overrides.musicEnergyMatching ?? true,
    outroBeatAlignment: overrides.outroBeatAlignment ?? true,
    audioDucking: overrides.audioDucking ?? true,
    preserveOriginalAudio: overrides.preserveOriginalAudio ?? false,
    duplicateShotDetection: overrides.duplicateShotDetection ?? true,
    poseVariety: overrides.poseVariety ?? true,
    smartTransitions: overrides.smartTransitions ?? true,
    productColorLock: overrides.productColorLock ?? true,
    fabricTextureGuard: overrides.fabricTextureGuard ?? true,
    logoPrintLock: overrides.logoPrintLock ?? true,
    faceIntegrityGuard: overrides.faceIntegrityGuard ?? true,
    handIntegrityGuard: overrides.handIntegrityGuard ?? true,
    cropSafetyZones: overrides.cropSafetyZones ?? true,
    autoOrientation: overrides.autoOrientation ?? true,
    frameRateNormalization: overrides.frameRateNormalization ?? true,
    slowMotionFromHighFps: overrides.slowMotionFromHighFps ?? true,
    stabilization: overrides.stabilization ?? true,
    blurFilter: overrides.blurFilter ?? true,
    occlusionFilter: overrides.occlusionFilter ?? true,
    badPoseFilter: overrides.badPoseFilter ?? true,
    variantBalance: overrides.variantBalance ?? true,
    singleModelConsistency: overrides.singleModelConsistency ?? true,
    referenceFace: overrides.referenceFace,
    referenceProduct: overrides.referenceProduct,
    brandProfile: overrides.brandProfile,
    transitionMode: overrides.transitionMode ?? "auto",
    autoThumbnail: overrides.autoThumbnail ?? true,
    coverCrop: overrides.coverCrop ?? true,
    qualityReport: overrides.qualityReport ?? true,
    editDecisionReport: overrides.editDecisionReport ?? true,
    beforeAfterValidation: overrides.beforeAfterValidation ?? true,
    autoReeditOnValidationFailure: overrides.autoReeditOnValidationFailure ?? true,
    noGenerativeMode: true,
    proxyAnalysis: overrides.proxyAnalysis ?? true,
    hardwareEncoder: overrides.hardwareEncoder ?? "auto",
    targetFileSizeMb: overrides.targetFileSizeMb,
    versionOutputs: overrides.versionOutputs ?? true,
    confidenceThreshold: overrides.confidenceThreshold ?? 0.55,
    visionObservations: overrides.visionObservations ?? [],
  };
}

export function assertPreservationMode(options: ReeloraAdvancedOptions): void {
  if (options.noGenerativeMode === false) {
    throw new Error("Reelora preservation mode cannot be disabled by the automatic editor. Generative video replacement is intentionally unsupported.");
  }
}
