export type HighlightIntent =
  | "top_wear"
  | "pants"
  | "skirt"
  | "dress"
  | "shoes"
  | "bag"
  | "fabric"
  | "print"
  | "logo"
  | "neckline"
  | "sleeves"
  | "fit"
  | "front_back"
  | "general";

export type ShotType = "focus" | "whole_body" | "detail";
export type AudioMode = "silent" | "music" | "original" | "mix";
export type EditingStyle =
  | "premium"
  | "minimal"
  | "fashion"
  | "fast_ecommerce"
  | "cinematic"
  | "luxury"
  | "clean_commercial";
export type PlatformPreset = "instagram_reels" | "tiktok" | "youtube_shorts" | "facebook_reels";
export type TransitionMode = "auto" | "cuts" | "soft" | "motion" | "premium_fx";
export type TransitionIntensity = "subtle" | "balanced" | "bold";
export type PremiumTransitionFamily =
  | "liquid-splash"
  | "ink-bloom"
  | "prism-refraction"
  | "particle-crystallize"
  | "light-sweep"
  | "glass-ripple"
  | "silk-fold"
  | "luma-bloom";
export type AnimationIntensity = "off" | "subtle" | "balanced";
export type HardwareEncoder = "auto" | "libx264" | "h264_nvenc" | "h264_qsv" | "h264_amf";
export type TimelineFormat = "json" | "csv" | "edl";
export type ReviewState = "draft" | "review" | "approved";
export type FeatureStage = "implemented" | "adapter_ready" | "planned";

export interface ShotDistribution {
  focus: number;
  wholeBody: number;
  detail: number;
}

export interface NormalizedRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
}

export interface VisionObservation {
  sourceIndex: number;
  time: number;
  product?: NormalizedRegion;
  face?: NormalizedRegion;
  hands?: NormalizedRegion[];
  fullBody?: NormalizedRegion;
  logo?: NormalizedRegion;
  print?: NormalizedRegion;
  fabric?: NormalizedRegion;
  pose?: "front" | "side" | "back" | "walking" | "detail" | "unknown";
  variant?: string;
  sku?: string;
  productVisibility?: number;
  logoVisibility?: number;
  printVisibility?: number;
  fabricDetail?: number;
  occlusion?: number;
  blur?: number;
  movementQuality?: number;
  distractionScore?: number;
  mirrorReflectionRisk?: number;
  confidence?: number;
}

export interface ReeloraAdvancedOptions {
  style?: EditingStyle;
  platform?: PlatformPreset;
  distribution?: ShotDistribution;
  autoDuration?: boolean;
  retentionEditing?: boolean;
  dynamicSubjectTracking?: boolean;
  beatSync?: boolean;
  musicEnergyMatching?: boolean;
  outroBeatAlignment?: boolean;
  audioDucking?: boolean;
  preserveOriginalAudio?: boolean;
  duplicateShotDetection?: boolean;
  poseVariety?: boolean;
  smartTransitions?: boolean;
  productColorLock?: boolean;
  fabricTextureGuard?: boolean;
  logoPrintLock?: boolean;
  faceIntegrityGuard?: boolean;
  handIntegrityGuard?: boolean;
  bodyShapeIntegrityGuard?: boolean;
  cropSafetyZones?: boolean;
  autoOrientation?: boolean;
  frameRateNormalization?: boolean;
  slowMotionFromHighFps?: boolean;
  opticalFlowGuard?: boolean;
  stabilization?: boolean;
  rollingShutterGuard?: boolean;
  exposureFlickerCorrection?: boolean;
  whiteBalanceConsistency?: boolean;
  hdrSdrSafety?: boolean;
  colorSpaceDetection?: boolean;
  blurFilter?: boolean;
  occlusionFilter?: boolean;
  badPoseFilter?: boolean;
  distractionFilter?: boolean;
  mirrorReflectionGuard?: boolean;
  variantBalance?: boolean;
  singleModelConsistency?: boolean;
  multiProductDetection?: boolean;
  skuLock?: string;
  heroVariant?: string;
  referenceFace?: string;
  referenceProduct?: string;
  referenceReel?: string;
  brandProfile?: string;
  transitionMode?: TransitionMode;
  premiumTransitionEffects?: boolean;
  transitionIntensity?: TransitionIntensity;
  transitionFamilies?: PremiumTransitionFamily[];
  premiumAnimationEffects?: boolean;
  animationIntensity?: AnimationIntensity;
  autoThumbnail?: boolean;
  coverCrop?: boolean;
  qualityReport?: boolean;
  editDecisionReport?: boolean;
  beforeAfterValidation?: boolean;
  pixelPreservationAudit?: boolean;
  generativeDetectionAudit?: boolean;
  qualityThreshold?: number;
  autoReeditOnValidationFailure?: boolean;
  autoReeditUntilPass?: boolean;
  noGenerativeMode?: boolean;
  proxyAnalysis?: boolean;
  localVision?: boolean;
  offlineMode?: boolean;
  privacyMode?: boolean;
  autoDeleteRawCache?: boolean;
  hardwareEncoder?: HardwareEncoder;
  targetFileSizeMb?: number;
  versionOutputs?: boolean;
  confidenceThreshold?: number;
  sixtyFpsOutput?: boolean;
  proResMaster?: boolean;
  responsiveExports?: boolean;
  compressionSimulation?: boolean;
  compressionArtifactGuard?: boolean;
  texturePreservationScore?: boolean;
  bitrateOptimization?: boolean;
  introVideo?: string;
  alternateOutros?: string[];
  preserveOutroDuration?: boolean;
  watchFolder?: string;
  queueMode?: boolean;
  crashRecovery?: boolean;
  renderCache?: boolean;
  partialRenderCache?: boolean;
  diskSpaceGuard?: boolean;
  corruptVideoDetection?: boolean;
  codecCompatibilityCheck?: boolean;
  timelineExport?: TimelineFormat[];
  projectFileMode?: boolean;
  clientReviewMode?: boolean;
  approvalLock?: boolean;
  reviewState?: ReviewState;
  seasonPreset?: string;
  campaignId?: string;
  campaignConsistency?: boolean;
  editingDnaProfile?: string;
  styleMatchReference?: boolean;
  competitorAnalysisMode?: boolean;
  naturalSoundHighlighting?: boolean;
  audioCleanup?: boolean;
  silenceAwareCuts?: boolean;
  musicDropDetection?: boolean;
  musicSectionSelection?: boolean;
  copyrightSafeMusicWarning?: boolean;
  visionObservations?: VisionObservation[];
}

