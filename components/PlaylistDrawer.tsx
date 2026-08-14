"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Activity } from "lucide-react";
import type { MusicPlayer } from "@/hooks/useMusicPlayer";
import type { PlaylistInfo } from "@/lib/playlist-api";
import type { Track } from "@/data/playlist";

type View = "playlist" | "favorites" | "recent";
export function PlaylistDrawer({ player, playlistInfo, favorites, recent, onToggleFavorite, onRefresh, onChange }: { player: MusicPlayer; playlistInfo: PlaylistInfo; favorites: string[]; recent: Array<Track & { playedAt: number }>; onToggleFavorite: (videoId: string) => void; onRefresh?: () => void; onChange?: () => void }) {
  const [view, setView] = useState<View>("playlist");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const playlistItems = player.playlist.map((track, originalIndex) => ({ track, originalIndex }));
    const source = view === "recent"
      ? recent.map((track) => ({
        track,
        originalIndex: player.playlist.findIndex((item) => item.id === track.id && item.youtubeVideoId === track.youtubeVideoId),
      })).map((item) => item.originalIndex >= 0 ? item : ({
        ...item,
        originalIndex: player.playlist.findIndex((track) => track.youtubeVideoId === item.track.youtubeVideoId),
      }))
      : view === "favorites"
        ? playlistItems.filter(({ track }) => favorites.includes(track.youtubeVideoId))
        : playlistItems;
    const normalized = query.trim().toLowerCase();
    return source
      .map((item, sourceIndex) => ({ ...item, sourceIndex }))
      .filter(({ track, sourceIndex }) => !normalized || track.title.toLowerCase().includes(normalized) || track.artist?.toLowerCase().includes(normalized) || String(sourceIndex + 1).includes(normalized));
  }, [view, recent, player.playlist, favorites, query]);
  return <AnimatePresence>
    {player.isPlaylistOpen && <>
      <motion.button className="drawer-backdrop" aria-label="Close playlist" onClick={() => player.setIsPlaylistOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.aside className="playlist-drawer glass-panel" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }}>
        <div className="drawer-top"><div><span className="eyebrow">Your collection</span><h2>{playlistInfo.title}</h2><small>{player.playlist.length} tracks</small></div><button className="icon-button" onClick={() => player.setIsPlaylistOpen(false)} aria-label="Close playlist"><X size={18}/></button></div>
        <div className="library-tools"><div className="library-tabs">{(["playlist","favorites","recent"] as View[]).map((item) => <button className={view === item ? "active" : ""} onClick={() => setView(item)} key={item}>{item}</button>)}</div><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search playlist" aria-label="Search playlist" /></div>
        <div className="track-list" tabIndex={0} aria-label={`${playlistInfo.title} tracks`}>{visible.map(({ track, originalIndex, sourceIndex }, index) => { const active = originalIndex === player.currentTrackIndex; return <div className={`track-row glass-track ${active ? "active glass-active" : ""}`} key={`${track.id}-${originalIndex}-${sourceIndex}-${view}`}><button className="track-main" onClick={() => originalIndex >= 0 && player.selectTrack(originalIndex)}><span className="track-number">{String(index + 1).padStart(2, "0")}</span><span className="track-copy"><strong>{track.title}</strong><small>{track.artist ?? (view === "recent" ? "Recently played" : "Unknown artist")}</small></span>{active && <Activity size={16} className="track-playing"/>}</button><button className={`favorite-button ${favorites.includes(track.youtubeVideoId) ? "active" : ""}`} onClick={() => onToggleFavorite(track.youtubeVideoId)} aria-label={`Favorite ${track.title}`}>{favorites.includes(track.youtubeVideoId) ? "♥" : "♡"}</button></div>})}{!visible.length && <p className="empty-library">No tracks in this view.</p>}</div>
        <div className="drawer-footer"><div className="drawer-actions">{onRefresh && <button onClick={onRefresh}>Refresh playlist</button>}{onChange && <button onClick={onChange}>Change playlist</button>}</div><p className="drawer-hint">L to toggle · Space to play · ← / → to seek</p></div>
      </motion.aside>
    </>}
  </AnimatePresence>;
}
