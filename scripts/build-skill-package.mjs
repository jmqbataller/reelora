import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const dist = path.join(root, "dist-skill");
const skillRoot = path.join(dist, "reelora");
const references = path.join(skillRoot, "references");
const scripts = path.join(skillRoot, "scripts");
const zipPath = path.join(dist, `reelora-skill-v${pkg.version}.zip`);

await rm(dist, { recursive: true, force: true });
await mkdir(references, { recursive: true });
await mkdir(scripts, { recursive: true });

const baseSkill = await readFile(path.join(root, "SKILL.md"), "utf8");
const musicDirective = `\n\n## Automatic premium music and transition addendum\n\nFor automatic soundtrack replacement, beat-aware pacing, verified music-rights behavior, the sample-free Reelora Original Beat fallback, and premium style-aware transition rules, read and follow \`references/MUSIC_AND_TRANSITIONS.md\`. Unless the user explicitly requests silence, the default automatic Reel workflow may replace inconsistent raw clip audio with the selected premium music bed. Never describe an unverified random track as copyright-free.\n`;
await writeFile(path.join(skillRoot, "SKILL.md"), `${baseSkill.trimEnd()}${musicDirective}`, "utf8");
await cp(path.join(root, "skill", "README.md"), path.join(skillRoot, "README.md"));
for (const file of ["EDITING_RULES.md", "PRESERVATION.md", "SHOT_DISTRIBUTION.md", "FEATURES.md"]) {
  await cp(path.join(root, "docs", file), path.join(references, file));
}
await cp(path.join(root, "skill", "references"), references, { recursive: true });
await cp(path.join(root, "skill", "scripts"), scripts, { recursive: true });
await writeFile(
  path.join(skillRoot, "manifest.json"),
  JSON.stringify(
    {
      name: "reelora",
      version: pkg.version,
      preservationMode: "strict-no-generative",
      entrypoint: "SKILL.md",
      repository: "https://github.com/jmqbataller/reelora",
      audioDefaults: {
        automaticPremiumMusic: true,
        sourceAudioReplacement: true,
        verifiedRightsFirst: true,
        sampleFreeOriginalFallback: true
      },
      transitionDefaults: {
        premiumStyleAware: true,
        deterministicRealPixelsOnly: true
      },
      prohibitions: ["overlay-text", "overlay-objects", "ai-voice-over", "generative-video-replacement"],
    },
    null,
    2,
  ),
  "utf8",
);

const pythonCode = String.raw`
import os, sys, zipfile
root, output = sys.argv[1], sys.argv[2]
base = os.path.dirname(root)
with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as z:
    for dirpath, _, filenames in os.walk(root):
        for filename in filenames:
            full = os.path.join(dirpath, filename)
            arc = os.path.relpath(full, base)
            z.write(full, arc)
`;

let result = spawnSync("python3", ["-c", pythonCode, skillRoot, zipPath], { stdio: "inherit" });
if (result.error || result.status !== 0) {
  result = spawnSync("python", ["-c", pythonCode, skillRoot, zipPath], { stdio: "inherit" });
}
if (result.error || result.status !== 0) {
  throw new Error("Unable to create the skill ZIP. Install Python 3 or package dist-skill/reelora manually.");
}

console.log(`Created ${zipPath}`);
