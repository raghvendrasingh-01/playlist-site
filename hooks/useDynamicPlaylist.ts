"use client";

import { useCallback, useEffect, useState } from "react";
import { playlist as fallbackPlaylist, type Track } from "@/data/playlist";
import type { PlaylistInfo, PlaylistPayload } from "@/lib/playlist-api";
import { siteConfig } from "@/lib/config";

const KEY = "night-drive-dynamic-playlist";
interface SavedPlaylist extends PlaylistPayload { url: string }

export function useDynamicPlaylist() {
  const [tracks, setTracks] = useState<Track[]>(fallbackPlaylist);
  const [info, setInfo] = useState<PlaylistInfo>({ id: "default", title: siteConfig.playlistName });
  const [url, setUrl] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(0);
  const [isDynamic, setIsDynamic] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as SavedPlaylist | null;
      if (saved?.tracks?.length && saved.playlist && saved.url) {
        setTracks(saved.tracks); setInfo(saved.playlist); setUrl(saved.url); setSkipped(saved.skipped ?? 0); setIsDynamic(true);
      }
    } catch { localStorage.removeItem(KEY); }
    setHydrated(true);
  }, []);

  const load = useCallback(async (playlistUrl: string) => {
    setLoading(true); setError(null);
    try {
      const response = await fetch("/api/playlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: playlistUrl }) });
      const data = await response.json() as PlaylistPayload & { message?: string };
      if (!response.ok) throw new Error(data.message ?? "Could not load this playlist.");
      setTracks(data.tracks); setInfo(data.playlist); setSkipped(data.skipped); setUrl(playlistUrl); setIsDynamic(true);
      localStorage.setItem(KEY, JSON.stringify({ ...data, url: playlistUrl } satisfies SavedPlaylist));
      return true;
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load this playlist."); return false; }
    finally { setLoading(false); }
  }, []);

  const reset = useCallback(() => { setTracks(fallbackPlaylist); setInfo({ id: "default", title: siteConfig.playlistName }); setUrl(""); setSkipped(0); setIsDynamic(false); setError(null); localStorage.removeItem(KEY); }, []);
  return { tracks, info, url, hydrated, loading, error, skipped, isDynamic, load, refresh: () => load(url), reset, clearError: () => setError(null) };
}
