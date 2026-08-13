import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import type { MediaInfo } from "./types.js";

function run(command: string, args: string[], captureStderr = true): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      if (captureStderr) stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${command} exited with code ${code}. ${stderr.slice(-3000)}`));
    });
  });
}

export async function assertFfmpegAvailable(): Promise<void> {
  await run("ffmpeg", ["-version"]);
  await run("ffprobe", ["-version"]);
}

function parseFps(value?: string): number {
  if (!value) return 30;
  if (!value.includes("/")) return Number(value) || 30;
  const [n, d] = value.split("/").map(Number);
  return d ? n / d : 30;
}

export async function probeMedia(path: string): Promise<MediaInfo> {
  await access(path, constants.R_OK);
  const { stdout } = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration:stream=index,codec_type,width,height,avg_frame_rate",
    "-of",
    "json",
    path,
  ]);

  const parsed = JSON.parse(stdout) as {
    format?: { duration?: string };
    streams?: Array<{
      codec_type?: string;
      width?: number;
      height?: number;
      avg_frame_rate?: string;
    }>;
  };

  const video = parsed.streams?.find((s) => s.codec_type === "video");
  if (!video?.width || !video?.height) throw new Error(`No readable video stream found: ${path}`);

  return {
    path,
    duration: Number(parsed.format?.duration ?? 0),
    width: video.width,
    height: video.height,
    fps: parseFps(video.avg_frame_rate),
    hasAudio: Boolean(parsed.streams?.some((s) => s.codec_type === "audio")),
  };
}

export async function detectSceneTimes(path: string, threshold = 0.3): Promise<number[]> {
  try {
    const { stderr } = await run("ffmpeg", [
      "-hide_banner",
      "-i",
      path,
      "-vf",
      `select='gt(scene,${threshold})',showinfo`,
      "-an",
      "-f",
      "null",
      "-",
    ]);

    const times = [...stderr.matchAll(/pts_time:([0-9.]+)/g)].map((m) => Number(m[1]));
    return [...new Set(times.filter((t) => Number.isFinite(t) && t > 0))].sort((a, b) => a - b);
  } catch {
    return [];
  }
}

export async function runFfmpeg(args: string[]): Promise<void> {
  await run("ffmpeg", args);
}
