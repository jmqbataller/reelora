import type { EditPlan, PlannedShot } from "./types.js";

export interface TransitionSpec {
  name: string;
  duration: number;
  label: string;
}

function baseTransition(transition: PlannedShot["transition"], baseDuration: number): TransitionSpec {
  if (transition === "cut") return { name: "fade", duration: 0.035, label: "clean-cut" };
  if (transition === "motion") return { name: "smoothleft", duration: Math.max(0.1, baseDuration), label: "smooth-motion" };
  if (transition === "dissolve") return { name: "dissolve", duration: Math.max(0.12, baseDuration), label: "dissolve" };
  return { name: "fade", duration: Math.max(0.1, baseDuration), label: "soft-fade" };
}

export function premiumTransitionSpec(
  plan: EditPlan,
  transition: PlannedShot["transition"],
  index: number,
  baseDuration: number,
): TransitionSpec {
  if (transition === "cut" || plan.options.smartTransitions === false) {
    return baseTransition(transition, baseDuration);
  }

  const style = plan.options.style;
  const premiumDuration = Math.max(0.14, Math.min(0.34, baseDuration));

  if (style === "luxury") {
    const names = transition === "motion"
      ? ["smoothleft", "smoothright"]
      : ["dissolve", "fadeblack", "dissolve"];
    const name = names[index % names.length];
    return { name, duration: Math.max(0.18, premiumDuration * 1.05), label: `luxury-${name}` };
  }

  if (style === "fashion") {
    const names = transition === "motion"
      ? ["smoothleft", "smoothright", "smoothup", "smoothdown"]
      : ["dissolve", "smoothleft", "fade", "smoothright"];
    const name = names[index % names.length];
    return { name, duration: premiumDuration, label: `fashion-${name}` };
  }

  if (style === "fast_ecommerce") {
    const names = ["smoothleft", "smoothright", "fade", "dissolve"];
    const name = names[index % names.length];
    return { name, duration: Math.max(0.1, premiumDuration * 0.72), label: `commerce-${name}` };
  }

  if (style === "cinematic") {
    const names = transition === "motion"
      ? ["smoothleft", "smoothright"]
      : ["fadeblack", "dissolve", "fade"];
    const name = names[index % names.length];
    return { name, duration: Math.max(0.2, premiumDuration * 1.12), label: `cinematic-${name}` };
  }

  if (style === "minimal") {
    const names = ["fade", "dissolve", "fade"];
    const name = names[index % names.length];
    return { name, duration: Math.max(0.12, premiumDuration * 0.82), label: `minimal-${name}` };
  }

  // premium + clean_commercial default: restrained, polished, and product-safe.
  const names = transition === "motion"
    ? ["smoothleft", "smoothright", "smoothleft"]
    : ["dissolve", "fade", "fadeblack", "dissolve"];
  const name = names[index % names.length];
  return { name, duration: premiumDuration, label: `premium-${name}` };
}
