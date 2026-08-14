export {};

declare global {
  interface Window {
    YT?: {
      Player: new (element: HTMLElement, options: YTPlayerOptions) => YTPlayer;
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; BUFFERING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }

  interface YTPlayerOptions {
    videoId: string;
    width?: number | string;
    height?: number | string;
    playerVars?: Record<string, number | string>;
    events?: {
      onReady?: (event: { target: YTPlayer }) => void;
      onStateChange?: (event: { data: number; target: YTPlayer }) => void;
      onError?: (event: { data: number; target: YTPlayer }) => void;
    };
  }

  interface YTPlayer {
    playVideo(): void;
    pauseVideo(): void;
    loadVideoById(videoId: string): void;
    cueVideoById(videoId: string): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    getCurrentTime(): number;
    getDuration(): number;
    getPlayerState(): number;
    getVolume(): number;
    setVolume(volume: number): void;
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
    destroy(): void;
  }
}
