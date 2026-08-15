import { access, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { analyzeSources } from "./analyze.js";
import { assertFfmpegAvailable } from "./ffmpeg.js";
import { REELORA_FEATURES, assertPreservationMode } from "./features.js";
import { materializeMedia, safeOutputName } from "./media.js";
import { resolveMusicForEdit } from "./music.js";
import { buildEditPlan } from "./planner.js";
import { buildQualityReport } from "./quality.js";
import { renderPlan } from "./render.js";
import { getBrandProfile } from "./preferences.js";
import { exportTimeline } from "./timeline.js";
import { validatePlan, validateRenderedOutput } from "./validation.js";
import { enrichCandidatesWithVision } from "./vision.js";
import type { AudioMode, HighlightIntent, ReeloraAdvancedOptions } from "./types.js";

export interface EditRequest {
  rawVideos: string[];
  outroVideo?: string;
  music?: string;
  highlight: HighlightIntent;
  targetDuration?: number;
  outputName?: string;
  audioMode?: AudioMode;
  options?: ReeloraAdvancedOptions;
}

export interface GeneratedVideoRemixRequest {
  generatedVideo: string;
  outroVideo?: string;
  music?: string;
  highlight?: HighlightIntent;
  remixMode?: "re_edit" | "recreate";
  targetDuration?: number;
  outputName?: string;
  audioMode?: AudioMode;
  options?: ReeloraAdvancedOptions;
}

export interface GeneratedVideosRemixRequest extends Omit<GeneratedVideoRemixRequest, "generatedVideo"> {
  generatedVideos: string[];
}

export interface AnalyzeRequest {
  rawVideos: string[];
  highlight?: HighlightIntent;
  options?: ReeloraAdvancedOptions;
}

export function reeloraDataDir(): string {
  return path.resolve(process.env.REELORA_DATA_DIR ?? ".reelora");
}

async function pathExists(value: string): Promise<boolean> {
  try {
    await access(value);
    return true;
  } catch {
    return false;
  }
}

async function versionedOutputPath(outputsDir: string, requestedName: string, versionOutputs = true): Promise<{ outputName: string; outputPath: string }> {
  const safe = safeOutputName(requestedName);
  let candidate = path.join(outputsDir, safe);
  if (!versionOutputs || !(await pathExists(candidate))) return { outputName: safe, outputPath: candidate };

  const ext = path.extname(safe);
  const base = path.basename(safe, ext);
  for (let version = 2; version < 1000; version += 1) {
    const name = `${base}-v${version}${ext}`;
    candidate = path.join(outputsDir, name);
    if (!(await pathExists(candidate))) return { outputName: name, outputPath: candidate };
  }
  throw new Error("Unable to allocate a versioned output filename.");
}

async function resolvedOptions(dataDir: string, requestOptions: ReeloraAdvancedOptions = {}): Promise<ReeloraAdvancedOptions> {
  if (!requestOptions.brandProfile) {
    assertPreservationMode({ ...requestOptions, noGenerativeMode: requestOptions.noGenerativeMode ?? true });
    return requestOptions;
  }
  const profile = await getBrandProfile(dataDir, requestOptions.brandProfile);
  const merged = { ...(profile?.options ?? {}), ...requestOptions, noGenerativeMode: true };
  assertPreservationMode(merged);
  return merged;
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
    const candidates = enrichCandidatesWithVision(
      analysis.candidates,
      request.options?.visionObservations,
      request.highlight ?? "general",
    );
    return {
      media: analysis.media,
      candidateCount: candidates.length,
      topCandidates: candidates.slice(0, 30),
      featureCount: REELORA_FEATURES.length,
      featureRegistry: REELORA_FEATURES,
      visionEnhanced: Boolean(request.options?.visionObservations?.length),
    };
  } finally {
    await rm(inputDir, { recursive: true, force: true });
  }
}

