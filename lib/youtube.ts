export const YOUTUBE_IFRAME_API = "https://www.youtube.com/iframe_api";

export function isValidYouTubeVideoId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
}
