"use client";

import { useEffect } from "react";
import { MusicPlayer } from "./useMusicPlayer";
import { isInteractiveTarget } from "@/lib/utils";

export function useKeyboardControls(player: MusicPlayer, toggleHeadlights: () => void, openHelp?: () => void) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (isInteractiveTarget(event.target)) return;
      if (event.code === "Space") { event.preventDefault(); player.togglePlay(); }
      else if (event.key === "ArrowLeft") player.seek(Math.max(0, player.currentTime - 10));
      else if (event.key === "ArrowRight") player.seek(Math.min(player.duration, player.currentTime + 10));
      else if (event.key.toLowerCase() === "m") player.toggleMute();
      else if (event.key.toLowerCase() === "l") player.setIsPlaylistOpen(!player.isPlaylistOpen);
      else if (event.key === "ArrowUp") { event.preventDefault(); player.changeVolume(player.volume + 5); }
      else if (event.key === "ArrowDown") { event.preventDefault(); player.changeVolume(player.volume - 5); }
      else if (event.key.toLowerCase() === "s") player.setIsShuffle(!player.isShuffle);
      else if (event.key.toLowerCase() === "r") player.setIsRepeat(!player.isRepeat);
      else if (event.key.toLowerCase() === "h") toggleHeadlights();
      else if (event.key.toLowerCase() === "f") document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
      else if (event.key === "?") openHelp?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [player, toggleHeadlights, openHelp]);
}
