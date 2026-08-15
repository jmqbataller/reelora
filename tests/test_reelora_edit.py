import importlib.util
import pathlib
import unittest


MODULE_PATH = pathlib.Path(__file__).resolve().parents[1] / "skill" / "scripts" / "reelora_edit.py"
SPEC = importlib.util.spec_from_file_location("reelora_edit", MODULE_PATH)
reelora_edit = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(reelora_edit)


class PremiumEffectsTests(unittest.TestCase):
    def test_catalog_has_non_generic_effect_families(self):
        self.assertIn("liquid-splash", reelora_edit.PREMIUM_TRANSITIONS)
        prohibited = ("smoothleft", "smoothright", "slide", "bounce", "swing")
        for name, _, label in reelora_edit.PREMIUM_TRANSITIONS.values():
            self.assertFalse(any(term in name.lower() or term in label.lower() for term in prohibited))

    def test_premium_transition_is_sparse_and_deterministic(self):
        first = reelora_edit.transition_spec("fashion", 3)
        second = reelora_edit.transition_spec("fashion", 3)
        self.assertEqual(first, second)
        self.assertTrue(first[4])
        self.assertNotEqual(first[3], "beat-cut")
        self.assertFalse(reelora_edit.transition_spec("fashion", 2)[4])

    def test_explicit_family_allowlist_is_honored(self):
        selected = reelora_edit.transition_spec("fashion", 3, families=["liquid-splash"])
        self.assertEqual(selected[3], "liquid-splash")
        self.assertEqual(selected[0], "radial")

    def test_outro_uses_preservation_safe_dip(self):
        result = reelora_edit.transition_spec("fashion", 8, outro=True)
        self.assertEqual(result[0], "fadeblack")
        self.assertEqual(result[3], "outro-safe-dip")
        self.assertFalse(result[4])

    def test_animation_effects_can_be_disabled(self):
        self.assertEqual(reelora_edit.animation_spec("fashion", 1, True)[0], "kinetic-product-arc")
        self.assertEqual(reelora_edit.animation_spec("fashion", 1, False)[0], "locked-static-frame")

    def test_landscape_auto_reframe_preserves_full_frame_without_stretching(self):
        self.assertEqual(reelora_edit.resolve_reframe_mode(1920, 1080, "auto"), "blur_fill")
        self.assertEqual(reelora_edit.resolve_reframe_mode(1920, 1080, "auto", True), "smart_crop")
        self.assertEqual(reelora_edit.resolve_reframe_mode(1080, 1920, "auto"), "native_portrait")

    def test_ai_video_reedit_windows_preserve_chronological_order(self):
        scenes = [[2.0, 4.0, 6.0, 8.0, 10.0, 12.0, 14.0, 16.0, 18.0]]
        windows = reelora_edit.source_windows(["generated.mp4"], [20.0], 8, "re_edit", scenes)
        starts = [start for _, start, _, _ in windows]
        self.assertEqual(starts, sorted(starts))
        self.assertEqual(len(starts), 8)
        recreated = reelora_edit.source_windows(["generated.mp4"], [20.0], 8, "recreate", scenes)
        recreated_starts = [start for _, start, _, _ in recreated]
        self.assertNotEqual(recreated_starts, sorted(recreated_starts))

    def test_multi_source_remix_uses_every_uploaded_video_balanced(self):
        windows = reelora_edit.source_windows(
            ["one.mp4", "two.mp4", "three.mp4"],
            [12.0, 16.0, 20.0],
            10,
            "re_edit",
        )
        source_indices = [source_index for _, _, source_index, _ in windows]
        self.assertEqual(set(source_indices), {0, 1, 2})
        counts = [source_indices.count(index) for index in range(3)]
        self.assertLessEqual(max(counts) - min(counts), 1)
        for source_index in range(3):
            starts = [start for _, start, index, _ in windows if index == source_index]
            self.assertEqual(starts, sorted(starts))

    def test_raw_multi_source_windows_use_every_upload(self):
        windows = reelora_edit.source_windows(["one.mp4", "two.mp4", "three.mp4"], [10.0] * 3, 8)
        self.assertEqual({source_index for _, _, source_index, _ in windows}, {0, 1, 2})

    def test_scene_windows_trim_original_cut_edges(self):
        segments = reelora_edit.scene_segments(10.0, [1.5, 3.0, 4.5, 6.1, 7.6, 9.2], 4)
        self.assertGreaterEqual(len(segments), 6)
        starts = [start for start, _ in segments]
        self.assertNotIn(1.5, starts)
        self.assertTrue(all(start > 0 for start in starts))


if __name__ == "__main__":
    unittest.main()
