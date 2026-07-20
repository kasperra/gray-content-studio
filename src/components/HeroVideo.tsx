"use client";

import { useEffect, useRef } from "react";

/**
 * Decorative background video for the hero. Silent and looping.
 *
 * There is deliberately no `autoPlay` attribute — playback is started in an
 * effect only when the visitor hasn't asked to reduce motion. Anyone who has
 * just sees the poster frame.
 */
export function HeroVideo({
  src,
  poster,
  className = "",
}: {
  src: string;
  poster: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Autoplay can still be refused (e.g. Low Power Mode) — poster stays up.
    video.play().catch(() => {});
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      tabIndex={-1}
      className={className}
    />
  );
}
