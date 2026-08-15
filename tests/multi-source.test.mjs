import assert from "node:assert/strict";
import test from "node:test";
import { buildEditPlan } from "../dist/planner.js";
import { validatePlan } from "../dist/validation.js";

function candidatesForSources(sourceCount, windowsPerSource = 5) {
  return Array.from({ length: sourceCount }, (_, sourceIndex) => (
    Array.from({ length: windowsPerSource }, (_, windowIndex) => ({
      sourcePath: `/upload-${sourceIndex + 1}.mp4`,
      sourceIndex,
      start: windowIndex * 2,
      duration: 2.5,
      score: 1 - (sourceIndex * 0.08) - (windowIndex * 0.01),
      reasons: ["test-candidate"],
      productVisibility: 0.8,
      confidence: 0.9,
      sourceWidth: 1920,
      sourceHeight: 1080,
      sourceOrientation: "landscape",
      sourceDuration: windowsPerSource * 2 + 0.5,
    }))
  )).flat();
}

test("planner guarantees balanced coverage across three uploaded videos", () => {
  const plan = buildEditPlan({
    candidates: candidatesForSources(3),
    highlight: "general",
    targetContentDuration: 12,
    options: {
      sourceKind: "generated_video",
      remixMode: "recreate",
      preserveSourceSequence: false,
      useAllUploadedVideos: true,
      inputSourceCount: 3,
      beatSync: false,
    },
  });

  validatePlan(plan);
  const sourceCounts = [0, 1, 2].map((sourceIndex) => (
    plan.shots.filter((shot) => shot.sourceIndex === sourceIndex).length
  ));
  assert.ok(sourceCounts.every((count) => count > 0));
  assert.ok(Math.max(...sourceCounts) - Math.min(...sourceCounts) <= 1);
  assert.deepEqual(new Set(plan.shots.map((shot) => shot.sourceIndex)), new Set([0, 1, 2]));
  assert.ok(plan.shots.some((shot, index) => index > 0 && shot.sourceIndex < plan.shots[index - 1].sourceIndex));
});

test("chronological re-edit keeps upload order while retaining every source", () => {
  const plan = buildEditPlan({
    candidates: candidatesForSources(3),
    highlight: "general",
    options: {
      sourceKind: "generated_video",
      remixMode: "re_edit",
      preserveSourceSequence: true,
      useAllUploadedVideos: true,
      inputSourceCount: 3,
      beatSync: false,
    },
  });

  const ordering = plan.shots.map((shot) => [shot.sourceIndex, shot.start]);
  assert.deepEqual(ordering, [...ordering].sort((a, b) => a[0] - b[0] || a[1] - b[1]));
  assert.deepEqual(new Set(plan.shots.map((shot) => shot.sourceIndex)), new Set([0, 1, 2]));
  validatePlan(plan);
});

test("single-source recreate forces a non-chronological sequence", () => {
  const plan = buildEditPlan({
    candidates: candidatesForSources(1, 7),
    highlight: "general",
    options: {
      sourceKind: "generated_video",
      remixMode: "recreate",
      preserveSourceSequence: false,
      useAllUploadedVideos: true,
      inputSourceCount: 1,
      beatSync: false,
    },
  });
  validatePlan(plan);
  const starts = plan.shots.map((shot) => shot.start);
  assert.notDeepEqual(starts, [...starts].sort((a, b) => a - b));
  assert.ok(plan.targetContentDuration < 7 * 2 + 0.5);
});

test("planner fails visibly when an uploaded video has no usable candidate", () => {
  assert.throws(() => buildEditPlan({
    candidates: candidatesForSources(2),
    highlight: "general",
    options: { useAllUploadedVideos: true, inputSourceCount: 3 },
  }), /Uploaded video\(s\) 3 produced no usable clips/);
});
