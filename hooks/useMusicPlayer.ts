"use client";

import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Track } from "@/data/playlist";
import { useYouTubePlayer } from "./useYouTubePlayer";

const STORAGE_KEY = "night-drive-player";

export function useMusicPlayer(mountRef: RefObject<HTMLDivElement | null>, playlist: Track[]) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(72);
  const [lastVolume, setLastVolume] = useState(72);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferencesHydrated, setPreferencesHydrated] = useState(false);
  const wantsPlayback = useRef(false);
  const youtubeActions = useRef<{ seek: (time: number) => void; play: () => void; loadAndPlay: (videoId: string) => void }>({ seek: () => undefined, play: () => undefined, loadAndPlay: () => undefined });
  const track = playlist[currentTrackIndex];

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, unknown>;
      if (typeof saved.track === "number" && saved.track >= 0 && saved.track < playlist.length) setCurrentTrackIndex(saved.track);
      if (typeof saved.volume === "number") setVolume(Math.min(100, Math.max(0, saved.volume)));
      if (typeof saved.shuffle === "boolean") setIsShuffle(saved.shuffle);
      if (typeof saved.repeat === "boolean") setIsRepeat(saved.repeat);
    } catch { /* Ignore invalid local preferences. */ }
    setPreferencesHydrated(true);
  }, [playlist.length]);

  useEffect(() => {
    setCurrentTrackIndex((index) => Math.min(index, Math.max(playlist.length - 1, 0)));
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, [playlist]);

  useEffect(() => {
    if (preferencesHydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify({ track: currentTrackIndex, volume, shuffle: isShuffle, repeat: isRepeat }));
  }, [currentTrackIndex, volume, isShuffle, isRepeat, preferencesHydrated]);

  const chooseNextIndex = useCallback(() => {
    if (playlist.length < 2 || !isShuffle) return playlist.length ? (currentTrackIndex + 1) % playlist.length : 0;
    let next = currentTrackIndex;
    while (next === currentTrackIndex) next = Math.floor(Math.random() * playlist.length);
    return next;
  }, [currentTrackIndex, isShuffle]);

  const transitionTo = useCallback((index: number) => {
    if (!playlist.length) return;
    const normalizedIndex = ((index % playlist.length) + playlist.length) % playlist.length;
    const nextTrack = playlist[normalizedIndex];
    if (!nextTrack) return;
    wantsPlayback.current = true;
    setError(null);
    setCurrentTime(0);
    setDuration(0);
    youtubeActions.current.loadAndPlay(nextTrack.youtubeVideoId);
    setCurrentTrackIndex(normalizedIndex);
  }, [playlist]);

  const handleEnded = useCallback(() => {
    if (isRepeat) transitionTo(currentTrackIndex);
    else transitionTo(chooseNextIndex());
  }, [chooseNextIndex, currentTrackIndex, isRepeat, transitionTo]);

  const youtube = useYouTubePlayer({
    mountRef,
    videoId: track?.youtubeVideoId ?? "",
    volume,
    onEnded: handleEnded,
    onError: (message) => {
      setError(`${message}. Skipping to next track…`);
      window.setTimeout(() => transitionTo(currentTrackIndex + 1), 1800);
    },
    onPlayingChange: setIsPlaying,
  });
  youtubeActions.current = { seek: youtube.seek, play: youtube.play, loadAndPlay: youtube.loadAndPlay };

  const { ready, getTime, getDuration } = youtube;
  useEffect(() => {
    if (!ready) return;
    const timer = window.setInterval(() => {
      setCurrentTime(getTime());
      setDuration(getDuration());
    }, 500);
    return () => window.clearInterval(timer);
  }, [ready, getTime, getDuration]);

  const play = useCallback(() => { wantsPlayback.current = true; youtube.play(); }, [youtube]);
  const pause = useCallback(() => { wantsPlayback.current = false; youtube.pause(); }, [youtube]);
  const togglePlay = useCallback(() => isPlaying ? pause() : play(), [isPlaying, pause, play]);
  const startCurrentTrack = useCallback(() => {
    if (!track) return;
    wantsPlayback.current = true;
    setCurrentTime(0);
    setDuration(0);
    youtube.loadAndPlay(track.youtubeVideoId);
  }, [track, youtube]);
  const selectTrack = useCallback((index: number) => transitionTo(index), [transitionTo]);
  const next = useCallback(() => transitionTo(chooseNextIndex()), [chooseNextIndex, transitionTo]);
  const previous = useCallback(() => transitionTo(currentTrackIndex - 1), [currentTrackIndex, transitionTo]);
  const seek = useCallback((time: number) => { youtube.seek(time); setCurrentTime(time); }, [youtube]);
  const changeVolume = useCallback((value: number) => {
    const nextVolume = Math.min(100, Math.max(0, value));
    setVolume(nextVolume);
    if (nextVolume > 0) { setLastVolume(nextVolume); youtube.unMute(); }
  }, [youtube]);
  const toggleMute = useCallback(() => {
    if (volume === 0) { setVolume(lastVolume || 72); youtube.unMute(); }
    else { setLastVolume(volume); setVolume(0); youtube.mute(); }
  }, [lastVolume, volume, youtube]);

  return useMemo(() => ({
    track, playlist, currentTrackIndex, isPlaying, currentTime, duration, volume,
    isMuted: volume === 0, isShuffle, isRepeat, isPlaylistOpen, error, ready: youtube.ready,
    play, pause, togglePlay, startCurrentTrack, next, previous, seek, changeVolume, toggleMute, selectTrack,
    setIsShuffle, setIsRepeat, setIsPlaylistOpen, clearError: () => setError(null),
  }), [track, playlist, currentTrackIndex, isPlaying, currentTime, duration, volume, isShuffle, isRepeat,
    isPlaylistOpen, error, youtube.ready, play, pause, togglePlay, startCurrentTrack, next, previous, seek,
    changeVolume, toggleMute, selectTrack]);
}

export type MusicPlayer = ReturnType<typeof useMusicPlayer>;
