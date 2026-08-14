import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EditingStyle, HighlightIntent } from "./types.js";

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

type TrendMood =
  | "viral-fashion"
  | "luxury-runway"
  | "clean-pop"
  | "y2k-pop"
  | "phonk-lite"
  | "uk-garage"
  | "jersey-club"
  | "afrobeat-inspired"
  | "dreamy-viral"
  | "streetwear-dark"
  | "commercial-pop";

type Groove = "house" | "pop" | "garage" | "jersey" | "afro" | "phonk" | "dreamy";

interface TrendPreset {
  mood: TrendMood;
  bpm: number;
  energy: number;
  rootHz: number;
  minor: boolean;
  progression: number[];
  groove: Groove;
  sparkle: number;
}

const TREND_PRESETS: Record<TrendMood, TrendPreset> = {
  "viral-fashion": { mood: "viral-fashion", bpm: 124, energy: 0.82, rootHz: 55, minor: true, progression: [0, 5, 3, 7], groove: "house", sparkle: 0.8 },
  "luxury-runway": { mood: "luxury-runway", bpm: 112, energy: 0.58, rootHz: 55, minor: true, progression: [0, 3, 5, 2], groove: "house", sparkle: 0.35 },
  "clean-pop": { mood: "clean-pop", bpm: 116, energy: 0.66, rootHz: 65.406, minor: false, progression: [0, 5, 7, 3], groove: "pop", sparkle: 0.72 },
  "y2k-pop": { mood: "y2k-pop", bpm: 132, energy: 0.86, rootHz: 65.406, minor: false, progression: [0, 7, 5, 9], groove: "pop", sparkle: 1 },
  "phonk-lite": { mood: "phonk-lite", bpm: 138, energy: 0.9, rootHz: 46.249, minor: true, progression: [0, 1, 5, 3], groove: "phonk", sparkle: 0.28 },
  "uk-garage": { mood: "uk-garage", bpm: 132, energy: 0.83, rootHz: 55, minor: true, progression: [0, 5, 7, 3], groove: "garage", sparkle: 0.78 },
  "jersey-club": { mood: "jersey-club", bpm: 140, energy: 0.92, rootHz: 55, minor: true, progression: [0, 3, 7, 5], groove: "jersey", sparkle: 0.68 },
  "afrobeat-inspired": { mood: "afrobeat-inspired", bpm: 108, energy: 0.72, rootHz: 65.406, minor: false, progression: [0, 5, 2, 7], groove: "afro", sparkle: 0.64 },
  "dreamy-viral": { mood: "dreamy-viral", bpm: 102, energy: 0.5, rootHz: 65.406, minor: false, progression: [0, 3, 7, 5], groove: "dreamy", sparkle: 0.86 },
  "streetwear-dark": { mood: "streetwear-dark", bpm: 128, energy: 0.84, rootHz: 48.999, minor: true, progression: [0, 1, 6, 3], groove: "phonk", sparkle: 0.22 },
  "commercial-pop": { mood: "commercial-pop", bpm: 122, energy: 0.78, rootHz: 65.406, minor: false, progression: [0, 5, 7, 3], groove: "pop", sparkle: 0.76 },
};

