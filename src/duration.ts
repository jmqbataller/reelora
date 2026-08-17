export interface DurationRequest {
  targetDuration?: number;
  minDuration?: number;
  maxDuration?: number;
}

export interface ResolvedDurationRequest {
  targetDuration?: number;
  minDuration?: number;
  maxDuration?: number;
  hasRange: boolean;
}

const MIN_ALLOWED_SECONDS = 6;
const MAX_ALLOWED_SECONDS = 45;

function validateDuration(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be a finite number.`);
  if (value < MIN_ALLOWED_SECONDS || value > MAX_ALLOWED_SECONDS) {
    throw new Error(`${label} must be between ${MIN_ALLOWED_SECONDS} and ${MAX_ALLOWED_SECONDS} seconds.`);
  }
  return value;
}

export function resolveDurationRequest(request: DurationRequest): ResolvedDurationRequest {
  const exact = request.targetDuration === undefined
    ? undefined
    : validateDuration(request.targetDuration, "targetDuration");
  const min = request.minDuration === undefined
    ? undefined
    : validateDuration(request.minDuration, "minDuration");
  const max = request.maxDuration === undefined
    ? undefined
    : validateDuration(request.maxDuration, "maxDuration");

  if (min !== undefined && max !== undefined && min > max) {
    throw new Error("minDuration cannot be greater than maxDuration.");
  }

  const lower = min ?? max ?? exact;
  const upper = max ?? min ?? exact;

  if (exact !== undefined && lower !== undefined && upper !== undefined && (exact < lower || exact > upper)) {
    throw new Error("targetDuration must fall inside the requested duration range.");
  }

  if (exact !== undefined) {
    return {
      targetDuration: exact,
      minDuration: lower,
      maxDuration: upper,
      hasRange: lower !== undefined && upper !== undefined && lower !== upper,
    };
  }

  if (lower === undefined || upper === undefined) {
    return { targetDuration: undefined, minDuration: undefined, maxDuration: undefined, hasRange: false };
  }

  return {
    targetDuration: Number(((lower + upper) / 2).toFixed(3)),
    minDuration: lower,
    maxDuration: upper,
    hasRange: lower !== upper,
  };
}

export function durationWithinRequestedRange(
  duration: number,
  resolved: Pick<ResolvedDurationRequest, "minDuration" | "maxDuration">,
  toleranceSeconds = 0.08,
): boolean {
  if (!Number.isFinite(duration)) return false;
  const min = resolved.minDuration;
  const max = resolved.maxDuration;
  if (min !== undefined && duration < min - toleranceSeconds) return false;
  if (max !== undefined && duration > max + toleranceSeconds) return false;
  return true;
}
