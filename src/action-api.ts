import crypto from "node:crypto";
import net from "node:net";
import type { Express, NextFunction, Request, Response } from "express";
import { z } from "zod";
import { durationWithinRequestedRange, resolveDurationRequest } from "./duration.js";
import { remixGeneratedVideos } from "./engine.js";

const actionSchema = z.object({
  videoUrl: z.string().url().optional().describe("One HTTPS source video URL."),
  videoUrls: z.array(z.string().url()).min(1).max(20).optional().describe("One or more HTTPS source video URLs. Every source is used."),
  outroUrl: z.string().url().optional(),
  musicUrl: z.string().url().optional(),
  remixMode: z.enum(["re_edit", "recreate"]).default("recreate"),
  targetDuration: z.number().min(6).max(45).optional(),
  minDuration: z.number().min(6).max(45).optional(),
  maxDuration: z.number().min(6).max(45).optional(),
  highlight: z.enum([
    "top_wear", "pants", "skirt", "dress", "shoes", "bag", "fabric", "print", "logo",
    "neckline", "sleeves", "fit", "front_back", "general",
  ]).default("general"),
  style: z.enum(["premium", "minimal", "fashion", "fast_ecommerce", "cinematic", "luxury", "clean_commercial"]).default("fashion"),
  outputName: z.string().min(1).max(180).optional(),
}).superRefine((value, ctx) => {
  if (!value.videoUrl && !value.videoUrls?.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "videoUrl or videoUrls is required." });
  }
  if (value.minDuration !== undefined && value.maxDuration !== undefined && value.minDuration > value.maxDuration) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "minDuration cannot be greater than maxDuration." });
  }
});

type ActionInput = z.infer<typeof actionSchema>;
type JobStatus = "queued" | "rendering" | "completed" | "failed";

interface ActionJob {
  id: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  request: {
    sourceCount: number;
    remixMode: "re_edit" | "recreate";
    targetDuration?: number;
    minDuration?: number;
    maxDuration?: number;
  };
  result?: Record<string, unknown>;
  error?: string;
}

const jobs = new Map<string, ActionJob>();
const JOB_TTL_MS = 60 * 60 * 1000;

function nowIso() { return new Date().toISOString(); }

function cleanupJobLater(jobId: string) {
  const timer = setTimeout(() => jobs.delete(jobId), JOB_TTL_MS);
  timer.unref?.();
}

function isPrivateIpv4(host: string): boolean {
  const parts = host.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return a === 10
    || a === 127
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || a === 0;
}