const STYLE_MOOD_POOL: Record<EditingStyle, TrendMood[]> = {
  premium: ["viral-fashion", "clean-pop", "uk-garage"],
  minimal: ["clean-pop", "dreamy-viral", "afrobeat-inspired"],
  fashion: ["viral-fashion", "y2k-pop", "uk-garage", "jersey-club"],
  fast_ecommerce: ["commercial-pop", "jersey-club", "phonk-lite", "uk-garage"],
  cinematic: ["dreamy-viral", "afrobeat-inspired", "luxury-runway"],
  luxury: ["luxury-runway", "dreamy-viral", "clean-pop"],
  clean_commercial: ["commercial-pop", "clean-pop", "afrobeat-inspired"],
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

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function chooseTrendPreset(style: EditingStyle, highlight: HighlightIntent | undefined, variationKey: string): TrendPreset {
  if (highlight === "logo" || highlight === "print") {
    return TREND_PRESETS[style === "luxury" ? "luxury-runway" : "streetwear-dark"];
  }
  if (highlight === "dress" && (style === "luxury" || style === "cinematic")) return TREND_PRESETS["luxury-runway"];
  if (highlight === "fabric" || highlight === "neckline" || highlight === "sleeves") {
    return TREND_PRESETS[style === "fast_ecommerce" ? "commercial-pop" : "clean-pop"];
  }
  if (highlight === "top_wear" && (style === "premium" || style === "fashion")) return TREND_PRESETS["viral-fashion"];

  const pool = STYLE_MOOD_POOL[style];
  const index = hashString(`${variationKey}:${style}:${highlight ?? "general"}`) % pool.length;
  return TREND_PRESETS[pool[index]];
}

async function loadVerifiedLibraryTrack(preset: TrendPreset): Promise<MusicSelection | undefined> {
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

  const candidates: Array<{ track: LibraryTrack; filePath: string; score: number }> = [];
  for (const track of manifest.tracks ?? []) {
    if (!track?.file || !track.rights || !VERIFIED_KINDS.has(track.rights.kind) || track.rights.commercialUse !== true) continue;
    const filePath = path.resolve(root, track.file);
    if (!withinRoot(root, filePath) || !(await exists(filePath))) continue;
    const bpmDelta = Math.abs((track.bpm || preset.bpm) - preset.bpm) / 48;
    const energyDelta = Math.abs((track.energy ?? preset.energy) - preset.energy);
    const normalizedMood = (track.mood ?? "").toLowerCase().replace(/[_ ]/g, "-");
    const moodTokens = preset.mood.split("-");
    const moodBonus = moodTokens.some((token) => token.length > 3 && normalizedMood.includes(token)) ? 0.28 : 0;
    candidates.push({ track, filePath, score: 1 - bpmDelta - energyDelta + moodBonus });
  }

  candidates.sort((a, b) => b.score - a.score);
  const selected = candidates[0];
  if (!selected) return undefined;

  return {
    path: selected.filePath,
    id: selected.track.id,
    title: selected.track.title,
    bpm: selected.track.bpm || preset.bpm,
    energy: selected.track.energy ?? preset.energy,
    mood: selected.track.mood ?? preset.mood,
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
  return Math.max(-1, Math.min(1, Math.tanh(value * 1.12)));
}

function semitone(base: number, steps: number): number {
  return base * Math.pow(2, steps / 12);
}

function secondsSincePatternEvent(beatInBar: number, positions: number[], beatSeconds: number): number {
  let delta = 99;
  for (const position of positions) {
    let candidate = beatInBar - position;
    if (candidate < 0) candidate += 4;
    delta = Math.min(delta, candidate);
  }
  return delta * beatSeconds;
}

function groovePattern(groove: Groove): { kick: number[]; snare: number[]; hat: number[] } {
  if (groove === "garage") return { kick: [0, 1.75, 2.5], snare: [1, 3], hat: [0, 0.5, 1.5, 2, 2.75, 3.5] };
  if (groove === "jersey") return { kick: [0, 1.5, 2, 2.75, 3.5], snare: [1, 3], hat: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5] };
  if (groove === "afro") return { kick: [0, 1.5, 2.75], snare: [1, 3], hat: [0, 0.75, 1.5, 2.25, 3, 3.5] };
  if (groove === "phonk") return { kick: [0, 1.5, 2, 3.25], snare: [1, 3], hat: [0, 0.5, 1, 1.5, 2, 2.25, 2.5, 3, 3.5, 3.75] };
  if (groove === "dreamy") return { kick: [0, 2], snare: [1, 3], hat: [0, 1, 2, 3] };
  if (groove === "pop") return { kick: [0, 2, 2.75], snare: [1, 3], hat: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5] };
  return { kick: [0, 1, 2, 3], snare: [1, 3], hat: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5] };
}

function sectionGain(bar: number): { drums: number; music: number; riser: number } {
  if (bar < 2) return { drums: 0.52, music: 0.72, riser: 0 };
  if (bar < 4) return { drums: 0.78, music: 0.86, riser: bar === 3 ? 1 : 0 };
  if (bar < 8) return { drums: 1, music: 1, riser: 0 };
  if (bar < 10) return { drums: 0.58, music: 0.78, riser: bar === 9 ? 1 : 0 };
  return { drums: 1.04, music: 1.03, riser: 0 };
}

