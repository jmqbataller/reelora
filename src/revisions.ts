import type { CandidateSegment, EditPlan, RevisionInstruction } from "./types.js";

function overlapsWindow(candidate: CandidateSegment, sourceIndex: number, start: number, end: number): boolean {
  if (candidate.sourceIndex !== sourceIndex) return false;
  const candidateEnd = candidate.start + candidate.duration;
  return Math.max(candidate.start, start) < Math.min(candidateEnd, end);
}

export function applyRevisionInstructions(plan: EditPlan, instructions: RevisionInstruction[], candidates: CandidateSegment[] = []): EditPlan {
  const next: EditPlan = { ...plan, shots: plan.shots.map((shot) => ({ ...shot })) };

  for (const instruction of instructions) {
    if (instruction.action === "lock_shot" && instruction.shotIndex !== undefined && next.shots[instruction.shotIndex]) {
      next.shots[instruction.shotIndex].locked = true;
      continue;
    }
    if (instruction.action === "unlock_shot" && instruction.shotIndex !== undefined && next.shots[instruction.shotIndex]) {
      next.shots[instruction.shotIndex].locked = false;
      continue;
    }
    if (instruction.action === "replace_shot" && instruction.shotIndex !== undefined && next.shots[instruction.shotIndex]) {
      const existing = next.shots[instruction.shotIndex];
      const replacement = candidates.find((candidate) => {
        if (instruction.replacementSourceIndex !== undefined && candidate.sourceIndex !== instruction.replacementSourceIndex) return false;
        if (instruction.replacementStart !== undefined && Math.abs(candidate.start - instruction.replacementStart) > 0.75) return false;
        return candidate.duration >= existing.targetDuration;
      });
      if (replacement) next.shots[instruction.shotIndex] = { ...existing, ...replacement, targetDuration: existing.targetDuration, locked: existing.locked };
      continue;
    }
    if (instruction.action === "blacklist_source_window" && instruction.sourceIndex !== undefined && instruction.start !== undefined && instruction.end !== undefined) {
      next.shots = next.shots.filter((shot) => shot.locked || !overlapsWindow(shot, instruction.sourceIndex!, instruction.start!, instruction.end!));
      continue;
    }
    if (instruction.action === "favorite_source_window" && instruction.sourceIndex !== undefined && instruction.start !== undefined) {
      const favorite = candidates.find((candidate) => candidate.sourceIndex === instruction.sourceIndex && Math.abs(candidate.start - instruction.start!) <= 0.75);
      if (favorite) {
        const replaceIndex = next.shots.findIndex((shot) => !shot.locked);
        if (replaceIndex >= 0) {
          const existing = next.shots[replaceIndex];
          next.shots[replaceIndex] = { ...existing, ...favorite, targetDuration: Math.min(existing.targetDuration, favorite.duration) };
        }
      }
      continue;
    }
    if (instruction.action === "edit_region" && instruction.start !== undefined && instruction.end !== undefined) {
      let cursor = 0;
      next.shots = next.shots.map((shot) => {
        const shotStart = cursor;
        const shotEnd = cursor + shot.targetDuration;
        cursor = shotEnd;
        return shotEnd <= instruction.start! || shotStart >= instruction.end! ? { ...shot, locked: true } : shot;
      });
    }
  }

  next.targetContentDuration = Number(next.shots.reduce((sum, shot) => sum + shot.targetDuration, 0).toFixed(3));
  return next;
}
