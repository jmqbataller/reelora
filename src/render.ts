import { mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { probeMedia, runFfmpeg } from "./ffmpeg.js";
import { resolveEncoder } from "./hardware.js";
import { PLATFORM_PROFILES, STYLE_PROFILES } from "./profiles.js";
import { premiumAnimationSpec, premiumTransitionSpec } from "./transitions.js";
import { resolveVerticalReframe } from "./reframe.js";
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

function shotFilter(plan: EditPlan, shot: PlannedShot, index: number, total: number): { filter: string; complex: boolean; reframe: string } {
  const platform = PLATFORM_PROFILES[plan.options.platform];
  const style = STYLE_PROFILES[plan.options.style];
  const width = platform.width;
  const height = platform.height;
  const fps = platform.fps;
  const animation = premiumAnimationSpec(plan, shot.shotType, index);
  const scaledWidth = Math.round(width * (1 + animation.overscan));
  const scaledHeight = Math.round(height * (1 + animation.overscan));
  const x = `'max(0\\,min(iw-${width}\\,(iw-${width})/2+sin(t*${animation.xFrequency.toFixed(3)}+${animation.phase.toFixed(3)})*${animation.xAmplitude.toFixed(3)}))'`;
  const centeredY = `(ih-${height})/2`;
  const yBias = shot.shotType === "detail" ? `(ih-${height})*0.16` : `(ih-${height})*0.18`;
  const yBase = shot.shotType === "whole_body" || shot.cropRegion ? centeredY : yBias;
  const y = `'max(0\\,min(ih-${height}\\,${yBase}+cos(t*${animation.yFrequency.toFixed(3)}+${animation.phase.toFixed(3)})*${animation.yAmplitude.toFixed(3)}))'`;
  const fadeIn = index === 0 ? `,fade=t=in:st=0:d=${style.openingFade}` : "";
  const fadeOut = index === total - 1 && shot.targetDuration > style.endingFade
    ? `,fade=t=out:st=${Math.max(0, shot.targetDuration - style.endingFade).toFixed(3)}:d=${style.endingFade}`
    : "";
  const speed = shot.playbackRate && shot.playbackRate !== 1 ? `,setpts=PTS/${shot.playbackRate.toFixed(3)}` : "";
  const cropPrefix = normalizedCropPrefix(shot);
  const sourceWidth = shot.sourceWidth ?? width;
  const sourceHeight = shot.sourceHeight ?? height;
  const reframe = resolveVerticalReframe({
    width: sourceWidth,
    height: sourceHeight,
    requested: plan.options.autoVerticalReframe === false ? "smart_crop" : plan.options.landscapeReframeMode,
    hasTrackedRegion: Boolean(shot.cropRegion),
  });

  const detailBoost = shot.shotType === "detail" ? 1.1 : 1;
  const renderWidth = Math.round(scaledWidth * detailBoost);
  const renderHeight = Math.round(scaledHeight * detailBoost);
  const post = `crop=${width}:${height}:x=${x}:y=${y},setsar=1,fps=${fps}${speed}${fadeIn}${fadeOut}`;
  if (reframe === "blur_fill") {
    const filter = `[0:v]split=2[bg][fg];[bg]scale=${renderWidth}:${renderHeight}:force_original_aspect_ratio=increase,crop=${renderWidth}:${renderHeight},gblur=sigma=28,eq=brightness=-0.055:saturation=0.82[bgv];[fg]scale=${renderWidth}:${renderHeight}:force_original_aspect_ratio=decrease[fgv];[bgv][fgv]overlay=(W-w)/2:(H-h)/2,${post}[vout]`;
    return { filter, complex: true, reframe };
  }
  return {
    filter: `${cropPrefix}scale=${renderWidth}:${renderHeight}:force_original_aspect_ratio=increase,${post}`,
    complex: false,
    reframe,
  };
}

async function renderShot(plan: EditPlan, shot: PlannedShot, index: number, total: number, workDir: string, audit: string[]): Promise<string> {
  const output = path.join(workDir, `shot-${String(index).padStart(2, "0")}.mp4`);
  const encoder = resolveEncoder(plan.options.hardwareEncoder);
  const sourceDuration = Math.min(shot.duration, shot.targetDuration * (shot.playbackRate ?? 1));
  const animation = premiumAnimationSpec(plan, shot.shotType, index);
  const framing = shotFilter(plan, shot, index, total);
  audit.push(`animation ${index + 1}: ${animation.label} (real-pixel spatial motion, intensity=${plan.options.animationIntensity ?? "subtle"})`);
  audit.push(`reframe ${index + 1}: source=${shot.sourceWidth ?? "?"}x${shot.sourceHeight ?? "?"}, orientation=${shot.sourceOrientation ?? "unknown"}, mode=${framing.reframe}, output=1080x1920`);
  const filterArgs = framing.complex
    ? ["-filter_complex", framing.filter, "-map", "[vout]"]
    : ["-vf", framing.filter];
  await runLogged(audit, [
    "-y",
    "-ss",
    shot.start.toFixed(3),
    "-t",
    sourceDuration.toFixed(3),
    "-i",
    shot.sourcePath,
    ...filterArgs,
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
  if (!plan.outroPath) throw new Error("renderOutro requires a supplied outro path.");
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

function subtleFlashEnabled(plan: EditPlan): boolean {
  return plan.options.smartTransitions !== false && process.env.REELORA_SUBTLE_FLASH !== "0";
}

function flashCadence(plan: EditPlan): number {
  const envCadence = Number(process.env.REELORA_FLASH_CADENCE);
  if (Number.isFinite(envCadence) && envCadence >= 3 && envCadence <= 10) return Math.round(envCadence);
  if (plan.options.style === "fashion" || plan.options.style === "fast_ecommerce") return 4;
  if (plan.options.style === "luxury" || plan.options.style === "cinematic") return 6;
  return 5;
}

function flashLift(): number {
  const requested = Number(process.env.REELORA_FLASH_STRENGTH ?? "0.10");
  const safe = Number.isFinite(requested) ? Math.max(0.04, Math.min(0.16, requested)) : 0.10;
  return Math.min(0.055, 0.018 + safe * 0.23);
}

function xfadeGraph(plan: EditPlan, durations: number[], audit: string[]): { graph: string; label: string } {
  if (durations.length === 1) return { graph: "", label: "0:v" };
  const filters: string[] = [];
  const flashMoments: number[] = [];
  let previous = "0:v";
  let timeline = durations[0];
  const style = STYLE_PROFILES[plan.options.style];
  const cadence = flashCadence(plan);

  for (let i = 1; i < durations.length; i += 1) {
    const label = `v${i}`;
    const plannedTransition = i < plan.shots.length ? plan.shots[i].transition : "fade";
    const spec = premiumTransitionSpec(plan, plannedTransition, i, style.transitionDuration);
    const duration = Math.min(spec.duration, Math.max(0.03, durations[i - 1] * 0.25), Math.max(0.03, durations[i] * 0.25));
    const offset = Math.max(0.01, timeline - duration);
    filters.push(`[${previous}][${i}:v]xfade=transition=${spec.name}:duration=${duration.toFixed(3)}:offset=${offset.toFixed(3)}[${label}]`);
    audit.push(`transition ${i}: ${spec.label} (${spec.name}, family=${spec.family}, premium=${spec.premium}, ${duration.toFixed(3)}s)`);

    const isOutroTransition = i >= plan.shots.length;
    if (subtleFlashEnabled(plan) && !isOutroTransition && i >= 2 && i % cadence === 0) {
      flashMoments.push(offset + Math.min(duration * 0.45, 0.06));
    }

    previous = label;
    timeline += durations[i] - duration;
  }

  if (flashMoments.length) {
    const brightness = flashLift();
    const contrast = 1.008;
    for (let i = 0; i < flashMoments.length; i += 1) {
      const start = Math.max(0, flashMoments[i] - 0.025);
      const end = start + 0.085;
      const label = `flash${i}`;
      filters.push(`[${previous}]eq=brightness=${brightness.toFixed(3)}:contrast=${contrast.toFixed(3)}:enable='between(t,${start.toFixed(3)},${end.toFixed(3)})'[${label}]`);
      audit.push(`subtle-flash ${i + 1}: ${start.toFixed(3)}-${end.toFixed(3)}s, brightness +${brightness.toFixed(3)} (eye-safe restrained accent)`);
      previous = label;
    }
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

    const parts = [...renderedShots];
    const durations = [...plan.shots.map((shot) => shot.targetDuration)];
    if (plan.outroPath) {
      const outro = await renderOutro(plan, workDir, audit);
      parts.push(outro.path);
      durations.push(outro.duration);
    }
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