async function generateOriginalTrendBeat(outputPath: string, preset: TrendPreset, style: EditingStyle): Promise<MusicSelection> {
  const bpm = preset.bpm;
  const sampleRate = 44_100;
  const bars = 12;
  const beatSeconds = 60 / bpm;
  const duration = bars * 4 * beatSeconds;
  const frames = Math.ceil(duration * sampleRate);
  const pcm = Buffer.alloc(frames * 2 * 2);
  const pattern = groovePattern(preset.groove);
  const seed = hashString(`${preset.mood}:${style}`) || 0x1234abcd;
  let noiseState = seed;

  for (let i = 0; i < frames; i += 1) {
    const t = i / sampleRate;
    const beat = t / beatSeconds;
    const beatInBar = beat % 4;
    const bar = Math.min(bars - 1, Math.floor(beat / 4));
    const section = sectionGain(bar);

    noiseState = (1664525 * noiseState + 1013904223) >>> 0;
    const noise = (noiseState / 0xffffffff) * 2 - 1;

    const sinceKick = secondsSincePatternEvent(beatInBar, pattern.kick, beatSeconds);
    const kickEnv = Math.exp(-sinceKick * 20);
    const kickFreq = 44 + 82 * Math.exp(-sinceKick * 25);
    const kick = Math.sin(2 * Math.PI * kickFreq * sinceKick) * kickEnv * 0.44 * section.drums;

    const sinceSnare = secondsSincePatternEvent(beatInBar, pattern.snare, beatSeconds);
    const snareEnv = Math.exp(-sinceSnare * 18);
    const clapTone = Math.sin(2 * Math.PI * 185 * sinceSnare) * Math.exp(-sinceSnare * 30);
    const snare = (noise * 0.15 + clapTone * 0.055) * snareEnv * section.drums;

    const sinceHat = secondsSincePatternEvent(beatInBar, pattern.hat, beatSeconds);
    const hat = noise * Math.exp(-sinceHat * 62) * (0.034 + preset.sparkle * 0.025) * section.drums;

    const chordIndex = bar % preset.progression.length;
    const rootOffset = preset.progression[chordIndex];
    const root = semitone(preset.rootHz, rootOffset);
    const third = semitone(root, preset.minor ? 3 : 4);
    const fifth = semitone(root, 7);

    const beatFraction = beat - Math.floor(beat);
    const bassEnv = Math.min(1, beatFraction * 14) * Math.exp(-beatFraction * 2.4);
    const sidechain = Math.max(0.7, 1 - kickEnv * 0.28);
    const bassFreq = beatInBar >= 2.5 ? fifth / 2 : root;
    const bass = (
      Math.sin(2 * Math.PI * bassFreq * t) +
      0.18 * Math.sin(2 * Math.PI * bassFreq * 2 * t)
    ) * bassEnv * sidechain * 0.12 * section.music;

    const padLfo = 0.62 + 0.38 * Math.sin(2 * Math.PI * 0.18 * t);
    const pad = (
      Math.sin(2 * Math.PI * root * 2 * t) +
      0.64 * Math.sin(2 * Math.PI * third * 2 * t) +
      0.52 * Math.sin(2 * Math.PI * fifth * 2 * t)
    ) * 0.018 * padLfo * sidechain * section.music;

    const arpStep = Math.floor(beat * 2) % 8;
    const arpOffsets = preset.minor ? [0, 7, 12, 3, 7, 12, 15, 7] : [0, 7, 12, 4, 7, 12, 16, 7];
    const arpFreq = semitone(root * 2, arpOffsets[arpStep]);
    const halfBeat = (beat * 2) - Math.floor(beat * 2);
    const arpEnv = Math.exp(-halfBeat * (4.4 + preset.sparkle * 2.2));
    const arp = Math.sin(2 * Math.PI * arpFreq * t) * arpEnv * 0.015 * preset.sparkle * section.music;

    const barProgress = beatInBar / 4;
    const riser = section.riser > 0
      ? noise * Math.pow(barProgress, 2.2) * 0.018 + Math.sin(2 * Math.PI * (420 + 760 * barProgress) * t) * Math.pow(barProgress, 3) * 0.008
      : 0;

    const dropAccent = (bar === 4 || bar === 10) && beatInBar < 0.24
      ? Math.sin(2 * Math.PI * 92 * t) * Math.exp(-beatInBar * beatSeconds * 12) * 0.05
      : 0;

    const master = clampAudio(kick + snare + hat + bass + pad + arp + riser + dropAccent);
    const stereoMotion = Math.sin(2 * Math.PI * 0.11 * t) * 0.012;
    const left = Math.round(clampAudio(master + arp * (0.18 + stereoMotion)) * 32767);
    const right = Math.round(clampAudio(master + pad * 0.18 - arp * (0.12 + stereoMotion)) * 32767);
    pcm.writeInt16LE(left, i * 4);
    pcm.writeInt16LE(right, i * 4 + 2);
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  const header = makeWavHeader(pcm.length, sampleRate, 2, 16);
  await writeFile(outputPath, Buffer.concat([header, pcm]));

  return {
    path: outputPath,
    id: `reelora-trend-${preset.mood}-${bpm}`,
    title: `Reelora Trend Original — ${preset.mood.replace(/-/g, " ")}`,
    bpm,
    energy: preset.energy,
    mood: preset.mood,
    source: "reelora_original",
    rights: {
      kind: "reelora_original",
      commercialUse: true,
      source: "procedurally synthesized by Reelora",
      note: "Trend-inspired, sample-free procedural music generated from synthesized tones and noise. It does not copy or bundle a TikTok recording, melody, or third-party sample. Reelora does not make a universal legal guarantee about copyright status in every jurisdiction.",
    },
  };
}

export async function resolveMusicForEdit(args: {
  suppliedMusicPath?: string;
  workDir: string;
  style: EditingStyle;
  highlight?: HighlightIntent;
  autoMusic?: boolean;
}): Promise<MusicSelection | undefined> {
  const preset = chooseTrendPreset(args.style, args.highlight, args.workDir);

  if (args.suppliedMusicPath) {
    return {
      path: args.suppliedMusicPath,
      id: "user-supplied",
      title: path.basename(args.suppliedMusicPath),
      bpm: preset.bpm,
      energy: preset.energy,
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
  const library = await loadVerifiedLibraryTrack(preset);
  if (library) return library;
  return generateOriginalTrendBeat(path.join(args.workDir, `reelora-trend-${preset.mood}.wav`), preset, args.style);
}
