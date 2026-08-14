import type { Track } from "@/data/playlist";

export interface PlaylistInfo {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
}

export interface PlaylistPayload {
  playlist: PlaylistInfo;
  tracks: Track[];
  skipped: number;
}

export function extractPlaylistId(input: string): string {
  let url: URL;
  try { url = new URL(input); }
  catch { throw new Error("INVALID_URL"); }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "youtube.com" && host !== "music.youtube.com") throw new Error("INVALID_URL");
  const id = url.searchParams.get("list")?.trim();
  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) throw new Error("MISSING_PLAYLIST_ID");
  return id;
}

export function bestThumbnail(thumbnails?: Record<string, { url?: string }>): string | undefined {
  for (const key of ["maxres", "standard", "high", "medium", "default"]) {
    if (thumbnails?.[key]?.url) return thumbnails[key].url;
  }
}
