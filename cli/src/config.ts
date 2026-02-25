import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type EnviiConfig = {
  token?: string;
  baseUrl: string;
  email?: string;
  userId?: string;
};

const ENVII_DIR = join(homedir(), ".envii");
const CONFIG_FILE = join(ENVII_DIR, "config.json");
const PROJECT_FILE = join(process.cwd(), ".envii.json");
const PROD_API_URL = "https://envii.pxxl.pro";
const DEFAULT_API_URL =
  process.env.ENVII_API_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : PROD_API_URL);

export function getConfigPath() {
  return CONFIG_FILE;
}

export function readGlobalConfig(): EnviiConfig {
  if (!existsSync(CONFIG_FILE)) {
    return {
      baseUrl: DEFAULT_API_URL,
    };
  }

  return JSON.parse(readFileSync(CONFIG_FILE, "utf8")) as EnviiConfig;
}

export function writeGlobalConfig(config: EnviiConfig) {
  if (!existsSync(ENVII_DIR)) mkdirSync(ENVII_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
}

export type ProjectConfig = {
  repoSlug: string;
  environment: "development" | "staging" | "production";
  envFile?: string;
  commitMessage?: string;
};

export function readProjectConfig(): ProjectConfig | null {
  if (!existsSync(PROJECT_FILE)) return null;
  return JSON.parse(readFileSync(PROJECT_FILE, "utf8")) as ProjectConfig;
}

export function writeProjectConfig(config: ProjectConfig) {
  writeFileSync(PROJECT_FILE, JSON.stringify(config, null, 2), "utf8");
}
