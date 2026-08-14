"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { DriveScene, WeatherMode } from "@/data/scenes";

export interface DrivingBackgroundHandle {
  start: () => void;
}

export const DrivingBackground = forwardRef<DrivingBackgroundHandle, { scene: DriveScene; weather: WeatherMode }>(function DrivingBackground({ scene, weather }, ref) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);

  useImperativeHandle(ref, () => ({
    start: () => { void videoRef.current?.play().catch(() => undefined); },
  }), []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.pause();
  }, []);

  return <div className={`driving-background ${videoFailed ? "video-failed" : ""} weather-${weather} tone-${scene.tone}`} style={{ "--scene-position": scene.objectPosition, "--scene-mobile-position": scene.mobilePosition, "--scene-image": `url('${scene.image}')`, "--scene-mobile-image": `url('${scene.mobileImage ?? scene.image}')` } as React.CSSProperties} aria-hidden="true">
    {scene.video && <video
      ref={videoRef}
      className="driving-video"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={scene.image}
      onError={() => setVideoFailed(true)}
    >
      <source src={scene.video} type="video/mp4" />
    </video>}
    <div className="driving-video-fallback" />
    <div className="weather-layer" />
  </div>;
});
