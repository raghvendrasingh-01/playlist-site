import { NextResponse } from "next/server";
import { bestThumbnail, extractPlaylistId, type PlaylistPayload } from "../../../lib/playlist-api";

export const runtime = "nodejs";
const API = "https://www.googleapis.com/youtube/v3";
const cache = new Map<string, { expires: number; payload: PlaylistPayload }>();
const pending = new Map<string, Promise<PlaylistPayload>>();

interface ApiItem {
  snippet?: { title?: string; description?: string; thumbnails?: Record<string, { url?: string }> };
  contentDetails?: { videoId?: string };
  status?: { privacyStatus?: string };
}

interface ApiResponse {
  items?: ApiItem[];
  nextPageToken?: string;
  error?: { errors?: Array<{ reason?: string }> };
}

function publicError(reason?: string): { status: number; code: string; message: string } {
  if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") return { status: 503, code: "QUOTA_EXCEEDED", message: "Playlist service temporarily unavailable. Please try again later." };
  if (reason === "keyInvalid" || reason === "badRequest") return { status: 503, code: "SERVICE_CONFIGURATION", message: "Playlist service is not configured correctly." };
  if (reason === "playlistNotFound") return { status: 404, code: "NOT_FOUND", message: "Playlist not found. Make sure it is public and the URL is correct." };
  return { status: 502, code: "YOUTUBE_UNAVAILABLE", message: "YouTube could not load this playlist right now." };
}

async function youtubeJson(url: URL, key: string): Promise<ApiResponse> {
  url.searchParams.set("key", key);
  const response = await fetch(url, { signal: AbortSignal.timeout(15000), next: { revalidate: 300 } });
  const data = await response.json() as ApiResponse;
  if (!response.ok || data.error) throw new Error(data.error?.errors?.[0]?.reason ?? `HTTP_${response.status}`);
  return data;
}

async function loadPlaylist(id: string, key: string): Promise<PlaylistPayload> {
  const detailsUrl = new URL(`${API}/playlists`);
  detailsUrl.search = new URLSearchParams({ part: "snippet", id, maxResults: "1" }).toString();
  const details = await youtubeJson(detailsUrl, key);
  const info = details.items?.[0]?.snippet;
  if (!info) throw new Error("playlistNotFound");

  const tracks: PlaylistPayload["tracks"] = [];
  let skipped = 0;
  let pageToken: string | undefined;
  do {
    const itemsUrl = new URL(`${API}/playlistItems`);
    itemsUrl.search = new URLSearchParams({ part: "snippet,contentDetails,status", playlistId: id, maxResults: "50", ...(pageToken ? { pageToken } : {}) }).toString();
    const page = await youtubeJson(itemsUrl, key);
    for (const item of page.items ?? []) {
      const title = item.snippet?.title?.trim();
      const videoId = item.contentDetails?.videoId;
      if (!title || !videoId || title === "Deleted video" || title === "Private video" || item.status?.privacyStatus === "private") { skipped++; continue; }
      tracks.push({ id: String(tracks.length + 1), title, youtubeVideoId: videoId, thumbnail: bestThumbnail(item.snippet?.thumbnails) });
    }
    pageToken = page.nextPageToken;
  } while (pageToken);
  if (!tracks.length) throw new Error("EMPTY_PLAYLIST");
  return { playlist: { id, title: info.title ?? "YouTube Playlist", description: info.description, thumbnail: bestThumbnail(info.thumbnails) }, tracks, skipped };
}

export async function POST(request: Request) {
  let url: string;
  try {
    const body = await request.json() as { url?: unknown };
    if (typeof body.url !== "string" || body.url.length > 2048) throw new Error("INVALID_URL");
    url = body.url;
  } catch { return NextResponse.json({ code: "INVALID_REQUEST", message: "Provide a valid playlist URL." }, { status: 400 }); }

  let id: string;
  try { id = extractPlaylistId(url); }
  catch { return NextResponse.json({ code: "INVALID_URL", message: "Paste a valid public YouTube or YouTube Music playlist URL." }, { status: 400 }); }
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return NextResponse.json({ code: "SERVICE_CONFIGURATION", message: "Playlist service is not configured." }, { status: 503 });
  const cached = cache.get(id);
  if (cached && cached.expires > Date.now()) return NextResponse.json(cached.payload);

  try {
    const task = pending.get(id) ?? loadPlaylist(id, key);
    pending.set(id, task);
    const payload = await task;
    cache.set(id, { payload, expires: Date.now() + 5 * 60_000 });
    return NextResponse.json(payload);
  } catch (error) {
    const reason = error instanceof Error ? error.message : undefined;
    if (reason === "EMPTY_PLAYLIST") return NextResponse.json({ code: reason, message: "This playlist has no playable public videos." }, { status: 422 });
    const safe = publicError(reason);
    return NextResponse.json({ code: safe.code, message: safe.message }, { status: safe.status });
  } finally { pending.delete(id); }
}