function isSafeRemoteMediaUrl(value: string): boolean {
  let parsed: URL;
  try { parsed = new URL(value); } catch { return false; }
  if (parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return false;
  if (net.isIP(host) === 4 && isPrivateIpv4(host)) return false;
  if (net.isIP(host) === 6 && (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:"))) return false;
  return true;
}

function requireActionAuth(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.REELORA_API_KEY;
  if (!expected) return next();
  const bearer = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  const apiKey = req.header("x-api-key");
  if (bearer === expected || apiKey === expected) return next();
  return res.status(401).json({ error: "unauthorized", message: "A valid Reelora API key is required." });
}

function publicBaseUrl(req: Request): string {
  const configured = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return `${req.protocol}://${req.get("host")}`;
}

function makeOpenApi(baseUrl: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Reelora Custom GPT Actions",
      version: "0.8.0",
      description: "Start a real Reelora FFmpeg render from HTTPS video sources, then poll the render job until a finished MP4 URL is available.",
    },
    servers: [{ url: baseUrl }],
    paths: {
      "/actions/remix": {
        post: {
          operationId: "startReeloraRemix",
          summary: "Start re-editing or reshuffling one or more videos into a vertical Reel",
          description: "Use this when the source video is reachable by HTTPS. For a user-uploaded chat attachment that has no public URL, use Code Interpreter/Data Analysis instead of inventing a URL.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    videoUrl: { type: "string", format: "uri", description: "Single HTTPS source video." },
                    videoUrls: { type: "array", minItems: 1, maxItems: 20, items: { type: "string", format: "uri" } },
                    outroUrl: { type: "string", format: "uri" },
                    musicUrl: { type: "string", format: "uri" },
                    remixMode: { type: "string", enum: ["re_edit", "recreate"], default: "recreate" },
                    targetDuration: { type: "number", minimum: 6, maximum: 45 },
                    minDuration: { type: "number", minimum: 6, maximum: 45, description: "Minimum finished Reel duration requested by the user." },
                    maxDuration: { type: "number", minimum: 6, maximum: 45, description: "Maximum finished Reel duration requested by the user." },
                    highlight: { type: "string", default: "general" },
                    style: { type: "string", default: "fashion" },
                    outputName: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "202": { description: "Render job accepted." },
            "400": { description: "Invalid request." },
            "401": { description: "Authentication failed." },
          },
        },
      },
      "/actions/jobs/{jobId}": {
        get: {
          operationId: "getReeloraRenderJob",
          summary: "Get Reelora render status and the finished MP4 URL",
          parameters: [{ name: "jobId", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Current render status. When status is completed, result.outputUrl contains the MP4 link." },
            "404": { description: "Unknown or expired render job." },
          },
        },
      },
      "/actions/health": {
        get: {
          operationId: "getReeloraActionHealth",
          summary: "Check the Custom GPT action runtime",
          responses: { "200": { description: "Runtime health." } },
        },
      },
    },
  };
}

async function runJob(jobId: string, input: ActionInput) {
  const job = jobs.get(jobId);
  if (!job) return;
  job.status = "rendering";
  job.updatedAt = nowIso();

  try {
    const sources = [...(input.videoUrls ?? []), ...(input.videoUrl ? [input.videoUrl] : [])];
    const uniqueSources = [...new Set(sources)];
    const allRemote = [...uniqueSources, input.outroUrl, input.musicUrl].filter((value): value is string => Boolean(value));
    const unsafe = allRemote.find((value) => !isSafeRemoteMediaUrl(value));
    if (unsafe) throw new Error("Custom GPT Actions accept HTTPS media URLs only; localhost, private-network, and non-HTTPS URLs are rejected.");

    const duration = resolveDurationRequest(input);
    const requestedName = input.outputName ?? `reelora-gpt-${jobId}.mp4`;
    const render = (targetDuration?: number, suffix = "") => remixGeneratedVideos({
      generatedVideos: uniqueSources,
      outroVideo: input.outroUrl,
      music: input.musicUrl,
      highlight: input.highlight,
      remixMode: input.remixMode,
      targetDuration,
      outputName: suffix ? requestedName.replace(/\.mp4$/i, `${suffix}.mp4`) : requestedName,
      audioMode: "silent",
      options: {
        style: input.style,
        sourceKind: "generated_video",
        useAllUploadedVideos: true,
        noGenerativeMode: true,
        autoVerticalReframe: true,
        landscapeReframeMode: "auto",
      },
    });

    let rendered = await render(duration.targetDuration);
    const actualDuration = Number(rendered.durationEstimate);

    if (duration.hasRange && !durationWithinRequestedRange(actualDuration, duration)) {
      const desired = duration.targetDuration ?? ((duration.minDuration! + duration.maxDuration!) / 2);
      const correctedTarget = Math.max(6, Math.min(45, desired + (desired - actualDuration)));
      if (Math.abs(correctedTarget - desired) > 0.05) {
        rendered = await render(correctedTarget, "-duration-fix");
      }
    }

    const finalDuration = Number(rendered.durationEstimate);
    if (duration.hasRange && !durationWithinRequestedRange(finalDuration, duration)) {
      throw new Error(`Rendered duration ${finalDuration.toFixed(3)}s is outside the requested ${duration.minDuration}-${duration.maxDuration}s range.`);
    }
    if (!rendered.outputUrl) {
      throw new Error("PUBLIC_BASE_URL is required so the Custom GPT can receive a clickable finished MP4 URL.");
    }

    job.status = "completed";
    job.updatedAt = nowIso();
    job.result = {
      outputUrl: rendered.outputUrl,
      outputName: rendered.outputName,
      duration: finalDuration,
      requestedDuration: duration,
      remixMode: input.remixMode,
      allUploadedVideosUsed: rendered.allUploadedVideosUsed,
      sourceUsage: rendered.sourceUsage,
      qualityReportUrl: rendered.qualityReportUrl,
      editPlanUrl: rendered.editPlanUrl,
      thumbnailUrl: rendered.thumbnailUrl,
    };
  } catch (error) {
    job.status = "failed";
    job.updatedAt = nowIso();
    job.error = error instanceof Error ? error.message : "Unknown Reelora render error.";
  }
}

export function registerCustomGptActionApi(app: Express) {
  app.get("/openapi.json", (req, res) => res.json(makeOpenApi(publicBaseUrl(req))));

  app.use("/actions", requireActionAuth);

  app.get("/actions/health", (_req, res) => {
    res.json({
      ok: true,
      service: "reelora-actions",
      version: "0.8.0",
      asyncRendering: true,
      durationRanges: true,
      outputLinks: true,
      publicBaseUrlConfigured: Boolean(process.env.PUBLIC_BASE_URL),
    });
  });

  app.post("/actions/remix", (req, res) => {
    const parsed = actionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    }

    try {
      const duration = resolveDurationRequest(parsed.data);
      const sources = [...(parsed.data.videoUrls ?? []), ...(parsed.data.videoUrl ? [parsed.data.videoUrl] : [])];
      const jobId = crypto.randomUUID();
      const timestamp = nowIso();
      jobs.set(jobId, {
        id: jobId,
        status: "queued",
        createdAt: timestamp,
        updatedAt: timestamp,
        request: {
          sourceCount: new Set(sources).size,
          remixMode: parsed.data.remixMode,
          targetDuration: duration.targetDuration,
          minDuration: duration.minDuration,
          maxDuration: duration.maxDuration,
        },
      });
      cleanupJobLater(jobId);
      void runJob(jobId, parsed.data);
      return res.status(202).json({
        jobId,
        status: "queued",
        statusUrl: `${publicBaseUrl(req)}/actions/jobs/${jobId}`,
        message: "Render started. Poll getReeloraRenderJob until status is completed or failed.",
      });
    } catch (error) {
      return res.status(400).json({ error: "invalid_duration", message: error instanceof Error ? error.message : "Invalid duration request." });
    }
  });

  app.get("/actions/jobs/:jobId", (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: "job_not_found", message: "The render job does not exist or has expired." });
    return res.json(job);
  });
}
