export const isPlaylistId = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9_-]{10,150}$/.test(value);
