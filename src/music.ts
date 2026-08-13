import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EditingStyle } from "./types.js";

export type MusicRightsKind = "cc0" | "public_domain" | "user_owned" | "licensed" | "reelora_original" | "user_supplied";

export interface MusicRights {
  kind: MusicRightsKind;
  commercialUse: boolean;
  source?: string;
  attribution?: string;
  note: string;
}

export interface MusicSelection {
  path: string;
  id: string;
  title: string;
  bpm: number;
  energy: number;
  mood: string;
  source: "user" | "verified_library" | "reelora_original";
  rights: MusicRights;
}

interface LibraryTrack {
  id: string;
  title: string;
  file: string;
  bpm: number;
  energy?: number;
  mood?: string;
  rights: {
    kind: Exclude<MusicRightsKind, "reelora_original" | "user_supplied">;
    commercialUse: boolean;
    source?: string;
    attribution?: string;
    note?: string;
  };
}

interface MusicManifest {
  tracks: LibraryTrack[];
}

const STYLE_MUSIC: Record<EditingStyle, { bpm: number; energy: number; mood: string }> = {
  premium: { bpm: 116, energy: 0.66, mood: "premium-fashion" },
  minimal: { bpm: 108, energy: 0.48, mood: "minimal-clean" },
  fashion: { bpm: 120, energy: 0.76, mood: "fashion-runway" },
  fast_ecommerce: { bpm: 126, energy: 0.88, mood: "upbeat-commerce" },
  cinematic: { bpm: 96, energy: 0.58, mood: "cinematic-modern" },
  luxury: { bpm: 104, energy: 0.46, mood: "luxury-editorial" },
  clean_commercial: { bpm: 114, energy: 0.62, mood: "clean-commercial" },
};

const VERIFIED_KINDS = new Set<MusicRightsKind>(["cc0", "public_domain", "user_owned", "licensed"]);

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function withinRoot(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function loadVerifiedLibraryTrack(style: EditingStyle): Promise<MusicSelection | undefined> {
  const root = process.env.REELORA_MUSIC_LIBRARY ? path.resolve(process.env.REELORA_MUSIC_LIBRARY) : undefined;
  if (!root) return undefined;
  const manifestPath = path.join(root, "manifest.json");
  if (!(await exists(manifestPath))) return undefined;

  let manifest: MusicManifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8")) as MusicManifest;
  } catch {
    return undefined;
  }

  const target = STYLE_MUSIC[style];
  const candidates: Array<{ track: LibraryTrack; filePath: string; score: number }> = [];
  for (const track of manifest.tracks ?? []) {
    if (!track?.file || !track.rights || !VERIFIED_KINDS.has(track.rights.kind) || track.rights.commercialUse !== true) continue;
    const filePath = path.resolve(root, track.file);
    if (!withinRoot(root, filePath) || !(await exists(filePath))) continue;
    const bpmDelta = Math.abs((track.bpm || target.bpm) - target.bpm) / 50;
    const energyDelta = Math.abs((track.energy ?? target.energy) - target.energy);
    const moodBonus = (track.mood ?? "").toLowerCase().includes(target.mood.split("-")[0]) ? 0.18 : 0;
    candidates.push({ track, filePath, score: 1 - bpmDelta - energyDelta + moodBonus });
  }

  candidates.sort((a, b) => b.score - a.score);
  const selected = candidates[0];
  if (!selected) return undefined;

  return {
    path: selected.filePath,
    id: selected.track.id,
    title: selected.track.title,
    bpm: selected.track.bpm || target.bpm,
    energy: selected.track.energy ?? target.energy,
    mood: selected.track.mood ?? target.mood,
    source: "verified_library",
    rights: {
      kind: selected.track.rights.kind,
      commercialUse: true,
      source: selected.track.rights.source,
      attribution: selected.track.rights.attribution,
      note: selected.track.rights.note ?? "Selected only because the local manifest explicitly marks this track for commercial use. Keep the original license record with the project.",
    },
  };
}

function writeAscii(buffer: Buffer, offset: number, value: string): void {
  buffer.write(value, offset, value.length, "ascii");
}

function makeWavHeader(dataBytes: number, sampleRate: number, channels = 2, bits = 16): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * channels * bits / 8;
  const blockAlign = channels * bits / 8;
  writeAscii(header, 0, "RIFF");
  header.writeUInt32LE(36 + dataBytes, 4);
  writeAscii(header, 8, "WAVE");
  writeAscii(header, 12, "fmt ");
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bits, 34);
  writeAscii(header, 36, "data");
  header.writeUInt32LE(dataBytes, 40);
  return header;
}

function clampAudio(value: number): number {
  return Math.max(-1, Math.min(1, Math.tanh(value * 1.18)));
}

