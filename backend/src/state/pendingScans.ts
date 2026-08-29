type PendingScan = { cardUid: string; scannedAt: number };

const store = new Map<number, PendingScan>();

export function setPendingScan(deviceId: number, cardUid: string) {
  store.set(deviceId, { cardUid, scannedAt: Date.now() });
}

export function getPendingScan(deviceId: number, maxAgeMs = 30_000) {
  const entry = store.get(deviceId);
  if (!entry) return null;
  if (Date.now() - entry.scannedAt > maxAgeMs) {
    store.delete(deviceId);
    return null;
  }
  return entry;
}

export function clearPendingScan(deviceId: number) {
  store.delete(deviceId);
}