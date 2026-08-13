import { detectSceneTimes, probeMedia } from "./ffmpeg.js";
import type { CandidateSegment, MediaInfo } from "./types.js";

const MIN_SEGMENT = 1.2;
const MAX_SEGMENT = 3.2;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function scoreSegment(info: MediaInfo, start: number, duration: number, isSceneBoundary: boolean): CandidateSegment["score"] {
  const pixels = info.width * info.height;
  const resolutionScore = clamp(pixels / (1080 * 1920), 0.35, 1.25);
  const durationScore = 1 - Math.min(Math.abs(duration - 2.2) / 2.2, 0.7);
  const edgeDistance = Math.min(start, Math.max(0, info.duration - (start + duration)));
  const edgeScore = clamp(edgeDistance / 0.7, 0.55, 1);
  const fpsScore = info.fps >= 50 ? 1.08 : info.fps >= 29 ? 1 : 0.9;
  const sceneScore = isSceneBoundary ? 1.08 : 1;
  return Number((resolutionScore * durationScore * edgeScore * fpsScore * sceneScore).toFixed(4));
}

function candidateReasons(info: MediaInfo, isSceneBoundary: boolean): string[] {
  const reasons: string[] = [];
  if (isSceneBoundary) reasons.push("scene-boundary");
  if (info.width * info.height >= 1080 * 1920) reasons.push("high-resolution");
  if (info.fps >= 50) reasons.push("high-frame-rate");
  if (!reasons.length) reasons.push("usable-source-window");
  return reasons;
}

export async function analyzeSources(paths: string[]): Promise<{ media: MediaInfo[]; candidates: CandidateSegment[] }> {
  const media: MediaInfo[] = [];
  const candidates: CandidateSegment[] = [];

  for (let sourceIndex = 0; sourceIndex < paths.length; sourceIndex += 1) {
    const sourcePath = paths[sourceIndex];
    const info = await probeMedia(sourcePath);
    media.push(info);
    if (info.duration < MIN_SEGMENT) continue;

    const scenes = await detectSceneTimes(sourcePath);
    const anchors = [0.35, ...scenes.filter((t) => t < info.duration - MIN_SEGMENT)];

    // Scene-aware windows.
    for (const anchor of anchors) {
      const remaining = info.duration - anchor;
      if (remaining < MIN_SEGMENT) continue;
      const duration = clamp(remaining, MIN_SEGMENT, MAX_SEGMENT);
      const isSceneBoundary = scenes.some((s) => Math.abs(s - anchor) < 0.05);
      candidates.push({
        sourcePath,
        sourceIndex,
        start: Number(anchor.toFixed(3)),
        duration: Number(duration.toFixed(3)),
        score: scoreSegment(info, anchor, duration, isSceneBoundary),
        reasons: candidateReasons(info, isSceneBoundary),
      });
    }

    // Fallback coverage so a single long take still yields multiple useful options.
    for (let start = 0.6; start + MIN_SEGMENT < info.duration; start += 2.4) {
      const duration = clamp(info.duration - start, MIN_SEGMENT, MAX_SEGMENT);
      candidates.push({
        sourcePath,
        sourceIndex,
        start: Number(start.toFixed(3)),
        duration: Number(duration.toFixed(3)),
        score: scoreSegment(info, start, duration, false),
        reasons: candidateReasons(info, false),
      });
    }
  }

  const deduped = new Map<string, CandidateSegment>();
  for (const candidate of candidates) {
    const key = `${candidate.sourceIndex}:${Math.round(candidate.start * 4)}`;
    const current = deduped.get(key);
    if (!current || candidate.score > current.score) deduped.set(key, candidate);
  }

  return {
    media,
    candidates: [...deduped.values()].sort((a, b) => b.score - a.score),
  };
}
