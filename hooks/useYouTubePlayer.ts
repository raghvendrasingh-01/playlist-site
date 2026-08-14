"use client";

import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { YOUTUBE_IFRAME_API } from "@/lib/youtube";

interface Options {
  mountRef: RefObject<HTMLDivElement | null>;
  videoId: string;
  volume: number;
  onEnded: () => void;
  onError: (message: string) => void;
  onPlayingChange: (playing: boolean) => void;
}

let apiPromise: Promise<void> | null = null;

function loadApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Browser unavailable"));
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${YOUTUBE_IFRAME_API}"]`);
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    if (!existing) {
      const script = document.createElement("script");
      script.src = YOUTUBE_IFRAME_API;
      script.async = true;
      script.onerror = () => reject(new Error("YouTube Player API failed to load"));
      document.head.appendChild(script);
    }
    window.setTimeout(() => reject(new Error("YouTube Player API timed out")), 15000);
  });
  return apiPromise;
}

export function useYouTubePlayer({ mountRef, videoId, volume, onEnded, onError, onPlayingChange }: Options) {
  const playerRef = useRef<YTPlayer | null>(null);
  const readyRef = useRef(false);
  const latestVideoId = useRef(videoId);
  const loadedVideoId = useRef("");
  const pendingAutoplayVideoId = useRef<string | null>(null);
  const callbacks = useRef({ onEnded, onError, onPlayingChange });
  const [ready, setReady] = useState(false);
  callbacks.current = { onEnded, onError, onPlayingChange };
  latestVideoId.current = videoId;

  useEffect(() => {
    let disposed = false;
    loadApi()
      .then(() => {
        if (disposed || !mountRef.current || !window.YT) return;
        playerRef.current = new window.YT.Player(mountRef.current, {
          videoId,
          width: 320,
          height: 180,
          playerVars: {
            playsinline: 1,
            controls: 0,
            disablekb: 1,
            rel: 0,
            modestbranding: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: ({ target }) => {
              target.setVolume(volume);
              readyRef.current = true;
              setReady(true);
              const pendingVideoId = pendingAutoplayVideoId.current;
              if (pendingVideoId) {
                pendingAutoplayVideoId.current = null;
                loadedVideoId.current = pendingVideoId;
                target.loadVideoById(pendingVideoId);
                target.playVideo();
              } else if (latestVideoId.current) {
                loadedVideoId.current = latestVideoId.current;
                target.cueVideoById(latestVideoId.current);
              }
            },
            onStateChange: ({ data }) => {
              if (!window.YT) return;
              if (data === window.YT.PlayerState.ENDED) callbacks.current.onEnded();
              callbacks.current.onPlayingChange(data === window.YT.PlayerState.PLAYING);
            },
            onError: ({ data }) => callbacks.current.onError(`YouTube playback error ${data}`),
          },
        });
      })
      .catch((error: Error) => callbacks.current.onError(error.message));
    return () => {
      disposed = true;
      readyRef.current = false;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // Initialize only once; tracks load through the dedicated effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !videoId || pendingAutoplayVideoId.current || loadedVideoId.current === videoId) return;
    loadedVideoId.current = videoId;
    playerRef.current?.cueVideoById(videoId);
  }, [ready, videoId]);

  useEffect(() => {
    if (ready) playerRef.current?.setVolume(volume);
  }, [ready, volume]);

  return {
    ready,
    loadAndPlay: useCallback((nextVideoId: string) => {
      if (!nextVideoId) return;
      pendingAutoplayVideoId.current = nextVideoId;
      if (!readyRef.current || !playerRef.current) return;
      pendingAutoplayVideoId.current = null;
      loadedVideoId.current = nextVideoId;
      playerRef.current.loadVideoById(nextVideoId);
      playerRef.current.playVideo();
    }, []),
    play: useCallback(() => playerRef.current?.playVideo(), []),
    pause: useCallback(() => playerRef.current?.pauseVideo(), []),
    seek: useCallback((time: number) => playerRef.current?.seekTo(time, true), []),
    mute: useCallback(() => playerRef.current?.mute(), []),
    unMute: useCallback(() => playerRef.current?.unMute(), []),
    getTime: useCallback(() => playerRef.current?.getCurrentTime() ?? 0, []),
    getDuration: useCallback(() => playerRef.current?.getDuration() ?? 0, []),
  };
}
