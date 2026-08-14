"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Track } from "@/data/playlist";

const KEY = "night-drive-library";
interface RecentTrack extends Track { playedAt: number }

export function useDriveLibrary(currentTrack?: Track) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<RecentTrack[]>([]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}"); setFavorites(saved.favorites ?? []); setRecent(saved.recent ?? []); } catch { /* Ignore invalid preferences. */ }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify({ favorites, recent }));
  }, [favorites, recent, hydrated]);
  useEffect(() => {
    if (!hydrated || !currentTrack) return;
    setRecent((items) => [{ ...currentTrack, playedAt: Date.now() }, ...items.filter((item) => item.youtubeVideoId !== currentTrack.youtubeVideoId)].slice(0, 30));
  }, [currentTrack, hydrated]);
  const toggleFavorite = useCallback((videoId: string) => setFavorites((items) => items.includes(videoId) ? items.filter((item) => item !== videoId) : [...items, videoId]), []);
  return useMemo(() => ({ favorites, recent, toggleFavorite, isFavorite: (videoId?: string) => Boolean(videoId && favorites.includes(videoId)) }), [favorites, recent, toggleFavorite]);
}
