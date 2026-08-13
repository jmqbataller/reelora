import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import type { HardwareEncoder } from "./types.js";

function exec(command: string, args: string[]): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    child.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    child.on("error", (error) => resolve({ ok: false, stdout, stderr: `${stderr}${error.message}` }));
    child.on("close", (code) => resolve({ ok: code === 0, stdout, stderr }));
  });
}

const encoderMap: Record<HardwareEncoder, string | undefined> = {
  auto: undefined,
  libx264: "libx264",
  h264_nvenc: "h264_nvenc",
  h264_qsv: "h264_qsv",
  h264_amf: "h264_amf",
};

export async function reeloraDiagnostics(dataDir?: string) {
  const ffmpeg = await exec("ffmpeg", ["-version"]);
  const ffprobe = await exec("ffprobe", ["-version"]);
  const encoders = ffmpeg.ok ? await exec("ffmpeg", ["-hide_banner", "-encoders"]) : { ok: false, stdout: "", stderr: "ffmpeg unavailable" };
  const availableEncoders = Object.entries(encoderMap).filter(([, ffmpegName]) => !ffmpegName || encoders.stdout.includes(ffmpegName)).map(([name]) => name);
  let dataDirReadable: boolean | undefined;
  if (dataDir) {
    try {
      await access(dataDir, constants.R_OK | constants.W_OK);
      dataDirReadable = true;
    } catch {
      dataDirReadable = false;
    }
  }
  return {
    ok: ffmpeg.ok && ffprobe.ok,
    ffmpeg: { ok: ffmpeg.ok, version: ffmpeg.stdout.split("\n")[0] || ffmpeg.stderr.split("\n")[0] },
    ffprobe: { ok: ffprobe.ok, version: ffprobe.stdout.split("\n")[0] || ffprobe.stderr.split("\n")[0] },
    availableEncoders,
    recommendedEncoder: availableEncoders.includes("h264_nvenc") ? "h264_nvenc" : availableEncoders.includes("h264_qsv") ? "h264_qsv" : availableEncoders.includes("h264_amf") ? "h264_amf" : "libx264",
    dataDirReadable,
    notes: [
      "Reelora never requires a generative video model for deterministic rendering.",
      "Hardware encoders are optional; libx264 remains the compatibility fallback.",
    ],
  };
}
