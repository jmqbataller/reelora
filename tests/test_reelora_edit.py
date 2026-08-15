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
        windows = reelora_edit.source_windows(["generated.mp4"], [20.0], 8, "re_edit")
        starts = [start for _, start in windows]
        self.assertEqual(starts, sorted(starts))
        recreated = reelora_edit.source_windows(["generated.mp4"], [20.0], 8, "recreate")
        recreated_starts = [start for _, start in recreated]
        self.assertNotEqual(recreated_starts, sorted(recreated_starts))


if __name__ == "__main__":
    unittest.main()
