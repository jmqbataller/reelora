import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { analyzeReeloraRequest, batchEditReels, createEditVariants, editReel, reeloraDataDir, remixGeneratedVideo } from "./engine.js";
import { REELORA_FEATURES } from "./features.js";
import { REELORA_CAPABILITY_CATALOG, capabilitySummary } from "./feature-catalog.js";
import { reeloraDiagnostics } from "./diagnostics.js";
import { listBrandProfiles, saveBrandProfile } from "./preferences.js";
import { applyRevisionInstructions } from "./revisions.js";
import { deriveEditingDna, editingDnaDistribution, REFERENCE_STYLE_RULES } from "./style-reference.js";
import type { CandidateSegment, EditPlan, ReeloraAdvancedOptions, RevisionInstruction } from "./types.js";

const highlightSchema = z.enum([
  "top_wear", "pants", "skirt", "dress", "shoes", "bag", "fabric", "print", "logo", "neckline", "sleeves", "fit", "front_back", "general",
]);
const audioModeSchema = z.enum(["silent", "music", "original", "mix"]);
const styleSchema = z.enum(["premium", "minimal", "fashion", "fast_ecommerce", "cinematic", "luxury", "clean_commercial"]);
const platformSchema = z.enum(["instagram_reels", "tiktok", "youtube_shorts", "facebook_reels"]);
const transitionSchema = z.enum(["auto", "cuts", "soft", "motion", "premium_fx"]);
const transitionIntensitySchema = z.enum(["subtle", "balanced", "bold"]);
const animationIntensitySchema = z.enum(["off", "subtle", "balanced"]);
const sourceKindSchema = z.enum(["raw_footage", "generated_video"]);
const remixModeSchema = z.enum(["re_edit", "recreate"]);
const landscapeReframeSchema = z.enum(["auto", "smart_crop", "blur_fill"]);
const premiumTransitionFamilySchema = z.enum([
  "liquid-splash", "ink-bloom", "prism-refraction", "particle-crystallize",
  "light-sweep", "glass-ripple", "silk-fold", "luma-bloom",
]);
const encoderSchema = z.enum(["auto", "libx264", "h264_nvenc", "h264_qsv", "h264_amf"]);
const timelineSchema = z.enum(["json", "csv", "edl"]);

const distributionSchema = z.object({ focus: z.number().min(0), wholeBody: z.number().min(0), detail: z.number().min(0) });
const regionSchema = z.object({
  x: z.number().min(0).max(1), y: z.number().min(0).max(1), width: z.number().positive().max(1), height: z.number().positive().max(1), confidence: z.number().min(0).max(1).optional(),
});
const visionObservationSchema = z.object({
  sourceIndex: z.number().int().min(0), time: z.number().min(0), product: regionSchema.optional(), face: regionSchema.optional(), hands: z.array(regionSchema).optional(), fullBody: regionSchema.optional(),
  logo: regionSchema.optional(), print: regionSchema.optional(), fabric: regionSchema.optional(),
  pose: z.enum(["front", "side", "back", "walking", "detail", "unknown"]).optional(), variant: z.string().optional(), sku: z.string().optional(),
  productVisibility: z.number().min(0).max(1).optional(), logoVisibility: z.number().min(0).max(1).optional(), printVisibility: z.number().min(0).max(1).optional(),
  fabricDetail: z.number().min(0).max(1).optional(), occlusion: z.number().min(0).max(1).optional(), blur: z.number().min(0).max(1).optional(), movementQuality: z.number().min(0).max(1).optional(),
  distractionScore: z.number().min(0).max(1).optional(), mirrorReflectionRisk: z.number().min(0).max(1).optional(), confidence: z.number().min(0).max(1).optional(),
});

