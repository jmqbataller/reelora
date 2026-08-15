import type {
  EditPlan,
  EditingStyle,
  PlannedShot,
  PremiumTransitionFamily,
  ShotType,
  TransitionIntensity,
} from "./types.js";

export interface TransitionSpec {
  name: string;
  duration: number;
  label: string;
  family: PremiumTransitionFamily | "beat-cut" | "short-fade" | "outro-safe-dip";
  premium: boolean;
  accent: "none" | "soft-lift" | "focus-bloom";
}

export interface PremiumTransitionDefinition {
  family: PremiumTransitionFamily;
  name: string;
  duration: number;
  label: string;
  accent: TransitionSpec["accent"];
  description: string;
}

export interface AnimationSpec {
  enabled: boolean;
  label: string;
  overscan: number;
  xAmplitude: number;
  yAmplitude: number;
  xFrequency: number;
  yFrequency: number;
  phase: number;
}

/**
 * Every family maps to an FFmpeg-native real-pixel transition. No generated
 * overlays, replacement subjects, or synthetic product pixels are introduced.
 */
export const PREMIUM_TRANSITION_CATALOG: Record<PremiumTransitionFamily, PremiumTransitionDefinition> = {
  "liquid-splash": {
    family: "liquid-splash",
    name: "radial",
    duration: 0.24,
    label: "liquid-splash-ripple",
    accent: "focus-bloom",
    description: "A fast radial ripple that feels like a liquid splash opening around the product.",
  },
  "ink-bloom": {
    family: "ink-bloom",
    name: "circleopen",
    duration: 0.22,
    label: "ink-bloom-matte",
    accent: "none",
    description: "An organic center bloom inspired by ink spreading through paper.",
  },
  "prism-refraction": {
    family: "prism-refraction",
    name: "hblur",
    duration: 0.17,
    label: "prism-refraction-bridge",
    accent: "soft-lift",
    description: "A short optical refraction bridge without a directional slide.",
  },
  "particle-crystallize": {
    family: "particle-crystallize",
    name: "pixelize",
    duration: 0.15,
    label: "particle-crystallize-resolve",
    accent: "none",
    description: "A compact crystalline particle resolve used only on a strong beat.",
  },
  "light-sweep": {
    family: "light-sweep",
    name: "diagtl",
    duration: 0.14,
    label: "cinematic-light-sweep",
    accent: "soft-lift",
    description: "A quick diagonal light-energy reveal rather than a flat wipe.",
  },
  "glass-ripple": {
    family: "glass-ripple",
    name: "circleclose",
    duration: 0.2,
    label: "glass-ripple-collapse",
    accent: "focus-bloom",
    description: "A lens-like glass ripple that collapses into the next real frame.",
  },
  "silk-fold": {
    family: "silk-fold",
    name: "squeezeh",
    duration: 0.18,
    label: "silk-fold-reveal",
    accent: "none",
    description: "A fabric-inspired fold reveal suited to apparel and luxury shots.",
  },
  "luma-bloom": {
    family: "luma-bloom",
    name: "dissolve",
    duration: 0.16,
    label: "luma-bloom-resolve",
    accent: "soft-lift",
    description: "A short luminance-style bloom that resolves without a long dissolve.",
  },
};

const STYLE_POOLS: Record<EditingStyle, PremiumTransitionFamily[]> = {
  premium: ["liquid-splash", "prism-refraction", "light-sweep", "glass-ripple", "luma-bloom"],
  minimal: ["prism-refraction", "light-sweep", "luma-bloom"],
  fashion: ["liquid-splash", "ink-bloom", "particle-crystallize", "prism-refraction", "silk-fold"],
  fast_ecommerce: ["liquid-splash", "particle-crystallize", "light-sweep", "prism-refraction"],
  cinematic: ["ink-bloom", "glass-ripple", "prism-refraction", "luma-bloom"],
  luxury: ["silk-fold", "glass-ripple", "ink-bloom", "luma-bloom"],
  clean_commercial: ["light-sweep", "prism-refraction", "liquid-splash", "luma-bloom"],
};

function baseTransition(transition: PlannedShot["transition"]): TransitionSpec {
  if (transition === "cut") return { name: "fade", duration: 0.025, label: "beat-cut", family: "beat-cut", premium: false, accent: "none" };
  if (transition === "motion") return { name: "hblur", duration: 0.1, label: "optical-focus-bridge", family: "short-fade", premium: false, accent: "none" };
  if (transition === "dissolve") return { name: "fadeblack", duration: 0.075, label: "micro-dip", family: "short-fade", premium: false, accent: "none" };
  return { name: "fade", duration: 0.05, label: "short-fade", family: "short-fade", premium: false, accent: "none" };
}

