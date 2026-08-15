import { defaultAdvancedOptions, normalizeDistribution } from "./features.js";
import { STYLE_PROFILES } from "./profiles.js";
import type {
  AudioMode,
  CandidateSegment,
  EditPlan,
  HighlightIntent,
  PlannedShot,
  ReeloraAdvancedOptions,
  ShotDistribution,
  ShotType,
} from "./types.js";

function overlapRatio(a: CandidateSegment, b: CandidateSegment): number {
  if (a.sourcePath !== b.sourcePath) return 0;
  const start = Math.max(a.start, b.start);
  const end = Math.min(a.start + a.duration, b.start + b.duration);
  if (end <= start) return 0;
  return (end - start) / Math.min(a.duration, b.duration);
}

function countsForDistribution(distribution: ShotDistribution, slots = 10): Record<ShotType, number> {
  const entries: Array<[ShotType, number]> = [
    ["focus", distribution.focus],
    ["whole_body", distribution.wholeBody],
    ["detail", distribution.detail],
  ];
  const raw = entries.map(([type, value]) => ({ type, value: value * slots, count: Math.floor(value * slots) }));
  let assigned = raw.reduce((sum, item) => sum + item.count, 0);

  for (const item of raw) {
    if (item.value > 0 && item.count === 0) {
      item.count = 1;
      assigned += 1;
    }
  }

  while (assigned < slots) {
    const next = [...raw].sort((a, b) => (b.value - b.count) - (a.value - a.count))[0];
    next.count += 1;
    assigned += 1;
  }
  while (assigned > slots) {
    const next = [...raw]
      .filter((item) => item.count > (item.value > 0 ? 1 : 0))
      .sort((a, b) => (a.value - a.count) - (b.value - b.count))[0];
    if (!next) break;
    next.count -= 1;
    assigned -= 1;
  }

  return {
    focus: raw.find((item) => item.type === "focus")?.count ?? 0,
    whole_body: raw.find((item) => item.type === "whole_body")?.count ?? 0,
    detail: raw.find((item) => item.type === "detail")?.count ?? 0,
  };
}

function interleavedPattern(counts: Record<ShotType, number>): ShotType[] {
  const remaining = { ...counts };
  const pattern: ShotType[] = ["focus", "focus", "whole_body", "focus", "detail", "focus", "whole_body", "focus", "detail", "focus"];
  const output: ShotType[] = [];

  for (const type of pattern) {
    if (remaining[type] > 0) {
      output.push(type);
      remaining[type] -= 1;
    }
  }

  for (const type of ["focus", "whole_body", "detail"] as ShotType[]) {
    while (remaining[type] > 0) {
      output.push(type);
      remaining[type] -= 1;
    }
  }
  return output;
}

function candidateRank(candidate: CandidateSegment, shotType: ShotType, used: CandidateSegment[], options: ReeloraAdvancedOptions): number {
  let score = candidate.score;
  if (shotType === "detail") score *= 0.8 + (candidate.productVisibility ?? 0.55) * 0.55;
  if (shotType === "focus") score *= 0.85 + (candidate.productVisibility ?? 0.55) * 0.4;
  if (shotType === "whole_body" && candidate.pose && candidate.pose !== "detail") score *= 1.08;

  if (options.duplicateShotDetection !== false) {
    const overlap = Math.max(0, ...used.map((item) => overlapRatio(candidate, item)));
    score *= Math.max(0.25, 1 - overlap * 0.8);
  }

  if (options.poseVariety !== false && candidate.pose) {
    const samePose = used.filter((item) => item.pose && item.pose === candidate.pose).length;
    score *= Math.max(0.55, 1 - samePose * 0.12);
  }

  if (options.variantBalance !== false && candidate.variant) {
    const sameVariant = used.filter((item) => item.variant && item.variant === candidate.variant).length;
    score *= Math.max(0.65, 1 - sameVariant * 0.08);
  }

  if ((candidate.confidence ?? 1) < (options.confidenceThreshold ?? 0.55)) score *= 0.65;
  return score;
}

function chooseCandidate(
  candidates: CandidateSegment[],
  shotType: ShotType,
  used: CandidateSegment[],
  options: ReeloraAdvancedOptions,
): CandidateSegment | undefined {
  return [...candidates]
    .sort((a, b) => candidateRank(b, shotType, used, options) - candidateRank(a, shotType, used, options))[0];
}

function maximumSafeTotal(
  selected: Array<CandidateSegment & { shotType: ShotType }>,
  distribution: ShotDistribution,
): number {
  const typeData: Array<[ShotType, number]> = [
    ["focus", distribution.focus],
    ["whole_body", distribution.wholeBody],
    ["detail", distribution.detail],
  ];
  const caps: number[] = [];
  for (const [type, share] of typeData) {
    if (share <= 0) continue;
    const items = selected.filter((shot) => shot.shotType === type);
    if (!items.length) return 0;
    const shortest = Math.min(...items.map((item) => item.duration));
    caps.push((shortest * items.length) / share);
  }
  return caps.length ? Math.min(...caps) : 0;
}

const RHYTHM_WEIGHTS = [1.25, 0.72, 1.0, 1.48, 0.68, 1.18, 0.78, 1.3, 0.72, 1.08];

