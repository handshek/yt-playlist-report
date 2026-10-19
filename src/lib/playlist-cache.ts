const PLAYLIST_CACHE_PREFIX = "ytpr:playlist-";
const PLAYLIST_CACHE_SCHEMA_VERSION = 1;
export const PLAYLIST_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
export const PLAYLIST_CACHE_MAX_ENTRIES = 24;
export const PLAYLIST_CACHE_MAX_BYTES = 4_500_000;

export type PlaylistCacheKind = "details" | "report";

type PlaylistCacheEnvelope<T> = {
  schemaVersion: number;
  savedAt: number;
  data: T;
};

type PlaylistCacheIndexEntry = {
  key: string;
  savedAt: number;
  bytes: number;
};

const getCacheKey = (kind: PlaylistCacheKind, playlistId: string) =>
  `${PLAYLIST_CACHE_PREFIX}${kind}:${playlistId}`;

const getStorage = (): Storage | null => {
  try {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage;
  } catch {
    return null;
  }
};

const listCacheEntries = (storage: Storage): PlaylistCacheIndexEntry[] => {
  const entries: PlaylistCacheIndexEntry[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !key.startsWith(PLAYLIST_CACHE_PREFIX)) {
      continue;
    }

    const rawValue = storage.getItem(key);
    if (rawValue === null) {
      continue;
    }

    let savedAt = 0;
    try {
      const parsed = JSON.parse(rawValue) as { savedAt?: unknown };
      if (
        typeof parsed.savedAt === "number" &&
        Number.isFinite(parsed.savedAt)
      ) {
        savedAt = parsed.savedAt;
      }
    } catch {
      savedAt = 0;
    }

    entries.push({ key, savedAt, bytes: key.length + rawValue.length });
  }

  return entries;
};

const evictCacheEntries = (
  storage: Storage,
  incoming: { key: string; bytes: number }
) => {
  const entries = listCacheEntries(storage)
    .filter((entry) => entry.key !== incoming.key)
    .sort(
      (left, right) =>
        left.savedAt - right.savedAt || left.key.localeCompare(right.key)
    );

  let bytes = entries.reduce((total, entry) => total + entry.bytes, 0);
  let count = entries.length;

  for (const entry of entries) {
    if (
      count + 1 <= PLAYLIST_CACHE_MAX_ENTRIES &&
      bytes + incoming.bytes <= PLAYLIST_CACHE_MAX_BYTES
    ) {
      break;
    }

    storage.removeItem(entry.key);
    bytes -= entry.bytes;
    count -= 1;
  }
};

const dropAllCacheEntries = (storage: Storage) => {
  for (const entry of listCacheEntries(storage)) {
    storage.removeItem(entry.key);
  }
};

const readCacheEnvelope = <T>(
  kind: PlaylistCacheKind,
  playlistId: string
): PlaylistCacheEnvelope<T> | null => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const key = getCacheKey(kind, playlistId);

  try {
    const rawValue = storage.getItem(key);
    if (rawValue === null) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as Partial<PlaylistCacheEnvelope<T>>;
    if (
      parsed.schemaVersion !== PLAYLIST_CACHE_SCHEMA_VERSION ||
      typeof parsed.savedAt !== "number" ||
      !Number.isFinite(parsed.savedAt) ||
      !("data" in parsed)
    ) {
      storage.removeItem(key);
      return null;
    }

    if (Date.now() - parsed.savedAt >= PLAYLIST_CACHE_TTL_MS) {
      storage.removeItem(key);
      return null;
    }

    return parsed as PlaylistCacheEnvelope<T>;
  } catch {
    try {
      storage.removeItem(key);
    } catch {
      // Cache failures should never block report generation.
    }

    return null;
  }
};

export const readPlaylistCache = <T>(
  kind: PlaylistCacheKind,
  playlistId: string
): T | null => {
  const envelope = readCacheEnvelope<T>(kind, playlistId);
  return envelope ? envelope.data : null;
};

export const writePlaylistCache = <T>(
  kind: PlaylistCacheKind,
  playlistId: string,
  data: T
): boolean => {
  const storage = getStorage();
  if (!storage) {
    return false;
  }

  const key = getCacheKey(kind, playlistId);
  const envelope: PlaylistCacheEnvelope<T> = {
    schemaVersion: PLAYLIST_CACHE_SCHEMA_VERSION,
    savedAt: Date.now(),
    data,
  };

  try {
    const serialized = JSON.stringify(envelope);
    const bytes = key.length + serialized.length;
    if (bytes > PLAYLIST_CACHE_MAX_BYTES) {
      return false;
    }

    evictCacheEntries(storage, { key, bytes });
    storage.setItem(key, serialized);
    return true;
  } catch {
    // Remaining failures are usually a full store; drop our entries and retry.
    try {
      dropAllCacheEntries(storage);
      storage.setItem(key, JSON.stringify(envelope));
      return true;
    } catch {
      return false;
    }
  }
};

export const clearPlaylistCache = (playlistId: string): void => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  for (const kind of ["details", "report"] as const) {
    try {
      storage.removeItem(getCacheKey(kind, playlistId));
    } catch {
      // Cache failures should never block report generation.
    }
  }
};

export const clearAllPlaylistCache = (): void => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  const keys = listCacheEntries(storage).map((entry) => entry.key);
  for (const key of keys) {
    try {
      storage.removeItem(key);
    } catch {
      // Cache failures should never block report generation.
    }
  }
};

export const getPlaylistReportSavedAt = (
  playlistId: string
): number | null => {
  return readCacheEnvelope<unknown>("report", playlistId)?.savedAt ?? null;
};
