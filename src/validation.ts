import { probeMedia } from "./ffmpeg.js";
import type { EditPlan } from "./types.js";

function ratio(value: number, total: number): number {
  return total > 0 ? value / total : 0;
}

export function validatePlan(plan: EditPlan): void {
  if (!plan.shots.length) throw new Error("Edit plan contains no shots.");

  for (const shot of plan.shots) {
    if (shot.targetDuration <= 0) throw new Error("Edit plan contains a non-positive shot duration.");
    if (shot.targetDuration > shot.duration + 0.01) {
      throw new Error("Edit plan attempted to use more source duration than exists in a candidate clip.");
    }
  }

  if (plan.highlight === "top_wear") {
    const total = plan.shots.reduce((sum, shot) => sum + shot.targetDuration, 0);
    const focus = plan.shots.filter((shot) => shot.shotType === "focus").reduce((sum, shot) => sum + shot.targetDuration, 0);
    const wholeBody = plan.shots.filter((shot) => shot.shotType === "whole_body").reduce((sum, shot) => sum + shot.targetDuration, 0);
    const detail = plan.shots.filter((shot) => shot.shotType === "detail").reduce((sum, shot) => sum + shot.targetDuration, 0);

    const actual = {
      focus: ratio(focus, total),
      wholeBody: ratio(wholeBody, total),
      detail: ratio(detail, total),
    };

    const tolerance = 0.005;
    if (
      Math.abs(actual.focus - 0.7) > tolerance ||
      Math.abs(actual.wholeBody - 0.2) > tolerance ||
      Math.abs(actual.detail - 0.1) > tolerance
    ) {
      throw new Error(
        `Top-wear plan violates the required 70/20/10 distribution: ${JSON.stringify(actual)}`,
      );
    }
  }
}

export async function validateRenderedOutput(path: string): Promise<void> {
  const info = await probeMedia(path);
  if (info.width !== 1080 || info.height !== 1920) {
    throw new Error(`Rendered output must be 1080x1920, got ${info.width}x${info.height}.`);
  }
  if (info.duration <= 0.5) throw new Error("Rendered output is unexpectedly short.");
}
