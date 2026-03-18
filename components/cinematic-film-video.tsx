"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";

type CinematicFilmVideoProps = {
  videoSrc: string;
  grainOpacity?: number;
  videoBlur?: number;
  filmStripFrame?: boolean;
  /** Center frame height ratio (0–1). 0.7 = 70% viewport, 15% cutoff top/bottom. */
  filmFrameRatio?: number;
  enableFrameOverlay?: boolean;
  frameOverlaySrc?: string;
  enableFilmStrip?: boolean;
  enableScratches?: boolean;
  enableFlicker?: boolean;
  enableGateWeave?: boolean;
  enableVignette?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
};

export function CinematicFilmVideo({
  videoSrc,
  grainOpacity = 0.08,
  videoBlur = 0,
  filmStripFrame = false,
  filmFrameRatio = 0.7,
  enableFrameOverlay = false,
  frameOverlaySrc,
  enableFilmStrip = false,
  enableScratches = false,
  enableFlicker = true,
  enableGateWeave = true,
  enableVignette = true,
  className = "",
  style,
  children,
}: CinematicFilmVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoRef2 = useRef<HTMLVideoElement>(null);
  const videoRef3 = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const h = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const play = () => video.play().catch(() => {});
    if (video.readyState >= 2) play();
    else video.addEventListener("loadeddata", play);
    return () => video.removeEventListener("loadeddata", play);
  }, [videoSrc]);

  const noMotion = reducedMotion;
  const flicker = enableFlicker && !noMotion;
  const gateWeave = enableGateWeave && !noMotion;

  const videoStyle = videoBlur ? { filter: `blur(${videoBlur}px)` } : undefined;

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {/* Base video — film-strip frame: smaller center with repeated top/bottom cut off */}
      {filmStripFrame ? (
        <div
          className="absolute inset-x-0 flex flex-col items-center gap-4"
          style={{
            height: "210vh",
            top: "-55vh",
          }}
        >
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="h-[70vh] w-[75%] max-w-3xl shrink-0 rounded-xl aspect-video object-cover bg-black"
            style={videoStyle}
            aria-hidden
          />
          <video
            ref={videoRef2}
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="h-[70vh] w-[75%] max-w-3xl shrink-0 rounded-xl aspect-video object-cover bg-black"
            style={videoStyle}
            aria-hidden
          />
          <video
            ref={videoRef3}
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="h-[70vh] w-[75%] max-w-3xl shrink-0 rounded-xl aspect-video object-cover bg-black"
            style={videoStyle}
            aria-hidden
          />
        </div>
      ) : (
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover bg-black"
          style={videoStyle}
          aria-hidden
        />
      )}

      {/* Procedural noise grain via SVG filter */}
      <div
        className="pointer-events-none absolute inset-0 z-[2] mix-blend-overlay"
        style={{
          opacity: grainOpacity,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
        aria-hidden
      />

      {/* Optional scanline/frame overlay — custom image or built-in scanlines */}
      {enableFrameOverlay &&
        (frameOverlaySrc ? (
          <div
            className="pointer-events-none absolute inset-0 z-[3] mix-blend-overlay opacity-30"
            style={{
              backgroundImage: `url(${frameOverlaySrc})`,
              backgroundSize: "cover",
            }}
            aria-hidden
          />
        ) : (
          <div
            className="pointer-events-none absolute inset-0 z-[3] mix-blend-overlay opacity-[0.08]"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 3px)`,
            }}
            aria-hidden
          />
        ))}

      {/* Film strip borders — Super 8mm style with sprocket holes */}
      {enableFilmStrip && (
        <>
          <div
            className="pointer-events-none absolute left-0 top-0 z-[4] h-full w-[5%] min-w-[24px]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 200'%3E%3Cdefs%3E%3Cmask id='l'%3E%3Crect width='24' height='200' fill='white'/%3E%3Crect x='6' y='12' width='10' height='14' rx='2' fill='black'/%3E%3Crect x='6' y='52' width='10' height='14' rx='2' fill='black'/%3E%3Crect x='6' y='92' width='10' height='14' rx='2' fill='black'/%3E%3Crect x='6' y='132' width='10' height='14' rx='2' fill='black'/%3E%3Crect x='6' y='172' width='10' height='14' rx='2' fill='black'/%3E%3C/mask%3E%3C/defs%3E%3Crect width='24' height='200' fill='black' mask='url(%23l)'/%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat-y",
              backgroundSize: "100% auto",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute right-0 top-0 z-[4] h-full w-[4%] min-w-[20px] bg-black"
            style={{
              boxShadow: "inset -2px 0 0 rgba(255,255,255,0.03)",
            }}
            aria-hidden
          />
        </>
      )}

      {/* Scratches — thin dark squiggly lines like aged film */}
      {enableScratches && (
        <div
          className="pointer-events-none absolute inset-0 z-[4] mix-blend-darken opacity-[0.12]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cpath d='M0 80 Q50 70 120 90 T250 85' stroke='%23000' stroke-width='0.4' fill='none'/%3E%3Cpath d='M50 180 Q180 165 320 190' stroke='%23000' stroke-width='0.3' fill='none'/%3E%3Cpath d='M20 280 Q100 270 200 285 T380 275' stroke='%23000' stroke-width='0.5' fill='none'/%3E%3Cpath d='M80 350 Q200 340 400 355' stroke='%23000' stroke-width='0.3' fill='none'/%3E%3Cpath d='M150 50 Q220 55 280 45' stroke='%23000' stroke-width='0.4' fill='none'/%3E%3C/svg%3E")`,
            backgroundSize: "cover",
          }}
          aria-hidden
        />
      )}

      {/* Flicker overlay */}
      {flicker && (
        <div
          className="cinematic-flicker pointer-events-none absolute inset-0 z-[3] bg-white"
          aria-hidden
        />
      )}

      {/* Gate weave (slight horizontal wobble) */}
      {gateWeave && (
        <div
          className="cinematic-gate-weave pointer-events-none absolute inset-0 z-[3]"
          aria-hidden
        />
      )}

      {/* Vignette */}
      {enableVignette && (
        <div
          className="pointer-events-none absolute inset-0 z-[3]"
          style={{
            boxShadow: "inset 0 0 25vmin 8vmin rgba(0,0,0,0.6)",
          }}
          aria-hidden
        />
      )}

      {/* Children (overlays, text, etc.) */}
      {children}
    </div>
  );
}
