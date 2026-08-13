import { mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { probeMedia, runFfmpeg } from "./ffmpeg.js";
import { resolveEncoder } from "./hardware.js";
import { PLATFORM_PROFILES, STYLE_PROFILES } from "./profiles.js";
import { premiumTransitionSpec } from "./transitions.js";
import type { EditPlan, PlannedShot, RenderResult } from "./types.js";

function quoteAudit(value: string): string {
  return /\s/.test(value) ? JSON.stringify(value) : value;
}

async function runLogged(audit: string[], args: string[]): Promise<void> {
  audit.push(`ffmpeg ${args.map(quoteAudit).join(" ")}`);
  await runFfmpeg(args);
}

function normalizedCropPrefix(shot: PlannedShot): string {
  if (!shot.cropRegion || shot.shotType === "whole_body") return "";
  const region = shot.cropRegion;
  return `crop=w='iw*${region.width.toFixed(5)}':h='ih*${region.height.toFixed(5)}':x='iw*${region.x.toFixed(5)}':y='ih*${region.y.toFixed(5)}',`;
}

function shotFilter(plan: EditPlan, shot: PlannedShot, index: number, total: number): string {
  const platform = PLATFORM_PROFILES[plan.options.platform];
  const style = STYLE_PROFILES[plan.options.style];
  const width = platform.width;
  const height = platform.height;
  const fps = platform.fps;
  const motion = plan.options.dynamicSubjectTracking ? style.motionAmount : 0;
  const fadeIn = index === 0 ? `,fade=t=in:st=0:d=${style.openingFade}` : "";
  const fadeOut = index === total - 1 && shot.targetDuration > style.endingFade
    ? `,fade=t=out:st=${Math.max(0, shot.targetDuration - style.endingFade).toFixed(3)}:d=${style.endingFade}`
    : "";
  const speed = shot.playbackRate && shot.playbackRate !== 1 ? `,setpts=PTS/${shot.playbackRate.toFixed(3)}` : "";
  const cropPrefix = normalizedCropPrefix(shot);

  if (shot.shotType === "whole_body") {
    return `${cropPrefix}scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}:x='max(0\\,min(iw-${width}\\,(iw-${width})/2+sin(t*0.65)*${motion}))':y='max(0\\,min(ih-${height}\\,(ih-${height})/2))',fps=${fps}${speed}${fadeIn}${fadeOut}`;
  }

  if (shot.cropRegion) {
    return `${cropPrefix}scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}:x='max(0\\,min(iw-${width}\\,(iw-${width})/2+sin(t*0.7)*${motion}))':y='max(0\\,min(ih-${height}\\,(ih-${height})/2))',fps=${fps}${speed}${fadeIn}${fadeOut}`;
  }

  if (shot.shotType === "detail") {
    return `scale=${Math.round(width * 1.15)}:${Math.round(height * 1.15)}:force_original_aspect_ratio=increase,crop=${width}:${height}:x='max(0\\,min(iw-${width}\\,(iw-${width})/2+sin(t*0.75)*${motion + 2}))':y='max(0\\,min(ih-${height}\\,(ih-${height})*0.16))',fps=${fps}${speed}${fadeIn}${fadeOut}`;
  }

  return `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}:x='max(0\\,min(iw-${width}\\,(iw-${width})/2+sin(t*0.7)*${motion + 2}))':y='max(0\\,min(ih-${height}\\,(ih-${height})*0.18))',fps=${fps}${speed}${fadeIn}${fadeOut}`;
}

async function renderShot(plan: EditPlan, shot: PlannedShot, index: number, total: number, workDir: string, audit: string[]): Promise<string> {
  const output = path.join(workDir, `shot-${String(index).padStart(2, "0")}.mp4`);
  const encoder = resolveEncoder(plan.options.hardwareEncoder);
  const sourceDuration = Math.min(shot.duration, shot.targetDuration * (shot.playbackRate ?? 1));
  await runLogged(audit, [
    "-y",
    "-ss",
    shot.start.toFixed(3),
    "-t",
    sourceDuration.toFixed(3),
    "-i",
    shot.sourcePath,
    "-vf",
    shotFilter(plan, shot, index, total),
    "-an",
    "-c:v",
    encoder.codec,
    ...encoder.args,
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    output,
  ]);
  return output;
}

async function renderOutro(plan: EditPlan, workDir: string, audit: string[]): Promise<{ path: string; duration: number }> {
  const platform = PLATFORM_PROFILES[plan.options.platform];
  const info = await probeMedia(plan.outroPath);
  const output = path.join(workDir, "outro.mp4");
  const encoder = resolveEncoder(plan.options.hardwareEncoder);
  await runLogged(audit, [
    "-y",
    "-i",
    plan.outroPath,
    "-vf",
    `scale=${platform.width}:${platform.height}:force_original_aspect_ratio=decrease,pad=${platform.width}:${platform.height}:(ow-iw)/2:(oh-ih)/2:black,fps=${platform.fps}`,
    "-an",
    "-c:v",
    encoder.codec,
    ...encoder.args,
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    output,
  ]);
  return { path: output, duration: info.duration };
}

function xfadeGraph(plan: EditPlan, durations: number[], audit: string[]): { graph: string; label: string } {
  if (durations.length === 1) return { graph: "", label: "0:v" };
  const filters: string[] = [];
  let previous = "0:v";
  let timeline = durations[0];
  const style = STYLE_PROFILES[plan.options.style];

  for (let i = 1; i < durations.length; i += 1) {
    const label = `v${i}`;
    const plannedTransition = i < plan.shots.length ? plan.shots[i].transition : "fade";
    const spec = premiumTransitionSpec(plan, plannedTransition, i, style.transitionDuration);
    const duration = Math.min(spec.duration, Math.max(0.03, durations[i - 1] * 0.25), Math.max(0.03, durations[i] * 0.25));
    const offset = Math.max(0.01, timeline - duration);
    filters.push(`[${previous}][${i}:v]xfade=transition=${spec.name}:duration=${duration.toFixed(3)}:offset=${offset.toFixed(3)}[${label}]`);
    audit.push(`transition ${i}: ${spec.label} (${spec.name}, ${duration.toFixed(3)}s)`);
    previous = label;
    timeline += durations[i] - duration;
  }
  return { graph: filters.join(";"), label: previous };
}

async function combineVideo(plan: EditPlan, parts: string[], durations: number[], output: string, audit: string[]): Promise<void> {
  if (parts.length === 1) {
    await runLogged(audit, ["-y", "-i", parts[0], "-c", "copy", output]);
    return;
  }
  const encoder = resolveEncoder(plan.options.hardwareEncoder);
  const inputs = parts.flatMap((part) => ["-i", part]);
  const { graph, label } = xfadeGraph(plan, durations, audit);
  await runLogged(audit, [
    "-y",
    ...inputs,
    "-filter_complex",
    graph,
    "-map",
    `[${label}]`,
    "-an",
    "-c:v",
    encoder.codec,
    ...encoder.args,
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    output,
  ]);
}

async function addMusic(videoPath: string, musicPath: string, outputPath: string, audit: string[]): Promise<void> {
  const info = await probeMedia(videoPath);
  const fadeOutStart = Math.max(0, info.duration - 0.55);
  await runLogged(audit, [
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
    `loudnorm=I=-14:LRA=7:TP=-1.5,afade=t=in:st=0:d=0.3,afade=t=out:st=${fadeOutStart.toFixed(3)}:d=0.5`,
    "-t",
    info.duration.toFixed(3),
    "-movflags",
    "+faststart",
    outputPath,
  ]);
}

async function targetFileSize(outputPath: string, targetMb: number, audit: string[]): Promise<void> {
  if (!Number.isFinite(targetMb) || targetMb <= 1) return;
  const info = await probeMedia(outputPath);
  const videoKbps = Math.max(1200, Math.min(16000, Math.floor((targetMb * 8192) / Math.max(1, info.duration) - 192)));
  const temp = `${outputPath}.size-target.mp4`;
  await runLogged(audit, [
    "-y",
    "-i",
    outputPath,
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-b:v",
    `${videoKbps}k`,
    "-maxrate",
    `${Math.round(videoKbps * 1.15)}k`,
    "-bufsize",
    `${Math.round(videoKbps * 2)}k`,
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    temp,
  ]);
  await rename(temp, outputPath);
}

async function generateThumbnail(outputPath: string, audit: string[]): Promise<string> {
  const info = await probeMedia(outputPath);
  const thumbnailPath = outputPath.replace(/\.mp4$/i, ".thumbnail.jpg");
  await runLogged(audit, ["-y", "-ss", Math.min(1.2, info.duration * 0.18).toFixed(3), "-i", outputPath, "-frames:v", "1", "-q:v", "2", thumbnailPath]);
  return thumbnailPath;
}

async function generateCover(outputPath: string, audit: string[]): Promise<string> {
  const info = await probeMedia(outputPath);
  const coverPath = outputPath.replace(/\.mp4$/i, ".cover.jpg");
  await runLogged(audit, [
    "-y",
    "-ss",
    Math.min(1.2, info.duration * 0.18).toFixed(3),
    "-i",
    outputPath,
    "-vf",
    "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1350:0:285",
    "-frames:v",
    "1",
    "-q:v",
    "2",
    coverPath,
  ]);
  return coverPath;
}

export async function renderPlan(plan: EditPlan, outputPath: string, dataDir: string): Promise<RenderResult> {
  const warnings: string[] = [];
  const audit: string[] = [];
  const workDir = path.join(dataDir, "jobs", crypto.randomUUID());
  await mkdir(workDir, { recursive: true });
  await mkdir(path.dirname(outputPath), { recursive: true });

  try {
    const renderedShots: string[] = [];
    for (let i = 0; i < plan.shots.length; i += 1) {
      renderedShots.push(await renderShot(plan, plan.shots[i], i, plan.shots.length, workDir, audit));
    }

    const outro = await renderOutro(plan, workDir, audit);
    const parts = [...renderedShots, outro.path];
    const durations = [...plan.shots.map((shot) => shot.targetDuration), outro.duration];
    const silentCombined = path.join(workDir, "combined-silent.mp4");
    await combineVideo(plan, parts, durations, silentCombined, audit);

    if (plan.musicPath) {
      await addMusic(silentCombined, plan.musicPath, outputPath, audit);
    } else {
      await runLogged(audit, ["-y", "-i", silentCombined, "-c", "copy", outputPath]);
      if (plan.audioMode === "original" || plan.audioMode === "mix") {
        warnings.push("Original-source audio preservation is requested, but cross-source original-audio mixing remains fail-safe: Reelora keeps the render silent rather than creating broken or desynchronized audio when a reliable mix cannot be produced.");
      }
    }

    if (plan.options.targetFileSizeMb) await targetFileSize(outputPath, plan.options.targetFileSizeMb, audit);
    const finalInfo = await probeMedia(outputPath);
    const thumbnailPath = plan.options.autoThumbnail ? await generateThumbnail(outputPath, audit) : undefined;
    const coverPath = plan.options.coverCrop ? await generateCover(outputPath, audit) : undefined;

    return {
      outputPath,
      durationEstimate: finalInfo.duration,
      shotsRendered: plan.shots.length,
      warnings,
      thumbnailPath,
      coverPath,
      ffmpegAudit: audit,
    };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
