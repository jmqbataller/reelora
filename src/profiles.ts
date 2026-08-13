import type { EditingStyle, PlatformPreset, TransitionMode } from "./types.js";

export interface StyleProfile {
  shotLengthMultiplier: number;
  transitionDuration: number;
  transitionMode: TransitionMode;
  motionAmount: number;
  openingFade: number;
  endingFade: number;
  crf: number;
}

export const STYLE_PROFILES: Record<EditingStyle, StyleProfile> = {
  premium: { shotLengthMultiplier: 1, transitionDuration: 0.16, transitionMode: "auto", motionAmount: 8, openingFade: 0.18, endingFade: 0.22, crf: 18 },
  minimal: { shotLengthMultiplier: 1.12, transitionDuration: 0.12, transitionMode: "cuts", motionAmount: 4, openingFade: 0.16, endingFade: 0.2, crf: 18 },
  fashion: { shotLengthMultiplier: 0.92, transitionDuration: 0.14, transitionMode: "motion", motionAmount: 10, openingFade: 0.16, endingFade: 0.2, crf: 18 },
  fast_ecommerce: { shotLengthMultiplier: 0.72, transitionDuration: 0.1, transitionMode: "cuts", motionAmount: 9, openingFade: 0.1, endingFade: 0.16, crf: 19 },
  cinematic: { shotLengthMultiplier: 1.22, transitionDuration: 0.22, transitionMode: "soft", motionAmount: 6, openingFade: 0.28, endingFade: 0.3, crf: 17 },
  luxury: { shotLengthMultiplier: 1.28, transitionDuration: 0.24, transitionMode: "soft", motionAmount: 5, openingFade: 0.3, endingFade: 0.34, crf: 17 },
  clean_commercial: { shotLengthMultiplier: 0.95, transitionDuration: 0.13, transitionMode: "auto", motionAmount: 6, openingFade: 0.14, endingFade: 0.18, crf: 18 },
};

export interface PlatformProfile {
  width: number;
  height: number;
  fps: number;
  safeTop: number;
  safeBottom: number;
  safeSides: number;
}

export const PLATFORM_PROFILES: Record<PlatformPreset, PlatformProfile> = {
  instagram_reels: { width: 1080, height: 1920, fps: 30, safeTop: 0.07, safeBottom: 0.16, safeSides: 0.06 },
  tiktok: { width: 1080, height: 1920, fps: 30, safeTop: 0.08, safeBottom: 0.2, safeSides: 0.08 },
  youtube_shorts: { width: 1080, height: 1920, fps: 30, safeTop: 0.07, safeBottom: 0.14, safeSides: 0.06 },
  facebook_reels: { width: 1080, height: 1920, fps: 30, safeTop: 0.07, safeBottom: 0.16, safeSides: 0.06 },
};
