import assert from "node:assert/strict";
import test from "node:test";
import {
  PREMIUM_TRANSITION_CATALOG,
  premiumAnimationSpec,
  premiumTransitionSpec,
} from "../dist/transitions.js";

function plan(overrides = {}) {
  return {
    shots: Array.from({ length: 8 }, (_, index) => ({ index, transition: index ? "motion" : "cut" })),
    options: {
      style: "fashion",
      smartTransitions: true,
      premiumTransitionEffects: true,
      transitionIntensity: "balanced",
      premiumAnimationEffects: true,
      animationIntensity: "subtle",
      dynamicSubjectTracking: true,
      ...overrides,
    },
  };
}

test("premium catalog avoids generic swing/slide/bounce transitions", () => {
  const prohibited = /swing|slide|bounce|smoothleft|smoothright/i;
  for (const definition of Object.values(PREMIUM_TRANSITION_CATALOG)) {
    assert.doesNotMatch(definition.name, prohibited);
    assert.doesNotMatch(definition.label, prohibited);
    assert.ok(definition.duration >= 0.14 && definition.duration <= 0.24);
  }
});

test("motion transitions select a premium family deterministically", () => {
  const first = premiumTransitionSpec(plan(), "motion", 4, 0.14);
  const second = premiumTransitionSpec(plan(), "motion", 4, 0.14);
  assert.deepEqual(first, second);
  assert.equal(first.premium, true);
  assert.ok(first.family in PREMIUM_TRANSITION_CATALOG);
  assert.ok(first.duration >= 0.1 && first.duration <= 0.34);
});

test("family allowlist and intensity are honored", () => {
  const selected = premiumTransitionSpec(
    plan({ transitionFamilies: ["liquid-splash"], transitionIntensity: "bold" }),
    "motion",
    3,
    0.16,
  );
  assert.equal(selected.family, "liquid-splash");
  assert.equal(selected.name, "radial");
  assert.ok(selected.duration > PREMIUM_TRANSITION_CATALOG["liquid-splash"].duration);
});

test("clean cuts and supplied outro remain conservative", () => {
  assert.equal(premiumTransitionSpec(plan(), "cut", 2, 0.16).family, "beat-cut");
  assert.equal(premiumTransitionSpec(plan(), "motion", 8, 0.16).family, "outro-safe-dip");
});

test("premium animations use real-pixel spatial motion and can be disabled", () => {
  const active = premiumAnimationSpec(plan(), "detail", 2);
  assert.equal(active.enabled, true);
  assert.equal(active.label, "macro-orbit-drift");
  assert.ok(active.overscan > 0);

  const disabled = premiumAnimationSpec(plan({ premiumAnimationEffects: false }), "focus", 1);
  assert.equal(disabled.enabled, false);
  assert.equal(disabled.overscan, 0);
});

