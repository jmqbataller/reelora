import assert from "node:assert/strict";
import test from "node:test";
import { detectSourceOrientation, resolveVerticalReframe } from "../dist/reframe.js";

test("detects landscape, portrait, and square inputs", () => {
  assert.equal(detectSourceOrientation(1920, 1080), "landscape");
  assert.equal(detectSourceOrientation(1080, 1920), "portrait");
  assert.equal(detectSourceOrientation(1080, 1080), "square");
});

test("auto landscape reframing uses tracked crop or preservation-safe blur fill", () => {
  assert.equal(resolveVerticalReframe({ width: 1920, height: 1080, requested: "auto", hasTrackedRegion: true }), "smart_crop");
  assert.equal(resolveVerticalReframe({ width: 1920, height: 1080, requested: "auto", hasTrackedRegion: false }), "blur_fill");
});

test("explicit modes are honored and portrait remains native", () => {
  assert.equal(resolveVerticalReframe({ width: 1920, height: 1080, requested: "smart_crop" }), "smart_crop");
  assert.equal(resolveVerticalReframe({ width: 1920, height: 1080, requested: "blur_fill" }), "blur_fill");
  assert.equal(resolveVerticalReframe({ width: 1080, height: 1920, requested: "blur_fill" }), "native_portrait");
});
