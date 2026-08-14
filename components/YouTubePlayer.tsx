"use client";
import { forwardRef } from "react";

export const YouTubePlayer = forwardRef<HTMLDivElement>(function YouTubePlayer(_, ref) {
  return <div ref={ref} aria-hidden="true" className="youtube-player" />;
});