function plannedDurationFor(
  type: ShotType,
  index: number,
  total: number,
  distribution: ShotDistribution,
  selected: Array<CandidateSegment & { shotType: ShotType }>,
): number {
  const share = type === "focus" ? distribution.focus : type === "whole_body" ? distribution.wholeBody : distribution.detail;
  const weight = RHYTHM_WEIGHTS[index % RHYTHM_WEIGHTS.length];
  const typeWeightTotal = selected.reduce((sum, shot, shotIndex) => (
    shot.shotType === type ? sum + RHYTHM_WEIGHTS[shotIndex % RHYTHM_WEIGHTS.length] : sum
  ), 0);
  if (share <= 0 || typeWeightTotal <= 0) return 0;
  return total * share * (weight / typeWeightTotal);
}

function transitionFor(index: number, options: ReeloraAdvancedOptions): PlannedShot["transition"] {
  if (index === 0) return "cut";
  const mode = options.transitionMode ?? STYLE_PROFILES[options.style ?? "premium"].transitionMode;
  if (mode === "cuts") return "cut";
  if (mode === "premium_fx") {
    if (index % 3 === 0) return "motion";
    if (index % 5 === 0) return "dissolve";
    return "cut";
  }
  if (mode === "soft") return index % 4 === 0 ? "dissolve" : "cut";
  if (mode === "motion") return index % 3 === 0 ? "motion" : "cut";

  const style = options.style ?? "premium";
  if (style === "fashion" || style === "fast_ecommerce") {
    if (index % 7 === 0) return "dissolve";
    if (index % 4 === 0) return "motion";
    return "cut";
  }
  if (style === "luxury" || style === "cinematic") {
    if (index % 5 === 0) return "dissolve";
    return index % 4 === 0 ? "motion" : "cut";
  }
  if (style === "minimal") return index % 6 === 0 ? "fade" : "cut";
  if (index % 4 === 0) return "motion";
  if (index % 7 === 0) return "fade";
  return "cut";
}

function beatFriendlyTotal(total: number, bpm: number | undefined, slots: number): number {
  if (!bpm || !Number.isFinite(bpm) || bpm < 60 || bpm > 220 || slots <= 0) return total;
  const beat = 60 / bpm;
  const halfBeat = beat / 2;
  const targetPerShot = total / slots;
  const snappedPerShot = Math.max(halfBeat * 2, Math.round(targetPerShot / halfBeat) * halfBeat);
  const snappedTotal = snappedPerShot * slots;
  return Math.abs(snappedTotal - total) / total <= 0.12 ? snappedTotal : total;
}

export function buildEditPlan(args: {
  candidates: CandidateSegment[];
  outroPath?: string;
  musicPath?: string;
  musicBpm?: number;
  highlight: HighlightIntent;
  targetContentDuration?: number;
  audioMode?: AudioMode;
  options?: ReeloraAdvancedOptions;
}): EditPlan {
  if (!args.candidates.length) throw new Error("No usable candidate clips were found in the raw videos.");

  const options = defaultAdvancedOptions(args.highlight, args.options);
  const distribution = normalizeDistribution(options.distribution!);
  const style = STYLE_PROFILES[options.style ?? "premium"];
  const automaticDuration = Math.max(8, Math.min(24, args.candidates.length * 1.15 * style.shotLengthMultiplier));
  const requestedTotalRaw = Math.max(6, Math.min(args.targetContentDuration ?? automaticDuration, 45));
  const counts = countsForDistribution(distribution, 10);
  const pattern = interleavedPattern(counts);
  const requestedTotal = options.beatSync !== false && args.musicPath
    ? beatFriendlyTotal(requestedTotalRaw, args.musicBpm, pattern.length)
    : requestedTotalRaw;
  const selected: Array<CandidateSegment & { shotType: ShotType }> = [];
  const used: CandidateSegment[] = [];

  for (const shotType of pattern) {
    const candidate = chooseCandidate(args.candidates, shotType, used, options);
    if (!candidate) continue;
    used.push(candidate);
    selected.push({ ...candidate, shotType });
  }

  if (options.sourceKind === "generated_video" && options.preserveSourceSequence !== false) {
    selected.sort((a, b) => a.sourceIndex - b.sourceIndex || a.start - b.start);
  }

  if (!selected.length) throw new Error("Unable to construct a non-empty edit plan.");
  const safeTotal = maximumSafeTotal(selected, distribution);
  const actualTotal = Math.min(requestedTotal, safeTotal || requestedTotal);

  const shots: PlannedShot[] = selected.map((shot, index) => {
    const desired = plannedDurationFor(shot.shotType, index, actualTotal, distribution, selected);
    return {
      ...shot,
      targetDuration: Number(Math.min(shot.duration * 0.98, desired).toFixed(3)),
      transition: transitionFor(index, options),
      playbackRate: options.slowMotionFromHighFps && shot.reasons.includes("high-frame-rate") && index % 4 === 2 ? 0.8 : 1,
    };
  });

  const plannedDuration = shots.reduce((sum, shot) => sum + shot.targetDuration, 0);
  if (plannedDuration <= 0) throw new Error("Unable to construct a non-empty edit plan.");

  const runtimeOptions = {
    ...options,
    musicBpm: args.musicBpm,
  } as EditPlan["options"];

  return {
    highlight: args.highlight,
    targetContentDuration: Number(plannedDuration.toFixed(3)),
    distribution,
    shots,
    outroPath: args.outroPath,
    musicPath: args.musicPath,
    audioMode: args.musicPath ? (args.audioMode === "mix" ? "mix" : "music") : args.audioMode ?? "silent",
    options: runtimeOptions,
  };
}
