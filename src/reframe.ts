import type { LandscapeReframeMode, SourceOrientation } from "./types.js";

export type ResolvedVerticalReframe = "native_portrait" | "smart_crop" | "blur_fill";

export function detectSourceOrientation(width: number, height: number): SourceOrientation {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return "portrait";
  const ratio = width / height;
  if (ratio > 1.05) return "landscape";
  if (ratio < 0.95) return "portrait";
  return "square";
}

export function resolveVerticalReframe(args: {
  width: number;
  height: number;
  requested?: LandscapeReframeMode;
  hasTrackedRegion?: boolean;
}): ResolvedVerticalReframe {
  const orientation = detectSourceOrientation(args.width, args.height);
  if (orientation === "portrait") return "native_portrait";
  if (orientation === "square") return "smart_crop";
  if (args.requested === "smart_crop") return "smart_crop";
  if (args.requested === "blur_fill") return "blur_fill";
  return args.hasTrackedRegion ? "smart_crop" : "blur_fill";
}
