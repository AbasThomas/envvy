const REPO_PIN_REGEX = /^\d{6}$/;

export function isValidRepoPin(pin: string | null | undefined): pin is string {
  return typeof pin === "string" && REPO_PIN_REGEX.test(pin);
}

export function repoPinStorageKey(repoId: string) {
  return `envii.repo-pin.${repoId}`;
}

export function readStoredRepoPin(repoId: string): string | null {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(repoPinStorageKey(repoId));
  return isValidRepoPin(value) ? value : null;
}

export function writeStoredRepoPin(repoId: string, pin: string) {
  if (typeof window === "undefined") return;
  if (!isValidRepoPin(pin)) return;
  window.sessionStorage.setItem(repoPinStorageKey(repoId), pin);
}

export function clearStoredRepoPin(repoId: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(repoPinStorageKey(repoId));
}
