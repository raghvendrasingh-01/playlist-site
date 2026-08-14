import { pathToFileURL } from "node:url";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const API_URL = "https://www.googleapis.com/youtube/v3/playlistItems";
const DEFAULT_OUTPUT = path.join(process.cwd(), "data", "playlist.ts");

async function loadLocalEnv(): Promise<void> {
  try {
    const contents = await readFile(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  } catch { /* .env.local is optional when the key is already in the environment. */ }
}

interface Thumbnail {
  url?: string;
}

interface PlaylistItem {
  id?: string;
  snippet?: {
    title?: string;
    position?: number;
    resourceId?: { videoId?: string };
    thumbnails?: Record<string, Thumbnail>;
  };
  contentDetails?: { videoId?: string };
  status?: { privacyStatus?: string };
}

interface PlaylistResponse {
  items?: PlaylistItem[];
  nextPageToken?: string;
  error?: { code?: number; message?: string; errors?: Array<{ reason?: string }> };
}

export interface ImportedTrack {
  id: string;
  title: string;
  youtubeVideoId: string;
  thumbnail?: string;
}

export interface ImportResult {
  tracks: ImportedTrack[];
  skipped: number;
  pages: number[];
}

export function extractPlaylistId(input: string): string {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Invalid playlist URL. Provide a full youtube.com or music.youtube.com playlist URL.");
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "youtube.com" && host !== "music.youtube.com") {
    throw new Error("Unsupported playlist URL. Only youtube.com and music.youtube.com URLs are accepted.");
  }

  const playlistId = url.searchParams.get("list")?.trim();
  if (!playlistId || !/^[A-Za-z0-9_-]+$/.test(playlistId)) {
    throw new Error("The URL does not contain a valid YouTube playlist ID in its 'list' parameter.");
  }
  return playlistId;
}

function selectThumbnail(thumbnails?: Record<string, Thumbnail>): string | undefined {
  for (const key of ["maxres", "standard", "high", "medium", "default"]) {
    const url = thumbnails?.[key]?.url;
    if (url) return url;
  }
}

function isUnavailable(item: PlaylistItem): boolean {
  const title = item.snippet?.title?.trim().toLowerCase();
  return !item.contentDetails?.videoId || !item.snippet?.title || title === "deleted video" ||
    title === "private video" || item.status?.privacyStatus === "private";
}

function apiErrorMessage(response: PlaylistResponse, status: number): string {
  const reason = response.error?.errors?.[0]?.reason;
  if (reason === "keyInvalid" || reason === "badRequest") return "The YouTube API key is invalid. Check YOUTUBE_API_KEY in .env.local.";
  if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") return "The YouTube Data API quota is exhausted. Wait for the quota reset or use another authorized key.";
  if (reason === "playlistNotFound" || status === 404) return "Playlist not found. Confirm that the URL is correct and the playlist is public.";
  if (reason === "playlistItemsNotAccessible" || status === 403) return "The playlist is private or inaccessible to this API key.";
  return `YouTube API request failed (${status}): ${response.error?.message ?? "Unknown API error"}`;
}

export async function fetchPlaylist(
  playlistId: string,
  apiKey: string,
  fetcher: typeof fetch = fetch,
  onPage: (page: number, count: number) => void = () => undefined,
): Promise<ImportResult> {
  const tracks: ImportedTrack[] = [];
  const pages: number[] = [];
  let skipped = 0;
  let pageToken: string | undefined;
  let page = 0;

  do {
    const params = new URLSearchParams({
      part: "snippet,contentDetails,status",
      maxResults: "50",
      playlistId,
      key: apiKey,
    });
    if (pageToken) params.set("pageToken", pageToken);

    let response: Response;
    try {
      response = await fetcher(`${API_URL}?${params}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown network error";
      throw new Error(`Could not reach the YouTube Data API: ${message}`);
    }

    const payload = await response.json() as PlaylistResponse;
    if (!response.ok || payload.error) throw new Error(apiErrorMessage(payload, response.status));

    const items = payload.items ?? [];
    page += 1;
    pages.push(items.length);
    onPage(page, items.length);

    for (const item of items) {
      if (isUnavailable(item)) {
        skipped += 1;
        continue;
      }
      tracks.push({
        id: String(tracks.length + 1),
        title: item.snippet!.title!.trim(),
        youtubeVideoId: item.contentDetails!.videoId!,
        thumbnail: selectThumbnail(item.snippet?.thumbnails),
      });
    }
    pageToken = payload.nextPageToken;
  } while (pageToken);

  return { tracks, skipped, pages };
}

export function generatePlaylistSource(tracks: ImportedTrack[]): string {
  const serialized = tracks.map((track) => {
    const fields = [
      `    id: ${JSON.stringify(track.id)},`,
      `    title: ${JSON.stringify(track.title)},`,
      `    youtubeVideoId: ${JSON.stringify(track.youtubeVideoId)},`,
    ];
    if (track.thumbnail) fields.push(`    thumbnail: ${JSON.stringify(track.thumbnail)},`);
    return `  {\n${fields.join("\n")}\n  }`;
  }).join(",\n");

  return `export interface Track {\n  id: string;\n  title: string;\n  artist?: string;\n  youtubeVideoId: string;\n  thumbnail?: string;\n}\n\nexport const playlist: Track[] = [\n${serialized}\n];\n`;
}

export async function runImporter(args = process.argv.slice(2)): Promise<void> {
  const playlistUrl = args[0];
  if (!playlistUrl) throw new Error('Missing playlist URL. Run: npm run import-playlist -- "PLAYLIST_URL"');
  const playlistId = extractPlaylistId(playlistUrl);
  await loadLocalEnv();
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) throw new Error("Missing YOUTUBE_API_KEY. Add it to .env.local or provide it in the environment.");
  console.log("Night Drive Playlist Importer\n");
  console.log(`Playlist ID: ${playlistId}\n`);
  console.log("Fetching playlist...\n");
  const result = await fetchPlaylist(playlistId, apiKey, fetch, (page, count) => console.log(`Page ${page}: ${count} videos`));
  if (result.tracks.length === 0) throw new Error("No playable playlist items were found. The existing playlist file was not changed.");

  await writeFile(DEFAULT_OUTPUT, generatePlaylistSource(result.tracks), "utf8");
  console.log(`\nImported: ${result.tracks.length}`);
  console.log(`Skipped: ${result.skipped}`);
  console.log("\nGenerated:\ndata/playlist.ts\n\nDone.");
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  runImporter().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown importer error";
    console.error(`\nImport failed: ${message}`);
    process.exitCode = 1;
  });
}
