// localStorage access that never throws. When site storage is blocked (for
// example Chrome's "block all cookies"), merely touching `localStorage` throws
// a SecurityError; the app should carry on with defaults instead of crashing.

export function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSet(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // storage unavailable; nothing to remove
  }
}
