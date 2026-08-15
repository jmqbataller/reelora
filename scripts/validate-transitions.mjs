import { spawnSync } from "node:child_process";
import { PREMIUM_TRANSITION_CATALOG } from "../dist/transitions.js";

const unique = [...new Set(Object.values(PREMIUM_TRANSITION_CATALOG).map((item) => item.name))];
for (const transition of unique) {
  const result = spawnSync(
    "ffmpeg",
    [
      "-hide_banner", "-loglevel", "error",
      "-f", "lavfi", "-i", "color=c=red:s=64x64:d=0.6:r=30",
      "-f", "lavfi", "-i", "color=c=blue:s=64x64:d=0.6:r=30",
      "-filter_complex", `[0:v][1:v]xfade=transition=${transition}:duration=0.15:offset=0.30`,
      "-frames:v", "18", "-f", "null", "-",
    ],
    { encoding: "utf8" },
  );
  if (result.error || result.status !== 0) {
    throw new Error(`FFmpeg transition '${transition}' is unavailable: ${result.stderr || result.error?.message}`);
  }
  console.log(`validated xfade transition: ${transition}`);
}

