export type EnvMap = Record<string, string>;

export function parseDotEnv(source: string): EnvMap {
  const lines = source.split(/\r?\n/);
  const env: EnvMap = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

export function stringifyDotEnv(env: EnvMap) {
  return Object.entries(env)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${escapeEnvValue(value)}`)
    .join("\n");
}

export function escapeEnvValue(value: string) {
  if (/[\s#"'`]/.test(value)) {
    return JSON.stringify(value);
  }
  return value;
}

export function validateEnvKey(key: string) {
  return /^[A-Z_][A-Z0-9_]*$/i.test(key);
}

export function envDiff(oldEnv: EnvMap, newEnv: EnvMap) {
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  const oldKeys = new Set(Object.keys(oldEnv));
  const newKeys = new Set(Object.keys(newEnv));

  for (const key of newKeys) {
    if (!oldKeys.has(key)) {
      added.push(key);
      continue;
    }
    if (oldEnv[key] !== newEnv[key]) {
      changed.push(key);
    }
  }

  for (const key of oldKeys) {
    if (!newKeys.has(key)) {
      removed.push(key);
    }
  }

  return { added, removed, changed };
}
