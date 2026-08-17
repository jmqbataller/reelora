import assert from "node:assert/strict";
import test from "node:test";
import { durationWithinRequestedRange, resolveDurationRequest } from "../dist/duration.js";

test("11-13 second request resolves to a 12 second first target", () => {
  assert.deepEqual(resolveDurationRequest({ minDuration: 11, maxDuration: 13 }), {
    targetDuration: 12,
    minDuration: 11,
    maxDuration: 13,
    hasRange: true,
  });
});

test("exact target can be combined with a containing range", () => {
  assert.deepEqual(resolveDurationRequest({ targetDuration: 12.5, minDuration: 11, maxDuration: 13 }), {
    targetDuration: 12.5,
    minDuration: 11,
    maxDuration: 13,
    hasRange: true,
  });
});

test("rejects an exact target outside the requested range", () => {
  assert.throws(
    () => resolveDurationRequest({ targetDuration: 14, minDuration: 11, maxDuration: 13 }),
    /targetDuration must fall inside/,
  );
});

test("rejects reversed duration ranges", () => {
  assert.throws(() => resolveDurationRequest({ minDuration: 13, maxDuration: 11 }), /minDuration cannot be greater/);
});

test("finished duration must be inside the hard requested range", () => {
  const requested = resolveDurationRequest({ minDuration: 11, maxDuration: 13 });
  assert.equal(durationWithinRequestedRange(12.02, requested), true);
  assert.equal(durationWithinRequestedRange(10.8, requested), false);
  assert.equal(durationWithinRequestedRange(13.2, requested), false);
});
