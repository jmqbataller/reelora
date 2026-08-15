import type { HighlightIntent, ReeloraAdvancedOptions, ShotDistribution } from "./types.js";
import { REELORA_CAPABILITY_CATALOG } from "./feature-catalog.js";

export const REELORA_FEATURES = [
  ...REELORA_CAPABILITY_CATALOG.map((feature) => feature.id),
  "automatic-premium-music-replacement",
  "verified-music-rights-library",
  "sample-free-reelora-original-beat",
  "style-aware-music-bpm",
  "beat-aware-shot-pacing",
  "music-loudness-normalization",
  "source-audio-replacement",
  "premium-style-aware-transitions",
  "liquid-splash-transition",
  "ink-bloom-transition",
  "prism-refraction-transition",
  "particle-crystallize-transition",
  "light-sweep-transition",
  "glass-ripple-transition",
  "silk-fold-transition",
  "luma-bloom-transition",
  "premium-real-pixel-animation-effects",
  "transition-intensity-control",
  "transition-family-control",
  "luxury-transition-personality",
  "fashion-transition-personality",
  "cinematic-transition-personality",
] as const;
export type ReeloraFeature = string;

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
    bodyShapeIntegrityGuard: overrides.bodyShapeIntegrityGuard ?? true,
    cropSafetyZones: overrides.cropSafetyZones ?? true,
    autoOrientation: overrides.autoOrientation ?? true,
    frameRateNormalization: overrides.frameRateNormalization ?? true,
    slowMotionFromHighFps: overrides.slowMotionFromHighFps ?? true,
    opticalFlowGuard: overrides.opticalFlowGuard ?? true,
    stabilization: overrides.stabilization ?? true,
    rollingShutterGuard: overrides.rollingShutterGuard ?? true,
    exposureFlickerCorrection: overrides.exposureFlickerCorrection ?? false,
    whiteBalanceConsistency: overrides.whiteBalanceConsistency ?? true,
    hdrSdrSafety: overrides.hdrSdrSafety ?? true,
    colorSpaceDetection: overrides.colorSpaceDetection ?? true,
    blurFilter: overrides.blurFilter ?? true,
    occlusionFilter: overrides.occlusionFilter ?? true,
    badPoseFilter: overrides.badPoseFilter ?? true,
    distractionFilter: overrides.distractionFilter ?? true,
    mirrorReflectionGuard: overrides.mirrorReflectionGuard ?? true,
    variantBalance: overrides.variantBalance ?? true,
    singleModelConsistency: overrides.singleModelConsistency ?? true,
    multiProductDetection: overrides.multiProductDetection ?? true,
    skuLock: overrides.skuLock,
    heroVariant: overrides.heroVariant,
    referenceFace: overrides.referenceFace,
    referenceProduct: overrides.referenceProduct,
    referenceReel: overrides.referenceReel,
    brandProfile: overrides.brandProfile,
    transitionMode: overrides.transitionMode ?? "auto",
    premiumTransitionEffects: overrides.premiumTransitionEffects ?? true,
    transitionIntensity: overrides.transitionIntensity ?? "balanced",
    transitionFamilies: overrides.transitionFamilies,
    premiumAnimationEffects: overrides.premiumAnimationEffects ?? true,
    animationIntensity: overrides.animationIntensity ?? "subtle",
    autoThumbnail: overrides.autoThumbnail ?? true,
    coverCrop: overrides.coverCrop ?? true,
    qualityReport: overrides.qualityReport ?? true,
    editDecisionReport: overrides.editDecisionReport ?? true,
    beforeAfterValidation: overrides.beforeAfterValidation ?? true,
    pixelPreservationAudit: overrides.pixelPreservationAudit ?? true,
    generativeDetectionAudit: overrides.generativeDetectionAudit ?? true,
    qualityThreshold: overrides.qualityThreshold ?? 0.75,
    autoReeditOnValidationFailure: overrides.autoReeditOnValidationFailure ?? true,
    autoReeditUntilPass: overrides.autoReeditUntilPass ?? true,
    noGenerativeMode: true,
    proxyAnalysis: overrides.proxyAnalysis ?? true,
    localVision: overrides.localVision ?? false,
    offlineMode: overrides.offlineMode ?? false,
    privacyMode: overrides.privacyMode ?? true,
    autoDeleteRawCache: overrides.autoDeleteRawCache ?? true,
    hardwareEncoder: overrides.hardwareEncoder ?? "auto",
    targetFileSizeMb: overrides.targetFileSizeMb,
    versionOutputs: overrides.versionOutputs ?? true,
    confidenceThreshold: overrides.confidenceThreshold ?? 0.55,
    sixtyFpsOutput: overrides.sixtyFpsOutput ?? false,
    proResMaster: overrides.proResMaster ?? false,
    responsiveExports: overrides.responsiveExports ?? false,
    compressionSimulation: overrides.compressionSimulation ?? false,
    compressionArtifactGuard: overrides.compressionArtifactGuard ?? true,
    texturePreservationScore: overrides.texturePreservationScore ?? true,
    bitrateOptimization: overrides.bitrateOptimization ?? true,
    introVideo: overrides.introVideo,
    alternateOutros: overrides.alternateOutros ?? [],
    preserveOutroDuration: overrides.preserveOutroDuration ?? true,
    watchFolder: overrides.watchFolder,
    queueMode: overrides.queueMode ?? false,
    crashRecovery: overrides.crashRecovery ?? true,
    renderCache: overrides.renderCache ?? true,
    partialRenderCache: overrides.partialRenderCache ?? true,
    diskSpaceGuard: overrides.diskSpaceGuard ?? true,
    corruptVideoDetection: overrides.corruptVideoDetection ?? true,
    codecCompatibilityCheck: overrides.codecCompatibilityCheck ?? true,
    timelineExport: overrides.timelineExport ?? ["json"],
    projectFileMode: overrides.projectFileMode ?? false,
    clientReviewMode: overrides.clientReviewMode ?? false,
    approvalLock: overrides.approvalLock ?? true,
    reviewState: overrides.reviewState ?? "draft",
    seasonPreset: overrides.seasonPreset,
    campaignId: overrides.campaignId,
    campaignConsistency: overrides.campaignConsistency ?? false,
    editingDnaProfile: overrides.editingDnaProfile,
    styleMatchReference: overrides.styleMatchReference ?? false,
    competitorAnalysisMode: overrides.competitorAnalysisMode ?? false,
    naturalSoundHighlighting: overrides.naturalSoundHighlighting ?? false,
    audioCleanup: overrides.audioCleanup ?? false,
    silenceAwareCuts: overrides.silenceAwareCuts ?? true,
    musicDropDetection: overrides.musicDropDetection ?? true,
    musicSectionSelection: overrides.musicSectionSelection ?? true,
    copyrightSafeMusicWarning: overrides.copyrightSafeMusicWarning ?? true,
    visionObservations: overrides.visionObservations ?? [],
  };
}

export function assertPreservationMode(options: ReeloraAdvancedOptions): void {
  if (options.noGenerativeMode === false) {
    throw new Error("Reelora preservation mode cannot be disabled by the automatic editor. Generative video replacement is intentionally unsupported.");
  }
}
