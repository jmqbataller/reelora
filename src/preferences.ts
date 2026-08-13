import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ReeloraAdvancedOptions } from "./types.js";

export interface BrandProfile {
  name: string;
  options: ReeloraAdvancedOptions;
  updatedAt: string;
}

function profileFile(dataDir: string): string {
  return path.join(dataDir, "profiles", "brand-profiles.json");
}

async function readProfiles(dataDir: string): Promise<Record<string, BrandProfile>> {
  const file = profileFile(dataDir);
  try {
    return JSON.parse(await readFile(file, "utf8")) as Record<string, BrandProfile>;
  } catch {
    return {};
  }
}

export async function saveBrandProfile(dataDir: string, name: string, options: ReeloraAdvancedOptions): Promise<BrandProfile> {
  const cleanName = name.trim();
  if (!cleanName) throw new Error("Brand profile name is required.");
  const profiles = await readProfiles(dataDir);
  const profile: BrandProfile = { name: cleanName, options, updatedAt: new Date().toISOString() };
  profiles[cleanName.toLowerCase()] = profile;
  const file = profileFile(dataDir);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(profiles, null, 2), "utf8");
  return profile;
}

export async function getBrandProfile(dataDir: string, name: string): Promise<BrandProfile | undefined> {
  const profiles = await readProfiles(dataDir);
  return profiles[name.trim().toLowerCase()];
}

export async function listBrandProfiles(dataDir: string): Promise<BrandProfile[]> {
  return Object.values(await readProfiles(dataDir)).sort((a, b) => a.name.localeCompare(b.name));
}
