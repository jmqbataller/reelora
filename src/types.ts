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
export type TransitionMode = "auto" | "cuts" | "soft" | "motion";
export type HardwareEncoder = "auto" | "libx264" | "h264_nvenc" | "h264_qsv" | "h264_amf";

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
  pose?: "front" | "side" | "back" | "walking" | "detail" | "unknown";
  variant?: string;
  productVisibility?: number;
  occlusion?: number;
  blur?: number;
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
  cropSafetyZones?: boolean;
  autoOrientation?: boolean;
  frameRateNormalization?: boolean;
  slowMotionFromHighFps?: boolean;
  stabilization?: boolean;
  blurFilter?: boolean;
  occlusionFilter?: boolean;
  badPoseFilter?: boolean;
  variantBalance?: boolean;
  singleModelConsistency?: boolean;
  referenceFace?: string;
  referenceProduct?: string;
  brandProfile?: string;
  transitionMode?: TransitionMode;
  autoThumbnail?: boolean;
  coverCrop?: boolean;
  qualityReport?: boolean;
  editDecisionReport?: boolean;
  beforeAfterValidation?: boolean;
  autoReeditOnValidationFailure?: boolean;
  noGenerativeMode?: boolean;
  proxyAnalysis?: boolean;
  hardwareEncoder?: HardwareEncoder;
  targetFileSizeMb?: number;
  versionOutputs?: boolean;
  confidenceThreshold?: number;
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
  pose?: VisionObservation["pose"];
  variant?: string;
  cropRegion?: NormalizedRegion;
  confidence?: number;
}

export interface PlannedShot extends CandidateSegment {
  shotType: ShotType;
  targetDuration: number;
  transition?: "cut" | "fade" | "dissolve" | "motion";
  playbackRate?: number;
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

export interface RenderResult {
  outputPath: string;
  durationEstimate: number;
  shotsRendered: number;
  warnings: string[];
  thumbnailPath?: string;
  coverPath?: string;
  editPlanPath?: string;
  qualityReport?: QualityReport;
  ffmpegAudit?: string[];
}
