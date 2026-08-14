import type { EditPlan, PlannedShot } from "./types.js";

export interface TransitionSpec {
  name: string;
  duration: number;
  label: string;
}

function baseTransition(transition: PlannedShot["transition"]): TransitionSpec {
  if (transition === "cut") return { name: "fade", duration: 0.025, label: "beat-cut" };
  if (transition === "motion") return { name: "smoothleft", duration: 0.085, label: "micro-motion" };
  if (transition === "dissolve") return { name: "fadeblack", duration: 0.07, label: "micro-dip" };
  return { name: "fade", duration: 0.055, label: "short-fade" };
}

export function premiumTransitionSpec(
  plan: EditPlan,
  transition: PlannedShot["transition"],
  index: number,
  _baseDuration: number,
): TransitionSpec {
  if (transition === "cut" || plan.options.smartTransitions === false) return baseTransition(transition);

  const style = plan.options.style;

  if (style === "fashion" || style === "fast_ecommerce") {
    if (transition === "motion") {
      const name = index % 2 === 0 ? "smoothleft" : "smoothright";
      return { name, duration: 0.085, label: `fashion-micro-${name}` };
    }
    if (transition === "dissolve") return { name: "fadeblack", duration: 0.065, label: "fashion-micro-dip" };
    return { name: "fade", duration: 0.045, label: "fashion-short-fade" };
  }

  if (style === "luxury") {
    if (transition === "motion") return { name: index % 2 ? "smoothleft" : "smoothright", duration: 0.09, label: "luxury-micro-motion" };
    return { name: "fadeblack", duration: 0.08, label: "luxury-soft-dip" };
  }

  if (style === "cinematic") {
    if (transition === "motion") return { name: "smoothleft", duration: 0.1, label: "cinematic-micro-motion" };
    return { name: "fadeblack", duration: 0.09, label: "cinematic-short-dip" };
  }

  if (style === "minimal") return { name: "fade", duration: 0.05, label: "minimal-short-fade" };

  if (transition === "motion") {
    const name = index % 2 ? "smoothleft" : "smoothright";
    return { name, duration: 0.075, label: `premium-micro-${name}` };
  }
  if (transition === "dissolve") return { name: "fadeblack", duration: 0.07, label: "premium-micro-dip" };
  return { name: "fade", duration: 0.045, label: "premium-short-fade" };
}
