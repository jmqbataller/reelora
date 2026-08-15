import { measureVisualSimilarity, probeAudioPeakDb, probeMedia } from "./ffmpeg.js";
import { actualDistribution } from "./quality.js";
import type { EditPlan, ShotDistribution } from "./types.js";

function near(a: number, b: number, tolerance = 0.012): boolean {
  return Math.abs(a - b) <= tolerance;
}

function validateDistribution(actual: ShotDistribution, expected: ShotDistribution): void {
  if (!near(actual.focus, expected.focus) || !near(actual.wholeBody, expected.wholeBody) || !near(actual.detail, expected.detail)) {
    throw new Error(`Edit plan violates the requested shot distribution. actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
  }
}

export function validatePlan(plan: EditPlan): void {
  if (!plan.shots.length) throw new Error("Edit plan contains no shots.");
  if (plan.options.noGenerativeMode === false) throw new Error("Reelora automatic editing requires no-generative preservation mode.");

  for (const shot of plan.shots) {
    if (shot.targetDuration <= 0) throw new Error("Edit plan contains a non-positive shot duration.");
    const sourceNeeded = shot.targetDuration * (shot.playbackRate ?? 1);
    if (sourceNeeded > shot.duration + 0.02) {
      throw new Error("Edit plan attempted to use more source duration than exists in a candidate clip.");
    }
    if (shot.cropRegion) {
      const { x, y, width, height } = shot.cropRegion;
      if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > 1.001 || y + height > 1.001) {
        throw new Error("Vision crop region is outside the real source frame.");
      }
    }
  }

  validateDistribution(actualDistribution(plan), plan.distribution);

  if (plan.options.useAllUploadedVideos !== false && plan.options.inputSourceCount !== undefined) {
    const usedSources = new Set(plan.shots.map((shot) => shot.sourceIndex));
    const missingSources = Array.from({ length: plan.options.inputSourceCount }, (_, index) => index)
      .filter((index) => !usedSources.has(index));
    if (missingSources.length) {
      throw new Error(`Edit plan omitted uploaded video(s) ${missingSources.map((index) => index + 1).join(", ")}.`);
    }
  }

  if (plan.options.sourceKind === "generated_video") {
    const declaredDuration = new Map<number, number>();
    for (const shot of plan.shots) {
      declaredDuration.set(shot.sourceIndex, Math.max(
        declaredDuration.get(shot.sourceIndex) ?? 0,
        shot.sourceDuration ?? shot.start + shot.duration,
      ));
    }
    const totalSourceDuration = [...declaredDuration.values()].reduce((sum, duration) => sum + duration, 0);
    if (totalSourceDuration >= 4 && plan.shots.length < 4) {
      throw new Error("AI-video remix must create a real multi-shot edit, not pass through the uploaded video.");
    }

    const exactWindows = new Set<string>();
    for (const shot of plan.shots) {
      const key = `${shot.sourceIndex}:${shot.start.toFixed(3)}:${shot.duration.toFixed(3)}`;
      if (exactWindows.has(key)) throw new Error("AI-video remix repeated an identical source window instead of building a new edit.");
      exactWindows.add(key);
    }

    const sequence = plan.shots.map((shot) => ({ sourceIndex: shot.sourceIndex, start: shot.start }));
    if (plan.options.remixMode === "recreate") {
      const rearranged = sequence.some((shot, index) => index > 0 && (
        shot.sourceIndex < sequence[index - 1].sourceIndex
        || (shot.sourceIndex === sequence[index - 1].sourceIndex && shot.start < sequence[index - 1].start)
      ));
      if (!rearranged) throw new Error("Recreate mode must rearrange the source sequence; chronological pass-through is not a recreation.");
    } else {
      const chronological = sequence.every((shot, index) => index === 0 || (
        shot.sourceIndex > sequence[index - 1].sourceIndex
        || (shot.sourceIndex === sequence[index - 1].sourceIndex && shot.start >= sequence[index - 1].start)
      ));
      if (!chronological) throw new Error("Re-edit mode must preserve story order while trimming and repacing it.");
    }

    const selectedDuration = plan.shots.reduce((sum, shot) => sum + shot.targetDuration * (shot.playbackRate ?? 1), 0);
    if (totalSourceDuration > 0 && selectedDuration / totalSourceDuration > 0.92) {
      throw new Error("AI-video remix retained nearly the full source duration. It must trim and rebuild the pacing instead of re-encoding the original timeline.");
    }
  }

  if (plan.highlight === "top_wear" && !near(plan.distribution.focus, 0.7, 0.001) && !plan.options.distribution) {
    throw new Error("Default top-wear edits must keep the 70% focus / 20% whole-body / 10% detail rule.");
  }
}

export async function validateRenderedOutput(path: string, plan?: EditPlan): Promise<{
  materiallyReedited: boolean;
  visualSimilarityToSource?: number;
  audioPeakDb?: number;
}> {
  const info = await probeMedia(path);
  if (info.width !== 1080 || info.height !== 1920) {
    throw new Error(`Rendered output must be 1080x1920, got ${info.width}x${info.height}.`);
  }
  if (info.duration <= 0.5) throw new Error("Rendered output is unexpectedly short.");
  const requireAudio = Boolean(plan?.musicPath) || plan?.audioMode === "music" || plan?.audioMode === "mix";
  let audioPeakDb: number | undefined;
  if (requireAudio) {
    if (!info.hasAudio) throw new Error("Rendered output is missing the requested music/audio stream.");
    audioPeakDb = await probeAudioPeakDb(path);
    if (audioPeakDb === undefined || audioPeakDb < -55) {
      throw new Error(`Rendered music/audio is effectively silent (${audioPeakDb ?? "unknown"} dB peak).`);
    }
  }

  let visualSimilarityToSource: number | undefined;
  if (plan?.options.sourceKind === "generated_video" && (plan.options.inputSourceCount ?? 1) === 1 && plan.shots[0]) {
    const sourceInfo = await probeMedia(plan.shots[0].sourcePath);
    visualSimilarityToSource = await measureVisualSimilarity(
      plan.shots[0].sourcePath,
      path,
      Math.min(sourceInfo.duration, plan.targetContentDuration, info.duration),
    );
    if (visualSimilarityToSource !== undefined && visualSimilarityToSource >= 0.94) {
      throw new Error(`AI-video remix is ${Number((visualSimilarityToSource * 100).toFixed(1))}% visually identical to the source. Reelora must cut, trim, rearrange, or materially re-edit it.`);
    }
  }
  return { materiallyReedited: true, visualSimilarityToSource, audioPeakDb };
}