async function renderAndValidate(plan: ReturnType<typeof buildEditPlan>, outputPath: string, dataDir: string) {
  try {
    const render = await renderPlan(plan, outputPath, dataDir);
    await validateRenderedOutput(outputPath);
    return { render, plan, fallbackUsed: false };
  } catch (error) {
    if (plan.options.autoReeditOnValidationFailure === false) throw error;
    const fallbackPlan = {
      ...plan,
      options: {
        ...plan.options,
        dynamicSubjectTracking: false,
        smartTransitions: false,
        transitionMode: "cuts" as const,
        hardwareEncoder: "libx264" as const,
      },
      shots: plan.shots.map((shot) => ({ ...shot, transition: "cut" as const, playbackRate: 1 })),
    };
    validatePlan(fallbackPlan);
    const render = await renderPlan(fallbackPlan, outputPath, dataDir);
    await validateRenderedOutput(outputPath);
    render.warnings.push(`Automatic fail-safe re-edit was used after the first render attempt failed: ${error instanceof Error ? error.message : "unknown error"}`);
    return { render, plan: fallbackPlan, fallbackUsed: true };
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
    const options = await resolvedOptions(dataDir, request.options);
    const rawPaths: string[] = [];
    for (let i = 0; i < request.rawVideos.length; i += 1) {
      rawPaths.push(await materializeMedia(request.rawVideos[i], inputDir, `raw-${i + 1}`));
    }
    const outroPath = request.outroVideo ? await materializeMedia(request.outroVideo, inputDir, "outro") : undefined;
    const suppliedMusicPath = request.music ? await materializeMedia(request.music, inputDir, "music") : undefined;
    const musicSelection = await resolveMusicForEdit({
      suppliedMusicPath,
      workDir: inputDir,
      style: options.style ?? "premium",
      highlight: request.highlight,
      autoMusic: true,
    });
    const musicPath = musicSelection?.path;

    const analysis = await analyzeSources(rawPaths);
    const analyzedCandidates = options.sourceKind === "generated_video"
      ? analysis.candidates.map((candidate) => ({ ...candidate, reasons: [...candidate.reasons, "generated-video-remix-source"] }))
      : analysis.candidates;
    const candidates = enrichCandidatesWithVision(analyzedCandidates, options.visionObservations, request.highlight);
    const initialPlan = buildEditPlan({
      candidates,
      outroPath,
      musicPath,
      musicBpm: musicSelection?.bpm,
      highlight: request.highlight,
      targetContentDuration: request.targetDuration,
      audioMode: request.audioMode,
      options: { ...options, inputSourceCount: rawPaths.length },
    });
    validatePlan(initialPlan);

    const requestedName = request.outputName ?? `reelora-${request.highlight}-${Date.now()}.mp4`;
    const output = await versionedOutputPath(outputsDir, requestedName, options.versionOutputs !== false);
    const rendered = await renderAndValidate(initialPlan, output.outputPath, dataDir);
    const qualityReport = buildQualityReport(rendered.plan, rendered.render.warnings);
    const editPlanPath = output.outputPath.replace(/\.mp4$/i, ".edit-plan.json");
    const qualityPath = output.outputPath.replace(/\.mp4$/i, ".quality.json");
    await writeFile(editPlanPath, JSON.stringify(rendered.plan, null, 2), "utf8");
    await writeFile(qualityPath, JSON.stringify(qualityReport, null, 2), "utf8");

    const timelineBase = path.basename(output.outputName, path.extname(output.outputName));
    const timelinePaths = options.timelineExport?.length
      ? await exportTimeline(rendered.plan, outputsDir, timelineBase, options.timelineExport)
      : [];

    const publicBaseUrl = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
    const publicUrl = (filePath?: string) => filePath && publicBaseUrl
      ? `${publicBaseUrl}/outputs/${encodeURIComponent(path.basename(filePath))}`
      : undefined;

    const sourceUsage = rawPaths.map((_, sourceIndex) => {
      const shots = rendered.plan.shots.filter((shot) => shot.sourceIndex === sourceIndex);
      return {
        sourceIndex,
        uploadNumber: sourceIndex + 1,
        shotCount: shots.length,
        plannedDuration: Number(shots.reduce((sum, shot) => sum + shot.targetDuration, 0).toFixed(3)),
      };
    });
    const allUploadedVideosUsed = sourceUsage.every((source) => source.shotCount > 0);

    return {
      ...rendered.render,
      editPlanPath,
      timelinePaths,
      qualityReport,
      music: musicSelection ? {
        id: musicSelection.id,
        title: musicSelection.title,
        bpm: musicSelection.bpm,
        energy: musicSelection.energy,
        mood: musicSelection.mood,
        source: musicSelection.source,
        rights: musicSelection.rights,
        replacedSourceAudio: true,
      } : undefined,
      outputName: output.outputName,
      outputUrl: publicUrl(output.outputPath),
      thumbnailUrl: publicUrl(rendered.render.thumbnailPath),
      coverUrl: publicUrl(rendered.render.coverPath),
      editPlanUrl: publicUrl(editPlanPath),
      timelineUrls: timelinePaths.map((timelinePath) => publicUrl(timelinePath)),
      qualityReportUrl: publicUrl(qualityPath),
      fallbackUsed: rendered.fallbackUsed,
      featureCount: REELORA_FEATURES.length,
      sourceUsage,
      allUploadedVideosUsed,
      plan: {
        highlight: rendered.plan.highlight,
        targetContentDuration: rendered.plan.targetContentDuration,
        distribution: rendered.plan.distribution,
        style: rendered.plan.options.style,
        platform: rendered.plan.options.platform,
        musicBpm: musicSelection?.bpm,
        sourceKind: rendered.plan.options.sourceKind,
        remixMode: rendered.plan.options.remixMode,
        landscapeReframeMode: rendered.plan.options.landscapeReframeMode,
        outputAspectRatio: "9:16",
        sourceUsage,
        allUploadedVideosUsed,
        shots: rendered.plan.shots.map((shot) => ({
          sourceIndex: shot.sourceIndex,
          start: shot.start,
          duration: shot.targetDuration,
          shotType: shot.shotType,
          score: shot.score,
          confidence: shot.confidence,
          pose: shot.pose,
          variant: shot.variant,
          transition: shot.transition,
          playbackRate: shot.playbackRate,
          reasons: shot.reasons,
        })),
      },
    };
  } finally {
    await rm(inputDir, { recursive: true, force: true });
  }
}

