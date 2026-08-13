import type { EditPlan, QualityReport, ShotDistribution } from "./types.js";

function ratio(value: number, total: number): number {
  return total > 0 ? value / total : 0;
}

export function actualDistribution(plan: EditPlan): ShotDistribution {
  const total = plan.shots.reduce((sum, shot) => sum + shot.targetDuration, 0);
  const focus = plan.shots.filter((shot) => shot.shotType === "focus").reduce((sum, shot) => sum + shot.targetDuration, 0);
  const wholeBody = plan.shots.filter((shot) => shot.shotType === "whole_body").reduce((sum, shot) => sum + shot.targetDuration, 0);
  const detail = plan.shots.filter((shot) => shot.shotType === "detail").reduce((sum, shot) => sum + shot.targetDuration, 0);
  return { focus: ratio(focus, total), wholeBody: ratio(wholeBody, total), detail: ratio(detail, total) };
}

function near(a: number, b: number, tolerance = 0.012): boolean {
  return Math.abs(a - b) <= tolerance;
}

export function buildQualityReport(plan: EditPlan, renderWarnings: string[] = []): QualityReport {
  const distribution = actualDistribution(plan);
  const expected = plan.distribution;
  const averageScore = plan.shots.reduce((sum, shot) => sum + Math.min(1.5, shot.score), 0) / Math.max(1, plan.shots.length);
  const visionConfidence = plan.shots
    .map((shot) => shot.confidence)
    .filter((value): value is number => typeof value === "number");
  const confidence = visionConfidence.length
    ? visionConfidence.reduce((sum, value) => sum + value, 0) / visionConfidence.length
    : Math.min(0.82, 0.55 + averageScore * 0.14);

  const checks = [
    {
      name: "shot-distribution",
      passed: near(distribution.focus, expected.focus) && near(distribution.wholeBody, expected.wholeBody) && near(distribution.detail, expected.detail),
      detail: `actual=${JSON.stringify(distribution)} expected=${JSON.stringify(expected)}`,
    },
    { name: "no-generative-mode", passed: plan.options.noGenerativeMode !== false, detail: "Only deterministic crop/scale/trim/transition operations are permitted." },
    { name: "product-color-lock", passed: plan.options.productColorLock !== false, detail: "No creative hue or saturation shift is applied by default." },
    { name: "fabric-texture-guard", passed: plan.options.fabricTextureGuard !== false, detail: "Texture-destructive smoothing is disabled by default." },
    { name: "logo-print-lock", passed: plan.options.logoPrintLock !== false, detail: "Crop safety must preserve important logo/print regions when observations are supplied." },
  ];

  const passed = checks.filter((check) => check.passed).length;
  const score = Math.round((passed / checks.length) * 70 + Math.min(30, confidence * 30));

  return {
    score,
    confidence: Number(confidence.toFixed(3)),
    distribution,
    checks,
    warnings: renderWarnings,
  };
}