function transitionPool(plan: EditPlan, transition: PlannedShot["transition"]): PremiumTransitionFamily[] {
  const configured = plan.options.transitionFamilies?.filter((family) => Boolean(PREMIUM_TRANSITION_CATALOG[family])) ?? [];
  const stylePool = configured.length ? configured : STYLE_POOLS[plan.options.style];
  const preferred = transition === "dissolve"
    ? stylePool.filter((family) => ["ink-bloom", "glass-ripple", "silk-fold", "luma-bloom"].includes(family))
    : transition === "fade"
      ? stylePool.filter((family) => ["light-sweep", "prism-refraction", "luma-bloom"].includes(family))
      : stylePool;
  return preferred.length ? preferred : stylePool;
}

function durationScale(intensity: TransitionIntensity | undefined): number {
  if (intensity === "subtle") return 0.76;
  if (intensity === "bold") return 1.2;
  return 1;
}

export function premiumTransitionSpec(
  plan: EditPlan,
  transition: PlannedShot["transition"],
  index: number,
  baseDuration: number,
): TransitionSpec {
  if (index >= plan.shots.length) {
    return { name: "fadeblack", duration: 0.11, label: "outro-safe-dip", family: "outro-safe-dip", premium: false, accent: "none" };
  }
  if (transition === "cut" || plan.options.smartTransitions === false) return baseTransition("cut");
  if (plan.options.premiumTransitionEffects === false) return baseTransition(transition);

  const pool = transitionPool(plan, transition);
  const family = pool[(index * 3 + plan.shots.length) % pool.length];
  const definition = PREMIUM_TRANSITION_CATALOG[family];
  const styleScale = Math.max(0.82, Math.min(1.12, baseDuration / 0.16));
  const duration = Math.max(0.1, Math.min(0.34, definition.duration * durationScale(plan.options.transitionIntensity) * styleScale));
  return {
    name: definition.name,
    duration,
    label: definition.label,
    family,
    premium: true,
    accent: definition.accent,
  };
}

export function premiumAnimationSpec(plan: EditPlan, shotType: ShotType, index: number): AnimationSpec {
  const intensity = plan.options.animationIntensity ?? "subtle";
  if (plan.options.premiumAnimationEffects === false || intensity === "off" || plan.options.dynamicSubjectTracking === false) {
    return { enabled: false, label: "locked-static-frame", overscan: 0, xAmplitude: 0, yAmplitude: 0, xFrequency: 0, yFrequency: 0, phase: 0 };
  }

  const strength = intensity === "balanced" ? 1 : 0.68;
  const phase = Number((index * 0.73).toFixed(3));
  if (shotType === "detail") {
    return { enabled: true, label: "macro-orbit-drift", overscan: 0.032 * strength, xAmplitude: 9 * strength, yAmplitude: 6 * strength, xFrequency: 0.34, yFrequency: 0.27, phase };
  }
  if (shotType === "whole_body") {
    return { enabled: true, label: "editorial-depth-float", overscan: 0.012 * strength, xAmplitude: 3.5 * strength, yAmplitude: 4.5 * strength, xFrequency: 0.24, yFrequency: 0.19, phase };
  }
  if (index % 4 === 0) {
    return { enabled: true, label: "hero-frame-breathe", overscan: 0.01 * strength, xAmplitude: 2 * strength, yAmplitude: 1.5 * strength, xFrequency: 0.2, yFrequency: 0.16, phase };
  }
  if (plan.options.style === "fashion" || plan.options.style === "fast_ecommerce") {
    return { enabled: true, label: "kinetic-product-arc", overscan: 0.022 * strength, xAmplitude: 8 * strength, yAmplitude: 4 * strength, xFrequency: 0.42, yFrequency: 0.31, phase };
  }
  if (plan.options.style === "luxury" || plan.options.style === "cinematic") {
    return { enabled: true, label: "silk-camera-float", overscan: 0.016 * strength, xAmplitude: 4 * strength, yAmplitude: 3 * strength, xFrequency: 0.22, yFrequency: 0.18, phase };
  }
  return { enabled: true, label: "product-parallax-orbit", overscan: 0.018 * strength, xAmplitude: 6 * strength, yAmplitude: 3.5 * strength, xFrequency: 0.3, yFrequency: 0.24, phase };
}