export async function remixGeneratedVideo(request: GeneratedVideoRemixRequest) {
  return remixGeneratedVideos({ ...request, generatedVideos: [request.generatedVideo] });
}

export async function remixGeneratedVideos(request: GeneratedVideosRemixRequest) {
  if (!request.generatedVideos.length) throw new Error("At least one generated video is required.");
  const remixMode = request.remixMode ?? "re_edit";
  return editReel({
    rawVideos: request.generatedVideos,
    outroVideo: request.outroVideo,
    music: request.music,
    highlight: request.highlight ?? "general",
    targetDuration: request.targetDuration,
    outputName: request.outputName ?? `reelora-ai-${remixMode}-${Date.now()}.mp4`,
    audioMode: request.audioMode,
    options: {
      ...request.options,
      sourceKind: "generated_video",
      remixMode,
      preserveSourceSequence: request.options?.preserveSourceSequence ?? remixMode === "re_edit",
      useAllUploadedVideos: request.options?.useAllUploadedVideos ?? true,
      autoVerticalReframe: request.options?.autoVerticalReframe ?? true,
      landscapeReframeMode: request.options?.landscapeReframeMode ?? "auto",
      noGenerativeMode: true,
    },
  });
}

export async function batchEditReels(requests: EditRequest[]) {
  const results = [];
  for (const request of requests) results.push(await editReel(request));
  return results;
}

export async function createEditVariants(request: EditRequest) {
  const base = request.outputName?.replace(/\.mp4$/i, "") ?? `reelora-${request.highlight}-${Date.now()}`;
  return Promise.all([
    editReel({ ...request, outputName: `${base}-premium.mp4`, options: { ...request.options, style: "premium" } }),
    editReel({ ...request, outputName: `${base}-fast.mp4`, options: { ...request.options, style: "fast_ecommerce" } }),
    editReel({ ...request, outputName: `${base}-luxury.mp4`, options: { ...request.options, style: "luxury" } }),
  ]);
}
