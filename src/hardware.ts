import type { HardwareEncoder } from "./types.js";

export interface EncoderConfig {
  codec: string;
  args: string[];
  label: string;
}

export function resolveEncoder(requested: HardwareEncoder = "auto"): EncoderConfig {
  const envEncoder = process.env.REELORA_ENCODER as HardwareEncoder | undefined;
  const selected = requested === "auto" ? envEncoder ?? "libx264" : requested;

  if (selected === "h264_nvenc") {
    return { codec: "h264_nvenc", args: ["-preset", "p5", "-cq", "19"], label: "NVIDIA NVENC" };
  }
  if (selected === "h264_qsv") {
    return { codec: "h264_qsv", args: ["-global_quality", "20"], label: "Intel Quick Sync" };
  }
  if (selected === "h264_amf") {
    return { codec: "h264_amf", args: ["-quality", "quality", "-qp_i", "19", "-qp_p", "19"], label: "AMD AMF" };
  }
  return { codec: "libx264", args: ["-preset", "medium", "-crf", "18"], label: "CPU libx264" };
}
