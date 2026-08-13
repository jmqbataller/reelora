import { probeMedia } from "./ffmpeg.js";
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

  if (plan.highlight === "top_wear" && !near(plan.distribution.focus, 0.7, 0.001) && !plan.options.distribution) {
    throw new Error("Default top-wear edits must keep the 70% focus / 20% whole-body / 10% detail rule.");
  }
}

export async function validateRenderedOutput(path: string): Promise<void> {
  const info = await probeMedia(path);
  if (info.width !== 1080 || info.height !== 1920) {
    throw new Error(`Rendered output must be 1080x1920, got ${info.width}x${info.height}.`);
  }
  if (info.duration <= 0.5) throw new Error("Rendered output is unexpectedly short.");
}