const advancedOptionsSchema = z.object({
  style: styleSchema.optional(), platform: platformSchema.optional(), distribution: distributionSchema.optional(), autoDuration: z.boolean().optional(), retentionEditing: z.boolean().optional(),
  dynamicSubjectTracking: z.boolean().optional(), beatSync: z.boolean().optional(), musicEnergyMatching: z.boolean().optional(), outroBeatAlignment: z.boolean().optional(), audioDucking: z.boolean().optional(),
  preserveOriginalAudio: z.boolean().optional(), duplicateShotDetection: z.boolean().optional(), poseVariety: z.boolean().optional(), smartTransitions: z.boolean().optional(), productColorLock: z.boolean().optional(),
  fabricTextureGuard: z.boolean().optional(), logoPrintLock: z.boolean().optional(), faceIntegrityGuard: z.boolean().optional(), handIntegrityGuard: z.boolean().optional(), bodyShapeIntegrityGuard: z.boolean().optional(),
  cropSafetyZones: z.boolean().optional(), autoOrientation: z.boolean().optional(), frameRateNormalization: z.boolean().optional(), slowMotionFromHighFps: z.boolean().optional(), opticalFlowGuard: z.boolean().optional(),
  stabilization: z.boolean().optional(), rollingShutterGuard: z.boolean().optional(), exposureFlickerCorrection: z.boolean().optional(), whiteBalanceConsistency: z.boolean().optional(), hdrSdrSafety: z.boolean().optional(), colorSpaceDetection: z.boolean().optional(),
  blurFilter: z.boolean().optional(), occlusionFilter: z.boolean().optional(), badPoseFilter: z.boolean().optional(), distractionFilter: z.boolean().optional(), mirrorReflectionGuard: z.boolean().optional(), variantBalance: z.boolean().optional(),
  singleModelConsistency: z.boolean().optional(), multiProductDetection: z.boolean().optional(), skuLock: z.string().optional(), heroVariant: z.string().optional(), referenceFace: z.string().optional(), referenceProduct: z.string().optional(), referenceReel: z.string().optional(),
  brandProfile: z.string().optional(), transitionMode: transitionSchema.optional(), premiumTransitionEffects: z.boolean().optional(), transitionIntensity: transitionIntensitySchema.optional(),
  transitionFamilies: z.array(premiumTransitionFamilySchema).min(1).max(8).optional(), premiumAnimationEffects: z.boolean().optional(), animationIntensity: animationIntensitySchema.optional(),
  sourceKind: sourceKindSchema.optional(), remixMode: remixModeSchema.optional(), preserveSourceSequence: z.boolean().optional(), autoVerticalReframe: z.boolean().optional(), landscapeReframeMode: landscapeReframeSchema.optional(),
  autoThumbnail: z.boolean().optional(), coverCrop: z.boolean().optional(), qualityReport: z.boolean().optional(), editDecisionReport: z.boolean().optional(),
  beforeAfterValidation: z.boolean().optional(), pixelPreservationAudit: z.boolean().optional(), generativeDetectionAudit: z.boolean().optional(), qualityThreshold: z.number().min(0).max(1).optional(), autoReeditOnValidationFailure: z.boolean().optional(),
  autoReeditUntilPass: z.boolean().optional(), noGenerativeMode: z.literal(true).optional(), proxyAnalysis: z.boolean().optional(), localVision: z.boolean().optional(), offlineMode: z.boolean().optional(), privacyMode: z.boolean().optional(), autoDeleteRawCache: z.boolean().optional(),
  hardwareEncoder: encoderSchema.optional(), targetFileSizeMb: z.number().min(2).max(2000).optional(), versionOutputs: z.boolean().optional(), confidenceThreshold: z.number().min(0).max(1).optional(), sixtyFpsOutput: z.boolean().optional(), proResMaster: z.boolean().optional(),
  responsiveExports: z.boolean().optional(), compressionSimulation: z.boolean().optional(), compressionArtifactGuard: z.boolean().optional(), texturePreservationScore: z.boolean().optional(), bitrateOptimization: z.boolean().optional(), introVideo: z.string().optional(),
  alternateOutros: z.array(z.string()).optional(), preserveOutroDuration: z.boolean().optional(), watchFolder: z.string().optional(), queueMode: z.boolean().optional(), crashRecovery: z.boolean().optional(), renderCache: z.boolean().optional(), partialRenderCache: z.boolean().optional(),
  diskSpaceGuard: z.boolean().optional(), corruptVideoDetection: z.boolean().optional(), codecCompatibilityCheck: z.boolean().optional(), timelineExport: z.array(timelineSchema).optional(), projectFileMode: z.boolean().optional(), clientReviewMode: z.boolean().optional(), approvalLock: z.boolean().optional(),
  reviewState: z.enum(["draft", "review", "approved"]).optional(), seasonPreset: z.string().optional(), campaignId: z.string().optional(), campaignConsistency: z.boolean().optional(), editingDnaProfile: z.string().optional(), styleMatchReference: z.boolean().optional(), competitorAnalysisMode: z.boolean().optional(),
  naturalSoundHighlighting: z.boolean().optional(), audioCleanup: z.boolean().optional(), silenceAwareCuts: z.boolean().optional(), musicDropDetection: z.boolean().optional(), musicSectionSelection: z.boolean().optional(), copyrightSafeMusicWarning: z.boolean().optional(),
  visionObservations: z.array(visionObservationSchema).optional(),
});

