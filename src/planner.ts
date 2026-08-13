import type { AudioMode, CandidateSegment, EditPlan, HighlightIntent, PlannedShot, ShotType } from "./types.js";

function distributionFor(highlight: HighlightIntent) {
  if (highlight === "top_wear") {
    return { focus: 0.7, wholeBody: 0.2, detail: 0.1 };
  }
  if (highlight === "fit" || highlight === "front_back") {
    return { focus: 0.5, wholeBody: 0.4, detail: 0.1 };
  }
  return { focus: 0.6, wholeBody: 0.25, detail: 0.15 };
}

function shotPattern(highlight: HighlightIntent): ShotType[] {
  if (highlight === "top_wear") {
    // Ten equal-duration slots make the requested distribution exact by time:
    // 7 focus + 2 whole body + 1 detail = 70% / 20% / 10%.
    return [
      "focus",
      "focus",
      "whole_body",
      "focus",
      "detail",
      "focus",
      "focus",
      "whole_body",
      "focus",
      "focus",
    ];
  }
  return ["focus", "whole_body", "focus", "detail", "focus", "whole_body"];
}

function targetDurations(pattern: ShotType[], total: number, distribution: ReturnType<typeof distributionFor>): number[] {
  const counts = {
    focus: pattern.filter((x) => x === "focus").length,
    whole_body: pattern.filter((x) => x === "whole_body").length,
    detail: pattern.filter((x) => x === "detail").length,
  };

  return pattern.map((type) => {
    if (type === "focus") return (total * distribution.focus) / counts.focus;
    if (type === "whole_body") return (total * distribution.wholeBody) / counts.whole_body;
    return (total * distribution.detail) / counts.detail;
  });
}

function overlapRatio(a: CandidateSegment, b: CandidateSegment): number {
  if (a.sourcePath !== b.sourcePath) return 0;
  const start = Math.max(a.start, b.start);
  const end = Math.min(a.start + a.duration, b.start + b.duration);
  if (end <= start) return 0;
  return (end - start) / Math.min(a.duration, b.duration);
}

function chooseCandidate(candidates: CandidateSegment[], used: CandidateSegment[]): CandidateSegment | undefined {
  const diverse = candidates.find((candidate) => used.every((u) => overlapRatio(candidate, u) < 0.35));
  return diverse ?? candidates.find((candidate) => used.every((u) => overlapRatio(candidate, u) < 0.7)) ?? candidates[used.length % candidates.length];
}

export function buildEditPlan(args: {
  candidates: CandidateSegment[];
  outroPath: string;
  musicPath?: string;
  highlight: HighlightIntent;
  targetContentDuration?: number;
  audioMode?: AudioMode;
}): EditPlan {
  const total = Math.max(6, Math.min(args.targetContentDuration ?? 15, 30));
  if (!args.candidates.length) throw new Error("No usable candidate clips were found in the raw videos.");

  const distribution = distributionFor(args.highlight);
  const pattern = shotPattern(args.highlight);
  const selected: Array<CandidateSegment & { shotType: ShotType }> = [];
  const used: CandidateSegment[] = [];

  for (const shotType of pattern) {
    const candidate = chooseCandidate(args.candidates, used);
    if (!candidate) continue;
    used.push(candidate);
    selected.push({ ...candidate, shotType });
  }

  if (!selected.length) throw new Error("Unable to construct a non-empty edit plan.");

  let shots: PlannedShot[];
  if (args.highlight === "top_wear") {
    const requestedSlot = total / 10;
    // Never violate 70/20/10 just to hit a requested duration. If source windows are
    // shorter, reduce every slot equally so the time distribution remains exact.
    const slot = Math.min(requestedSlot, ...selected.map((shot) => shot.duration));
    shots = selected.map((shot) => ({
      ...shot,
      targetDuration: Number(slot.toFixed(3)),
    }));
  } else {
    const durations = targetDurations(pattern, total, distribution);
    shots = selected.map((shot, index) => ({
      ...shot,
      targetDuration: Number(Math.min(durations[index] ?? shot.duration, shot.duration).toFixed(3)),
    }));
  }

  const plannedDuration = shots.reduce((sum, shot) => sum + shot.targetDuration, 0);
  if (plannedDuration <= 0) throw new Error("Unable to construct a non-empty edit plan.");

  return {
    highlight: args.highlight,
    targetContentDuration: Number(plannedDuration.toFixed(3)),
    distribution,
    shots,
    outroPath: args.outroPath,
    musicPath: args.musicPath,
    audioMode: args.musicPath ? "music" : args.audioMode ?? "silent",
  };
}
