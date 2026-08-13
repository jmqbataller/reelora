import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { probeMedia, runFfmpeg } from "./ffmpeg.js";
import type { EditPlan, PlannedShot, RenderResult } from "./types.js";

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const XFADE = 0.18;

function shotFilter(shot: PlannedShot, index: number, total: number): string {
  const fadeIn = index === 0 ? `,fade=t=in:st=0:d=0.22` : "";
  const fadeOut = index === total - 1 && shot.targetDuration > 0.3
    ? `,fade=t=out:st=${Math.max(0, shot.targetDuration - 0.22).toFixed(3)}:d=0.22`
    : "";

  if (shot.shotType === "whole_body") {
    return `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT}:x='max(0\\,min(iw-${WIDTH}\\,(iw-${WIDTH})/2+sin(t*0.65)*8))':y='max(0\\,min(ih-${HEIGHT}\\,(ih-${HEIGHT})/2))',fps=${FPS}${fadeIn}${fadeOut}`;
  }

  if (shot.shotType === "detail") {
    return `scale=1240:2205:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT}:x='max(0\\,min(iw-${WIDTH}\\,(iw-${WIDTH})/2+sin(t*0.75)*10))':y='max(0\\,min(ih-${HEIGHT}\\,(ih-${HEIGHT})*0.16))',fps=${FPS}${fadeIn}${fadeOut}`;
  }

  // Product-focus crop: deliberately upper-biased for top-wear while retaining real source pixels only.
  return `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT}:x='max(0\\,min(iw-${WIDTH}\\,(iw-${WIDTH})/2+sin(t*0.7)*10))':y='max(0\\,min(ih-${HEIGHT}\\,(ih-${HEIGHT})*0.18))',fps=${FPS}${fadeIn}${fadeOut}`;
}

async function renderShot(shot: PlannedShot, index: number, total: number, workDir: string): Promise<string> {
  const output = path.join(workDir, `shot-${String(index).padStart(2, "0")}.mp4`);
  await runFfmpeg([
    "-y",
    "-ss",
    shot.start.toFixed(3),
    "-t",
    shot.targetDuration.toFixed(3),
    "-i",
    shot.sourcePath,
    "-vf",
    shotFilter(shot, index, total),
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    output,
  ]);
  return output;
}

async function renderOutro(outroPath: string, workDir: string): Promise<{ path: string; duration: number }> {
  const info = await probeMedia(outroPath);
  const output = path.join(workDir, "outro.mp4");
  await runFfmpeg([
    "-y",
    "-i",
    outroPath,
    "-vf",
    `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease,pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2:black,fps=${FPS}`,
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    output,
  ]);
  return { path: output, duration: info.duration };
}

function xfadeGraph(durations: number[]): { graph: string; label: string } {
  if (durations.length === 1) return { graph: "", label: "0:v" };

  const filters: string[] = [];
  let previous = "0:v";
  let timeline = durations[0];

  for (let i = 1; i < durations.length; i += 1) {
    const label = `v${i}`;
    const offset = Math.max(0.01, timeline - XFADE * i);
    filters.push(`[${previous}][${i}:v]xfade=transition=fade:duration=${XFADE}:offset=${offset.toFixed(3)}[${label}]`);
    previous = label;
    timeline += durations[i];
  }

  return { graph: filters.join(";"), label: previous };
}

async function combineVideo(parts: string[], durations: number[], output: string): Promise<void> {
  if (parts.length === 1) {
    await runFfmpeg(["-y", "-i", parts[0], "-c", "copy", output]);
    return;
  }

  const inputs = parts.flatMap((part) => ["-i", part]);
  const { graph, label } = xfadeGraph(durations);
  await runFfmpeg([
    "-y",
    ...inputs,
    "-filter_complex",
    graph,
    "-map",
    `[${label}]`,
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    output,
  ]);
}

async function addMusic(videoPath: string, musicPath: string, outputPath: string): Promise<void> {
  const info = await probeMedia(videoPath);
  const fadeOutStart = Math.max(0, info.duration - 0.55);
  await runFfmpeg([
    "-y",
    "-i",
    videoPath,
    "-stream_loop",
    "-1",
    "-i",
    musicPath,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0?",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-af",
    `afade=t=in:st=0:d=0.3,afade=t=out:st=${fadeOutStart.toFixed(3)}:d=0.5`,
    "-t",
    info.duration.toFixed(3),
    "-movflags",
    "+faststart",
    outputPath,
  ]);
}

export async function renderPlan(plan: EditPlan, outputPath: string, dataDir: string): Promise<RenderResult> {
  const warnings: string[] = [];
  const workDir = path.join(dataDir, "jobs", crypto.randomUUID());
  await mkdir(workDir, { recursive: true });
  await mkdir(path.dirname(outputPath), { recursive: true });

  try {
    const renderedShots: string[] = [];
    for (let i = 0; i < plan.shots.length; i += 1) {
      renderedShots.push(await renderShot(plan.shots[i], i, plan.shots.length, workDir));
    }

    const outro = await renderOutro(plan.outroPath, workDir);
    const parts = [...renderedShots, outro.path];
    const durations = [...plan.shots.map((shot) => shot.targetDuration), outro.duration];
    const silentCombined = path.join(workDir, "combined-silent.mp4");
    await combineVideo(parts, durations, silentCombined);

    if (plan.musicPath) {
      await addMusic(silentCombined, plan.musicPath, outputPath);
    } else {
      await runFfmpeg(["-y", "-i", silentCombined, "-c", "copy", outputPath]);
      if (plan.audioMode === "original") {
        warnings.push("v0.1 renders preservation-first video without source dialogue/audio unless a music file is supplied. Original-audio mixing is intentionally deferred rather than risking broken crossfades.");
      }
    }

    const finalInfo = await probeMedia(outputPath);
    return {
      outputPath,
      durationEstimate: finalInfo.duration,
      shotsRendered: plan.shots.length,
      warnings,
    };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
