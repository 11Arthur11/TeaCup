const SESSION_HINT_KEY = 'teacloud-session-active';

function read(storage: Storage): boolean {
  try { return storage.getItem(SESSION_HINT_KEY) === '1'; }
  catch { return false; }
}

function write(storage: Storage, value: boolean): void {
  try {
    if (value) storage.setItem(SESSION_HINT_KEY, '1');
    else storage.removeItem(SESSION_HINT_KEY);
  } catch {
    // Storage availability is optional; backend cookies remain the authentication source of truth.
  }
}

/**
 * This is only a non-sensitive frontend hint that a backend login/register previously succeeded.
 * It is never treated as proof of authentication; the backend session cookie remains authoritative.
 */
export function hasSessionHint(): boolean {
  return read(sessionStorage) || read(localStorage);
}

export function markSessionEstablished(persistent: boolean): void {
  write(sessionStorage, true);
  write(localStorage, persistent);
}

export function clearSessionHint(): void {
  write(sessionStorage, false);
  write(localStorage, false);
}
