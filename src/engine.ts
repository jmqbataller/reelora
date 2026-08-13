import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { analyzeSources } from "./analyze.js";
import { assertFfmpegAvailable } from "./ffmpeg.js";
import { materializeMedia, safeOutputName } from "./media.js";
import { buildEditPlan } from "./planner.js";
import { renderPlan } from "./render.js";
import { validatePlan, validateRenderedOutput } from "./validation.js";
import type { AudioMode, HighlightIntent } from "./types.js";

export interface EditRequest {
  rawVideos: string[];
  outroVideo: string;
  music?: string;
  highlight: HighlightIntent;
  targetDuration?: number;
  outputName?: string;
  audioMode?: AudioMode;
}

export interface AnalyzeRequest {
  rawVideos: string[];
}

export function reeloraDataDir(): string {
  return path.resolve(process.env.REELORA_DATA_DIR ?? ".reelora");
}

export async function analyzeReeloraRequest(request: AnalyzeRequest) {
  if (!request.rawVideos.length) throw new Error("At least one raw video is required.");
  await assertFfmpegAvailable();

  const dataDir = reeloraDataDir();
  const inputDir = path.join(dataDir, "inputs", crypto.randomUUID());
  await mkdir(inputDir, { recursive: true });

  try {
    const rawPaths: string[] = [];
    for (let i = 0; i < request.rawVideos.length; i += 1) {
      rawPaths.push(await materializeMedia(request.rawVideos[i], inputDir, `raw-${i + 1}`));
    }
    const analysis = await analyzeSources(rawPaths);
    return {
      media: analysis.media,
      candidateCount: analysis.candidates.length,
      topCandidates: analysis.candidates.slice(0, 20),
    };
  } finally {
    await rm(inputDir, { recursive: true, force: true });
  }
}

export async function editReel(request: EditRequest) {
  if (!request.rawVideos.length) throw new Error("At least one raw video is required.");
  await assertFfmpegAvailable();

  const dataDir = reeloraDataDir();
  const inputDir = path.join(dataDir, "inputs", crypto.randomUUID());
  const outputsDir = path.join(dataDir, "outputs");
  await mkdir(inputDir, { recursive: true });
  await mkdir(outputsDir, { recursive: true });

  try {
    const rawPaths: string[] = [];
    for (let i = 0; i < request.rawVideos.length; i += 1) {
      rawPaths.push(await materializeMedia(request.rawVideos[i], inputDir, `raw-${i + 1}`));
    }
    const outroPath = await materializeMedia(request.outroVideo, inputDir, "outro");
    const musicPath = request.music ? await materializeMedia(request.music, inputDir, "music") : undefined;

    const analysis = await analyzeSources(rawPaths);
    const plan = buildEditPlan({
      candidates: analysis.candidates,
      outroPath,
      musicPath,
      highlight: request.highlight,
      targetContentDuration: request.targetDuration,
      audioMode: request.audioMode,
    });
    validatePlan(plan);

    const outputName = safeOutputName(request.outputName ?? `reelora-${Date.now()}.mp4`);
    const outputPath = path.join(outputsDir, outputName);
    const render = await renderPlan(plan, outputPath, dataDir);
    await validateRenderedOutput(outputPath);

    const publicBaseUrl = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
    return {
      ...render,
      outputName,
      outputUrl: publicBaseUrl ? `${publicBaseUrl}/outputs/${encodeURIComponent(outputName)}` : undefined,
      plan: {
        highlight: plan.highlight,
        targetContentDuration: plan.targetContentDuration,
        distribution: plan.distribution,
        shots: plan.shots.map((shot) => ({
          sourceIndex: shot.sourceIndex,
          start: shot.start,
          duration: shot.targetDuration,
          shotType: shot.shotType,
          score: shot.score,
        })),
      },
    };
  } finally {
    await rm(inputDir, { recursive: true, force: true });
  }
}
