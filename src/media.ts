import { mkdir, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

function extensionFromUrl(value: string): string {
  try {
    const pathname = new URL(value).pathname;
    const ext = path.extname(pathname);
    return ext && ext.length <= 8 ? ext : ".mp4";
  } catch {
    return ".mp4";
  }
}

export async function materializeMedia(input: string, workDir: string, label: string): Promise<string> {
  await mkdir(workDir, { recursive: true });

  if (/^https?:\/\//i.test(input)) {
    const response = await fetch(input);
    if (!response.ok) throw new Error(`Failed to download ${label}: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const fileName = `${label}-${crypto.randomUUID()}${extensionFromUrl(input)}`;
    const output = path.join(workDir, fileName);
    await writeFile(output, bytes);
    return output;
  }

  const resolved = input.startsWith("file://") ? fileURLToPath(input) : path.resolve(input);
  await access(resolved, constants.R_OK);
  return resolved;
}

export function safeOutputName(name = "reelora-output.mp4"): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "-");
  return base.toLowerCase().endsWith(".mp4") ? base : `${base}.mp4`;
}
