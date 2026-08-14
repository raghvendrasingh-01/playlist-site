"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, ListMusic, Play, Pause, Volume2, VolumeX, Shuffle, Repeat2, Maximize2, Lightbulb, AlertCircle } from "lucide-react";
import { YouTubePlayer } from "./YouTubePlayer";
import { PlaylistDrawer } from "./PlaylistDrawer";
import { useMusicPlayer } from "@/hooks/useMusicPlayer";
import { useKeyboardControls } from "@/hooks/useKeyboardControls";
import { formatTime } from "@/lib/utils";
import { siteConfig } from "@/lib/config";
import { useDynamicPlaylist } from "@/hooks/useDynamicPlaylist";
import { useDriveLibrary } from "@/hooks/useDriveLibrary";
import { defaultScene, scenes, type WeatherMode } from "@/data/scenes";
import { DrivingBackground, type DrivingBackgroundHandle } from "@/components/DrivingBackground";

export function NightDrive() {
  const youtubeRef = useRef<HTMLDivElement>(null);
  const drivingRef = useRef<DrivingBackgroundHandle>(null);
  const sharedPlaylistHandled = useRef(false);
  const dynamic = useDynamicPlaylist();
  const player = useMusicPlayer(youtubeRef, dynamic.tracks);
  const [entered, setEntered] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [playlistInput, setPlaylistInput] = useState("");
  const [headlights, setHeadlights] = useState(true);
  const [sceneId, setSceneId] = useState(defaultScene.id);
  const [weather, setWeather] = useState<WeatherMode>(defaultScene.weather);
  const [cockpitMode, setCockpitMode] = useState(false);
  const [headphoneMode, setHeadphoneMode] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const scene = scenes.find((item) => item.id === sceneId) ?? defaultScene;
  const library = useDriveLibrary(player.track);
  const { hydrated: playlistHydrated, load: loadPlaylist } = dynamic;
  useKeyboardControls(player, () => setHeadlights((value) => !value), () => setHelpOpen(true));
  useEffect(() => {
    if (!playlistHydrated || sharedPlaylistHandled.current) return;
    sharedPlaylistHandled.current = true;
    const id = new URLSearchParams(window.location.search).get("playlist");
    if (id && /^[A-Za-z0-9_-]+$/.test(id)) void loadPlaylist(`https://www.youtube.com/playlist?list=${id}`);
  }, [playlistHydrated, loadPlaylist]);

  const enterDrive = () => { drivingRef.current?.start(); setEntered(true); player.startCurrentTrack(); };
  const submitPlaylist = async (event: FormEvent) => { event.preventDefault(); const ok = await dynamic.load(playlistInput.trim()); if (ok) { setShowLoader(false); setEntered(false); } };
  const changePlaylist = () => { setPlaylistInput(dynamic.url); setShowLoader(true); player.setIsPlaylistOpen(false); };
  const progress = player.duration ? (player.currentTime / player.duration) * 100 : 0;
  const shareDrive = async () => {
    if (!dynamic.url) return;
    const id = new URL(dynamic.url).searchParams.get("list");
    if (!id) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?playlist=${encodeURIComponent(id)}`;
    if (navigator.share) await navigator.share({ title: "Night Drive", url: shareUrl }).catch(() => undefined);
    else await navigator.clipboard.writeText(shareUrl).catch(() => undefined);
  };
  const moveScene = (event: React.MouseEvent<HTMLElement>) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 2;
    const y = (event.clientY / window.innerHeight - 0.5) * 2;
    event.currentTarget.style.setProperty("--parallax-x", `${x * -5}px`);
    event.currentTarget.style.setProperty("--parallax-y", `${y * -3}px`);
    event.currentTarget.style.setProperty("--ui-x", `${x * 2}px`);
    event.currentTarget.style.setProperty("--ui-y", `${y * 1.5}px`);
  };

  return <main onMouseMove={moveScene} className={`night-drive ${headlights ? "lights-on" : "lights-off"} ${cockpitMode ? "cockpit-mode" : ""} ${headphoneMode ? "headphone-mode" : ""}`}>
    <DrivingBackground ref={drivingRef} scene={scene} weather={weather} />
    <div className="scene-bg" />
    <div className="highway-lights" />
    <div className="windshield-reflection" />
    <div className="grain" />
    <header className="site-header"><div className="brand-lockup"><span className="brand-mark glass-control">N</span><span>{siteConfig.title}</span></div><div className="header-actions"><span className="header-owner">{siteConfig.owner} / 2026</span><button className="playlist-trigger glass-control" onClick={() => player.setIsPlaylistOpen(true)}><ListMusic size={16}/> Playlist <span className="hotkey">L</span></button><button className="mode-button glass-control" onClick={() => setCockpitMode((value) => !value)}>{cockpitMode ? "Exit cockpit" : "Cockpit"}</button></div></header>

    <div className="scene-content">
      <section className="hero-copy"><span className="eyebrow">Personal listening room · 01</span><h1>Take the long way<br/><em>home.</em></h1><p>{siteConfig.subtitle}</p></section>
      <section className="player-shell glass-panel" aria-label="Music player">
      <div className="now-playing"><div className="now-playing-copy"><span className="eyebrow">Now playing</span><AnimatePresence mode="wait"><motion.div key={player.track?.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}><h2>{player.track?.title ?? "No track loaded"}</h2><p>{player.track?.artist ?? "Configure your playlist"}</p></motion.div></AnimatePresence></div>{player.track?.thumbnail && <img className="track-art" src={player.track.thumbnail} alt="" />}</div>
      <div className="progress-wrap"><span>{formatTime(player.currentTime)}</span><input aria-label="Seek through track" type="range" min="0" max={Math.max(player.duration, 1)} step="0.1" value={Math.min(player.currentTime, player.duration || 1)} style={{ "--progress": `${progress}%` } as React.CSSProperties} onChange={(event) => player.seek(Number(event.target.value))}/><span>{formatTime(player.duration)}</span></div>
      <div className="controls"><button className={`control-button optional ${player.isShuffle ? "selected" : ""}`} onClick={() => player.setIsShuffle(!player.isShuffle)} aria-label="Toggle shuffle"><Shuffle size={16}/></button><button className="control-button" onClick={player.previous} aria-label="Previous track"><ChevronLeft size={24}/></button><button className="play-button" onClick={player.togglePlay} aria-label={player.isPlaying ? "Pause" : "Play"}>{player.isPlaying ? <Pause size={21} fill="currentColor"/> : <Play size={21} fill="currentColor"/>}</button><button className="control-button" onClick={player.next} aria-label="Next track"><ChevronRight size={24}/></button><button className={`control-button optional ${player.isRepeat ? "selected" : ""}`} onClick={() => player.setIsRepeat(!player.isRepeat)} aria-label="Toggle repeat"><Repeat2 size={16}/></button></div>
      <aside className="shortcut-bar" aria-label="Keyboard shortcut quick reference"><span><kbd>←</kbd> Seek −10s</span><span><kbd>Space</kbd> Play/Pause</span><span><kbd>→</kbd> Seek +10s</span><span><kbd>↑↓</kbd> Volume</span><span><kbd>M</kbd> Mute</span><span><kbd>S</kbd> Shuffle</span><span><kbd>R</kbd> Repeat</span></aside>
      <div className="utility-row"><button className="utility-button" onClick={player.toggleMute} aria-label={player.isMuted ? "Unmute" : "Mute"}>{player.isMuted ? <VolumeX size={15}/> : <Volume2 size={15}/>}<input aria-label="Volume" type="range" min="0" max="100" value={player.volume} onClick={(event) => event.stopPropagation()} onChange={(event) => player.changeVolume(Number(event.target.value))}/></button><button className={`utility-button ${library.isFavorite(player.track?.youtubeVideoId) ? "selected" : ""}`} onClick={() => player.track && library.toggleFavorite(player.track.youtubeVideoId)} aria-label="Toggle favorite">{library.isFavorite(player.track?.youtubeVideoId) ? "♥" : "♡"}</button><button className="utility-button" onClick={() => setHeadphoneMode((value) => !value)}>Headphones</button><button className="utility-button" onClick={() => setHeadlights((value) => !value)}><Lightbulb size={15}/> {headlights ? "Lights on" : "Lights off"}</button><button className="utility-button" onClick={() => document.documentElement.requestFullscreen()}><Maximize2 size={14}/> Fullscreen</button></div>
      {player.error && <div className="error-note"><AlertCircle size={15}/>{player.error}<button onClick={player.clearError}>Dismiss</button></div>}
      </section>
    </div>
    <div className="dashboard-line" />
    <div className="youtube-holder"><YouTubePlayer ref={youtubeRef}/></div>
    <PlaylistDrawer player={player} playlistInfo={dynamic.info} favorites={library.favorites} recent={library.recent} onToggleFavorite={library.toggleFavorite} onRefresh={dynamic.url ? () => void dynamic.load(dynamic.url) : undefined} onChange={changePlaylist}/>
    <div className="scene-dock glass-control"><span className="dock-label">Drive atmosphere</span><select aria-label="Choose driving scene" value={sceneId} onChange={(event) => setSceneId(event.target.value)}>{scenes.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.location}</option>)}</select><div className="weather-buttons">{(["clear", "rain", "fog"] as WeatherMode[]).map((mode) => <button className={weather === mode ? "selected" : ""} key={mode} onClick={() => setWeather(mode)}>{mode}</button>)}</div>{dynamic.url && <button className="help-trigger" onClick={() => void shareDrive()} aria-label="Share playlist">↗</button>}<button className="help-trigger" onClick={() => setHelpOpen(true)} aria-label="Keyboard shortcuts">?</button></div>
    {helpOpen && <div className="help-overlay" role="dialog" aria-modal="true"><div className="help-card glass-panel"><button className="icon-button" onClick={() => setHelpOpen(false)} aria-label="Close help">×</button><span className="eyebrow">Controls</span><h2>Night drive shortcuts</h2><p>Space Play / pause</p><p>← → Seek · ↑ ↓ Volume</p><p>M Mute · F Fullscreen · L Playlist</p><p>S Shuffle · R Repeat · H Headlights</p></div></div>}
    <AnimatePresence>{!entered && <motion.div className="start-screen" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .8 }}><div className="start-content glass-panel"><span className="eyebrow">A private frequency</span><div className="start-logo">ND<span>01</span></div><h1>Night Drive</h1><p>{dynamic.isDynamic ? dynamic.info.title : siteConfig.subtitle}</p>{(showLoader || !dynamic.isDynamic) && <form className="playlist-loader" onSubmit={submitPlaylist}><label htmlFor="playlist-url">Paste YouTube playlist URL</label><input className="glass-input" id="playlist-url" type="url" value={playlistInput} onChange={(event) => setPlaylistInput(event.target.value)} placeholder="https://music.youtube.com/playlist?list=…" required />{dynamic.error && <div className="loader-error">{dynamic.error}</div>}<button className="enter-button glass-control" type="submit" disabled={dynamic.loading}>{dynamic.loading ? "Loading your night drive…" : "Load playlist"} <ChevronRight size={16}/></button>{!showLoader && <button className="change-link" type="button" onClick={enterDrive}>Enter with default playlist</button>}</form>}{dynamic.isDynamic && !showLoader && <><button className="enter-button glass-control" onClick={enterDrive}>Enter the drive <ChevronRight size={16}/></button><button className="change-link" onClick={changePlaylist}>Change playlist</button>{dynamic.skipped > 0 && <small>{dynamic.tracks.length} tracks loaded · {dynamic.skipped} unavailable skipped</small>}</>}<small>Headphones recommended · Sound starts on entry</small></div><div className="start-footer">{siteConfig.owner}<span>{dynamic.hydrated ? (dynamic.isDynamic ? "playlist restored" : "00:00 / infinite roads") : "00:00 / infinite roads"}</span></div></motion.div>}</AnimatePresence>
  </main>;
}
