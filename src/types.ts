export type HighlightIntent =
  | "top_wear"
  | "pants"
  | "fabric"
  | "print"
  | "fit"
  | "front_back"
  | "general";

export type ShotType = "focus" | "whole_body" | "detail";

export type AudioMode = "silent" | "music" | "original";

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
}

export interface PlannedShot extends CandidateSegment {
  shotType: ShotType;
  targetDuration: number;
}

export interface EditPlan {
  highlight: HighlightIntent;
  targetContentDuration: number;
  distribution: {
    focus: number;
    wholeBody: number;
    detail: number;
  };
  shots: PlannedShot[];
  outroPath: string;
  musicPath?: string;
  audioMode: AudioMode;
}

export interface RenderResult {
  outputPath: string;
  durationEstimate: number;
  shotsRendered: number;
  warnings: string[];
}
