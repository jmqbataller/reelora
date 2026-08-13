import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EditPlan, TimelineEvent, TimelineFormat } from "./types.js";

export function buildTimeline(plan: EditPlan): TimelineEvent[] {
  let outputStart = 0;
  return plan.shots.map((shot, index) => {
    const event: TimelineEvent = {
      index,
      sourceIndex: shot.sourceIndex,
      sourcePath: shot.sourcePath,
      sourceStart: shot.start,
      sourceDuration: shot.duration,
      outputStart,
      outputDuration: shot.targetDuration,
      shotType: shot.shotType,
      transition: shot.transition,
      locked: shot.locked,
    };
    outputStart += shot.targetDuration;
    return event;
  });
}

function secondsToTimecode(seconds: number, fps = 30): string {
  const totalFrames = Math.max(0, Math.round(seconds * fps));
  const frames = totalFrames % fps;
  const totalSeconds = Math.floor(totalFrames / fps);
  const secs = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const mins = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  return [hours, mins, secs, frames].map((value) => String(value).padStart(2, "0")).join(":");
}

function toCsv(events: TimelineEvent[]): string {
  const header = ["index", "sourceIndex", "sourcePath", "sourceStart", "sourceDuration", "outputStart", "outputDuration", "shotType", "transition", "locked"];
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [header.join(","), ...events.map((event) => header.map((key) => escape(event[key as keyof TimelineEvent])).join(","))].join("\n");
}

function toEdl(events: TimelineEvent[]): string {
  const lines = ["TITLE: REELORA_EDIT", "FCM: NON-DROP FRAME", ""];
  for (const event of events) {
    const sourceIn = secondsToTimecode(event.sourceStart);
    const sourceOut = secondsToTimecode(event.sourceStart + event.outputDuration);
    const recordIn = secondsToTimecode(event.outputStart);
    const recordOut = secondsToTimecode(event.outputStart + event.outputDuration);
    lines.push(`${String(event.index + 1).padStart(3, "0")}  AX       V     C        ${sourceIn} ${sourceOut} ${recordIn} ${recordOut}`);
    lines.push(`* FROM CLIP NAME: ${path.basename(event.sourcePath)}`);
    lines.push(`* REELORA SHOT TYPE: ${event.shotType}${event.locked ? " LOCKED" : ""}`);
    lines.push("");
  }
  return lines.join("\n");
}

export async function exportTimeline(plan: EditPlan, outputDir: string, baseName: string, formats: TimelineFormat[] = ["json"]): Promise<string[]> {
  await mkdir(outputDir, { recursive: true });
  const events = buildTimeline(plan);
  const paths: string[] = [];
  for (const format of [...new Set(formats)]) {
    const outputPath = path.join(outputDir, `${baseName}.timeline.${format}`);
    if (format === "json") await writeFile(outputPath, JSON.stringify({ version: 1, events }, null, 2));
    if (format === "csv") await writeFile(outputPath, toCsv(events));
    if (format === "edl") await writeFile(outputPath, toEdl(events));
    paths.push(outputPath);
  }
  return paths;
}