export interface MediaInfo {
  path: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  hasAudio: boolean;
}

export interface CandidateSegment {
  sourcePath: string;
  sourceIndex: number;
  start: number;
  duration: number;
  score: number;
  reasons: string[];
  productVisibility?: number;
  logoVisibility?: number;
  printVisibility?: number;
  fabricDetail?: number;
  movementQuality?: number;
  pose?: VisionObservation["pose"];
  variant?: string;
  sku?: string;
  cropRegion?: NormalizedRegion;
  confidence?: number;
}

export interface PlannedShot extends CandidateSegment {
  shotType: ShotType;
  targetDuration: number;
  transition?: "cut" | "fade" | "dissolve" | "motion";
  playbackRate?: number;
  locked?: boolean;
  approved?: boolean;
}

export interface EditPlan {
  highlight: HighlightIntent;
  targetContentDuration: number;
  distribution: ShotDistribution;
  shots: PlannedShot[];
  outroPath: string;
  musicPath?: string;
  audioMode: AudioMode;
  options: Required<Pick<ReeloraAdvancedOptions,
    | "style"
    | "platform"
    | "retentionEditing"
    | "dynamicSubjectTracking"
    | "beatSync"
    | "smartTransitions"
    | "productColorLock"
    | "fabricTextureGuard"
    | "logoPrintLock"
    | "faceIntegrityGuard"
    | "handIntegrityGuard"
    | "cropSafetyZones"
    | "noGenerativeMode"
    | "hardwareEncoder"
  >> & ReeloraAdvancedOptions;
}

export interface QualityReport {
  score: number;
  confidence: number;
  distribution: ShotDistribution;
  checks: Array<{ name: string; passed: boolean; detail: string }>;
  warnings: string[];
}

export interface FeatureCapability {
  id: string;
  category: string;
  stage: FeatureStage;
  description: string;
  preservationSafe: boolean;
}

export interface TimelineEvent {
  index: number;
  sourceIndex: number;
  sourcePath: string;
  sourceStart: number;
  sourceDuration: number;
  outputStart: number;
  outputDuration: number;
  shotType: ShotType;
  transition?: PlannedShot["transition"];
  locked?: boolean;
}

export interface RevisionInstruction {
  action: "lock_shot" | "unlock_shot" | "replace_shot" | "blacklist_source_window" | "favorite_source_window" | "edit_region";
  shotIndex?: number;
  sourceIndex?: number;
  start?: number;
  end?: number;
  replacementSourceIndex?: number;
  replacementStart?: number;
}

export interface RenderResult {
  outputPath: string;
  durationEstimate: number;
  shotsRendered: number;
  warnings: string[];
  thumbnailPath?: string;
  coverPath?: string;
  editPlanPath?: string;
  timelinePaths?: string[];
  qualityReport?: QualityReport;
  ffmpegAudit?: string[];
}
