import type { CandidateSegment, HighlightIntent, NormalizedRegion, VisionObservation } from "./types.js";

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

export function clampRegion(region: NormalizedRegion): NormalizedRegion {
  const x = clamp(region.x);
  const y = clamp(region.y);
  const width = clamp(region.width, 0.02, 1 - x);
  const height = clamp(region.height, 0.02, 1 - y);
  return { ...region, x, y, width, height };
}

function expandedRegion(region: NormalizedRegion, padding: number): NormalizedRegion {
  const x = clamp(region.x - padding);
  const y = clamp(region.y - padding);
  const right = clamp(region.x + region.width + padding);
  const bottom = clamp(region.y + region.height + padding);
  return clampRegion({ x, y, width: right - x, height: bottom - y, confidence: region.confidence });
}

export function safeProductCrop(region: NormalizedRegion, highlight: HighlightIntent): NormalizedRegion {
  const padding = highlight === "fabric" || highlight === "print" || highlight === "logo" ? 0.04 : 0.1;
  return expandedRegion(region, padding);
}

function observationsForCandidate(candidate: CandidateSegment, observations: VisionObservation[]): VisionObservation[] {
  const start = candidate.start - 0.2;
  const end = candidate.start + candidate.duration + 0.2;
  return observations.filter((observation) =>
    observation.sourceIndex === candidate.sourceIndex && observation.time >= start && observation.time <= end,
  );
}

function average(values: Array<number | undefined>, fallback = 0): number {
  const usable = values.filter((value): value is number => Number.isFinite(value));
  return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : fallback;
}

function mostFrequent<T extends string | undefined>(values: T[]): T | undefined {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  let winner: string | undefined;
  let best = -1;
  for (const [value, count] of counts) {
    if (count > best) {
      winner = value;
      best = count;
    }
  }
  return winner as T | undefined;
}

function bestProductRegion(observations: VisionObservation[]): NormalizedRegion | undefined {
  const products = observations
    .map((observation) => observation.product)
    .filter((region): region is NormalizedRegion => Boolean(region))
    .sort((a, b) => (b.confidence ?? 0.5) - (a.confidence ?? 0.5));
  return products[0];
}

export function enrichCandidatesWithVision(
  candidates: CandidateSegment[],
  observations: VisionObservation[] | undefined,
  highlight: HighlightIntent,
): CandidateSegment[] {
  if (!observations?.length) return candidates;

  return candidates.map((candidate) => {
    const matches = observationsForCandidate(candidate, observations);
    if (!matches.length) return candidate;

    const visibility = clamp(average(matches.map((item) => item.productVisibility), 0.5));
    const confidence = clamp(average(matches.map((item) => item.confidence), 0.55));
    const occlusion = clamp(average(matches.map((item) => item.occlusion), 0));
    const blur = clamp(average(matches.map((item) => item.blur), 0));
    const pose = mostFrequent(matches.map((item) => item.pose));
    const variant = mostFrequent(matches.map((item) => item.variant));
    const product = bestProductRegion(matches);

    const visibilityBoost = 0.7 + visibility * 0.7;
    const confidenceBoost = 0.85 + confidence * 0.3;
    const penalty = Math.max(0.35, 1 - occlusion * 0.5 - blur * 0.45);
    const score = Number((candidate.score * visibilityBoost * confidenceBoost * penalty).toFixed(4));

    const reasons = [...candidate.reasons];
    reasons.push(`product-visibility:${visibility.toFixed(2)}`);
    reasons.push(`vision-confidence:${confidence.toFixed(2)}`);
    if (pose && pose !== "unknown") reasons.push(`pose:${pose}`);
    if (variant) reasons.push(`variant:${variant}`);
    if (occlusion > 0.45) reasons.push("occlusion-warning");
    if (blur > 0.45) reasons.push("blur-warning");

    return {
      ...candidate,
      score,
      reasons,
      productVisibility: visibility,
      confidence,
      pose,
      variant,
      cropRegion: product ? safeProductCrop(product, highlight) : candidate.cropRegion,
    };
  }).sort((a, b) => b.score - a.score);
}