async function generateOriginalPremiumBeat(outputPath: string, style: EditingStyle): Promise<MusicSelection> {
  const preset = STYLE_MUSIC[style];
  const bpm = preset.bpm;
  const sampleRate = 44_100;
  const bars = 8;
  const beatSeconds = 60 / bpm;
  const duration = bars * 4 * beatSeconds;
  const frames = Math.ceil(duration * sampleRate);
  const pcm = Buffer.alloc(frames * 2 * 2);
  const roots = [55, 65.406, 73.416, 49];
  let noiseState = 0x1234abcd;

  for (let i = 0; i < frames; i += 1) {
    const t = i / sampleRate;
    const beat = t / beatSeconds;
    const beatInBar = beat % 4;
    const bar = Math.floor(beat / 4);
    const sinceBeat = (beat - Math.floor(beat)) * beatSeconds;
    const halfBeatSeconds = beatSeconds / 2;
    const sinceHalfBeat = t % halfBeatSeconds;

    noiseState = (1664525 * noiseState + 1013904223) >>> 0;
    const noise = (noiseState / 0xffffffff) * 2 - 1;

    const kickEnv = Math.exp(-sinceBeat * 18);
    const kickFreq = 48 + 70 * Math.exp(-sinceBeat * 24);
    const kick = Math.sin(2 * Math.PI * kickFreq * sinceBeat) * kickEnv * 0.48;

    const snareTarget = beatInBar >= 3 ? 3 : beatInBar >= 1 ? 1 : -1;
    const sinceSnare = snareTarget >= 0 ? (beatInBar - snareTarget) * beatSeconds : 9;
    const snare = sinceSnare >= 0 && sinceSnare < 0.22 ? noise * Math.exp(-sinceSnare * 19) * 0.19 : 0;

    const hat = noise * Math.exp(-sinceHalfBeat * 55) * 0.055;

    const root = roots[bar % roots.length];
    const bassEnv = Math.min(1, sinceBeat * 18) * Math.exp(-sinceBeat * 2.8);
    const bass = (Math.sin(2 * Math.PI * root * t) + 0.22 * Math.sin(2 * Math.PI * root * 2 * t)) * bassEnv * 0.13;

    const padEnv = 0.5 + 0.5 * Math.sin(Math.PI * Math.min(1, sinceBeat / beatSeconds));
    const pad = (
      Math.sin(2 * Math.PI * root * 2 * t) +
      0.65 * Math.sin(2 * Math.PI * root * 2.5 * t) +
      0.48 * Math.sin(2 * Math.PI * root * 3 * t)
    ) * padEnv * 0.026;

    const pulse = Math.sin(2 * Math.PI * (root * 4) * t) * Math.exp(-sinceHalfBeat * 7) * 0.025;
    const master = clampAudio(kick + snare + hat + bass + pad + pulse);
    const width = clampAudio(master + pad * 0.25);
    const left = Math.round(clampAudio(master + hat * 0.2) * 32767);
    const right = Math.round(width * 32767);
    pcm.writeInt16LE(left, i * 4);
    pcm.writeInt16LE(right, i * 4 + 2);
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  const header = makeWavHeader(pcm.length, sampleRate, 2, 16);
  await writeFile(outputPath, Buffer.concat([header, pcm]));

  return {
    path: outputPath,
    id: `reelora-original-${style}-${bpm}`,
    title: `Reelora Original ${style.replace(/_/g, " ")} Beat`,
    bpm,
    energy: preset.energy,
    mood: preset.mood,
    source: "reelora_original",
    rights: {
      kind: "reelora_original",
      commercialUse: true,
      source: "procedurally generated by Reelora",
      note: "Sample-free procedural beat generated from synthesized tones/noise; no third-party recording or sample is bundled. Reelora does not make a universal legal guarantee about copyright status in every jurisdiction.",
    },
  };
}

export async function resolveMusicForEdit(args: {
  suppliedMusicPath?: string;
  workDir: string;
  style: EditingStyle;
  autoMusic?: boolean;
}): Promise<MusicSelection | undefined> {
  if (args.suppliedMusicPath) {
    return {
      path: args.suppliedMusicPath,
      id: "user-supplied",
      title: path.basename(args.suppliedMusicPath),
      bpm: STYLE_MUSIC[args.style].bpm,
      energy: STYLE_MUSIC[args.style].energy,
      mood: "user-supplied",
      source: "user",
      rights: {
        kind: "user_supplied",
        commercialUse: false,
        note: "User-supplied audio is used as provided. Reelora cannot verify that the user owns or has licensed this track.",
      },
    };
  }

  if (args.autoMusic === false || process.env.REELORA_AUTO_MUSIC === "0") return undefined;
  const library = await loadVerifiedLibraryTrack(args.style);
  if (library) return library;
  return generateOriginalPremiumBeat(path.join(args.workDir, `reelora-original-${args.style}.wav`), args.style);
}