const editInputSchema = {
  rawVideos: z.array(z.string().min(1)).min(1).describe("Raw source videos as local paths, file:// URLs, mounted upload paths, or HTTPS URLs."),
  outroVideo: z.string().min(1).describe("Required ending/outro video. Reelora preserves it and places it last."),
  music: z.string().min(1).optional().describe("Optional supplied music. Reelora never generates voice-over."),
  highlight: highlightSchema.default("general").describe("Product region Reelora should prioritize."),
  targetDuration: z.number().min(6).max(45).optional().describe("Requested content duration before outro. Omit to let Auto Duration choose."),
  outputName: z.string().min(1).optional(), audioMode: audioModeSchema.default("silent"), options: advancedOptionsSchema.optional(),
};

const revisionSchema = z.object({
  action: z.enum(["lock_shot", "unlock_shot", "replace_shot", "blacklist_source_window", "favorite_source_window", "edit_region"]),
  shotIndex: z.number().int().min(0).optional(), sourceIndex: z.number().int().min(0).optional(), start: z.number().min(0).optional(), end: z.number().min(0).optional(),
  replacementSourceIndex: z.number().int().min(0).optional(), replacementStart: z.number().min(0).optional(),
});

function textResult(value: unknown) { return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] }; }

export function createReeloraMcpServer(): McpServer {
  const server = new McpServer({ name: "reelora", version: "0.7.0" });

  server.registerTool("reelora_features", {
    title: "List Reelora capabilities",
    description: "Return Reelora's full preservation-first capability catalog, including implemented, adapter-ready, and planned desktop/vision integrations.", inputSchema: {},
  }, async () => textResult({ version: "0.7.0", ...capabilitySummary(), featureIds: REELORA_FEATURES, capabilities: REELORA_CAPABILITY_CATALOG }));

  server.registerTool("reelora_diagnostics", {
    title: "Run Reelora diagnostics", description: "Check FFmpeg/FFprobe, compatible H.264 encoders, data directory access, and deterministic-renderer readiness.", inputSchema: {},
  }, async () => textResult(await reeloraDiagnostics(reeloraDataDir())));

  server.registerTool("reelora_reference_style_dna", {
    title: "Derive preservation-safe editing DNA from a reference Reel",
    description: "Convert observed cut timing and shot-share metadata from a reference Reel into pacing/framing DNA. Does not copy logos, text, music, or creative assets.",
    inputSchema: {
      duration: z.number().positive(), cutTimes: z.array(z.number().min(0)), wholeBodyShare: z.number().min(0).max(1).optional(), closeUpShare: z.number().min(0).max(1).optional(), detailShare: z.number().min(0).max(1).optional(),
      transitionFrequency: z.number().min(0).max(1).optional(), motionIntensity: z.number().min(0).max(1).optional(), style: styleSchema.optional(),
    },
  }, async (input) => {
    const dna = deriveEditingDna(input, input.style ?? "premium");
    return textResult({ dna, distribution: editingDnaDistribution(dna), rules: REFERENCE_STYLE_RULES });
  });

  server.registerTool("reelora_analyze", {
    title: "Analyze raw Reel videos", description: "Analyze raw videos, candidate windows, quality signals, and optional vision observations without modifying the footage.",
    inputSchema: { rawVideos: z.array(z.string().min(1)).min(1), highlight: highlightSchema.optional(), options: advancedOptionsSchema.optional() },
  }, async ({ rawVideos, highlight, options }) => textResult(await analyzeReeloraRequest({ rawVideos, highlight, options: options as ReeloraAdvancedOptions | undefined })));

  server.registerTool("reelora_edit", {
    title: "Automatically edit a preservation-first Reel", description: "Take raw videos plus the uploaded ending video and do the editing automatically: choose the best moments, cut, rearrange, crop/reframe, use supplied vision regions, apply sparse premium liquid/bloom/refraction/particle/light/glass/fabric/luma transitions and real-pixel spatial animation, append the outro, validate preservation, export timelines/reports, and render 9:16 MP4. No overlay text, overlay objects, generated model/product pixels, or AI voice-over.",
    inputSchema: editInputSchema,
  }, async (input) => textResult(await editReel({ ...input, options: input.options as ReeloraAdvancedOptions | undefined })));

  server.registerTool("reelora_remix_ai_video", {
    title: "Re-edit or recreate an uploaded AI-generated video as a Reel",
    description: "Analyze one uploaded generated video, rebuild its pacing from existing frames, optionally preserve or reinterpret source order, apply sparse premium transitions, and automatically convert landscape footage to a subject-safe 1080x1920 Reel. Auto reframing uses tracked crop regions when available and a blurred real-pixel fill otherwise; it never stretches the frame or generates replacement scenes.",
    inputSchema: {
      generatedVideo: z.string().min(1).describe("Uploaded/generated source video as a local path, mounted upload path, file:// URL, or HTTPS URL."),
      outroVideo: z.string().min(1).optional().describe("Optional supplied ending/outro to preserve and append."),
      music: z.string().min(1).optional(),
      highlight: highlightSchema.default("general"),
      remixMode: remixModeSchema.default("re_edit").describe("re_edit preserves chronological story order; recreate rebuilds the sequence from the strongest existing moments."),
      targetDuration: z.number().min(6).max(45).optional(),
      outputName: z.string().min(1).optional(),
      audioMode: audioModeSchema.default("silent"),
      options: advancedOptionsSchema.optional(),
    },
  }, async (input) => textResult(await remixGeneratedVideo({ ...input, options: input.options as ReeloraAdvancedOptions | undefined })));

  server.registerTool("reelora_variants", {
    title: "Generate A/B Reel variants", description: "Create three preservation-safe versions from the same raw footage: premium, fast ecommerce, and luxury pacing.", inputSchema: editInputSchema,
  }, async (input) => textResult(await createEditVariants({ ...input, options: input.options as ReeloraAdvancedOptions | undefined })));

  server.registerTool("reelora_batch_edit", {
    title: "Batch edit multiple products", description: "Process multiple independent Reel jobs sequentially, one finished Reel per product/job.",
    inputSchema: { jobs: z.array(z.object(editInputSchema)).min(1).max(25) },
  }, async ({ jobs }) => textResult(await batchEditReels(jobs.map((job) => ({ ...job, options: job.options as ReeloraAdvancedOptions | undefined })))));

  server.registerTool("reelora_revise_plan", {
    title: "Apply structured revision commands to an edit plan",
    description: "Lock/unlock shots, target replacement windows, blacklist or favorite source moments, or lock everything outside a requested edit region.",
    inputSchema: { plan: z.any(), instructions: z.array(revisionSchema).min(1), candidates: z.array(z.any()).optional() },
  }, async ({ plan, instructions, candidates }) => textResult(applyRevisionInstructions(plan as EditPlan, instructions as RevisionInstruction[], (candidates ?? []) as CandidateSegment[])));

  server.registerTool("reelora_save_brand_profile", {
    title: "Save a Reelora brand editing profile", description: "Persist preferred style, platform, transition, preservation, export, campaign, and framing options for reuse.",
    inputSchema: { name: z.string().min(1), options: advancedOptionsSchema },
  }, async ({ name, options }) => textResult(await saveBrandProfile(reeloraDataDir(), name, { ...(options as ReeloraAdvancedOptions), noGenerativeMode: true })));

  server.registerTool("reelora_list_brand_profiles", {
    title: "List saved Reelora brand profiles", description: "Show persistent editing profiles saved in the Reelora runtime.", inputSchema: {},
  }, async () => textResult(await listBrandProfiles(reeloraDataDir())));

  return server;
}
