"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import {
  HERO_BACKGROUND_COLOR,
  HERO_GRAIN_OPACITY,
  HERO_VIDEO_BLUR,
  HERO_YELLOW_TINT,
} from "@/lib/hero-video-styling";

export type CinematicStripScene = {
  id: string;
  videoSrc: string;
  holdVh?: number;
  content?: ReactNode | ((state: CinematicSceneRenderState) => ReactNode);
  contentClassName?: string;
  frameClassName?: string;
  videoClassName?: string;
  poster?: string;
};

export type CinematicSceneRenderState = {
  sceneIndex: number;
  holdProgress: number;
  isActive: boolean;
};

export type CinematicVideoStripProps = {
  scenes: CinematicStripScene[];
  holdVh?: number;
  gapVh?: number;
  frameHeightVh?: number;
  backgroundColor?: string;
  grainOpacity?: number;
  videoBlur?: number;
  tintColor?: string;
  tintBlendMode?: CSSProperties["mixBlendMode"];
  enableScratches?: boolean;
  enableScanlines?: boolean;
  enableVignette?: boolean;
  enableFlicker?: boolean;
  enableGateWeave?: boolean;
  className?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function FilmViewportOverlays({
  grainOpacity,
  tintColor,
  tintBlendMode,
  enableScratches,
  enableScanlines,
  enableVignette,
  enableFlicker,
  enableGateWeave,
}: {
  grainOpacity: number;
  tintColor: string;
  tintBlendMode: CSSProperties["mixBlendMode"];
  enableScratches: boolean;
  enableScanlines: boolean;
  enableVignette: boolean;
  enableFlicker: boolean;
  enableGateWeave: boolean;
}) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ backgroundColor: tintColor, mixBlendMode: tintBlendMode }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] mix-blend-overlay"
        style={{
          opacity: grainOpacity,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
        }}
        aria-hidden
      />
      {enableScanlines && (
        <div
          className="pointer-events-none absolute inset-0 z-[3] mix-blend-overlay opacity-[0.08]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 3px)",
          }}
          aria-hidden
        />
      )}
      {enableScratches && (
        <div
          className="pointer-events-none absolute inset-0 z-[4] mix-blend-screen opacity-[0.14]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 280'%3E%3Cpath d='M0 42 C230 56 460 30 760 42 C1060 54 1330 32 1600 46' stroke='white' stroke-opacity='0.22' stroke-width='1.2' fill='none'/%3E%3Cpath d='M0 98 C220 84 460 108 780 96 C1120 82 1380 106 1600 94' stroke='white' stroke-opacity='0.19' stroke-width='1.05' fill='none'/%3E%3Cpath d='M0 150 C250 160 520 134 790 146 C1080 158 1340 132 1600 144' stroke='white' stroke-opacity='0.2' stroke-width='1.1' fill='none'/%3E%3Cpath d='M0 210 C260 194 510 220 810 206 C1120 188 1380 216 1600 202' stroke='white' stroke-opacity='0.18' stroke-width='1.05' fill='none'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat-y",
            backgroundSize: "100% 32vh",
          }}
          aria-hidden
        />
      )}
      {enableFlicker && (
        <div className="cinematic-flicker pointer-events-none absolute inset-0 z-[5] bg-white" aria-hidden />
      )}
      {enableGateWeave && (
        <div className="cinematic-gate-weave pointer-events-none absolute inset-0 z-[5]" aria-hidden />
      )}
      {enableVignette && (
        <div
          className="pointer-events-none absolute inset-0 z-[6]"
          style={{ boxShadow: "inset 0 0 25vmin 8vmin rgba(0,0,0,0.6)" }}
          aria-hidden
        />
      )}
    </>
  );
}

export function CinematicVideoStrip({
  scenes,
  holdVh = 25,
  gapVh = 4,
  frameHeightVh = 70,
  backgroundColor = HERO_BACKGROUND_COLOR,
  grainOpacity = HERO_GRAIN_OPACITY,
  videoBlur = HERO_VIDEO_BLUR,
  tintColor = HERO_YELLOW_TINT.color,
  tintBlendMode = HERO_YELLOW_TINT.blendMode,
  enableScratches = true,
  enableScanlines = true,
  enableVignette = true,
  enableFlicker = true,
  enableGateWeave = true,
  className = "",
}: CinematicVideoStripProps) {
  const rootRef = useRef<HTMLElement>(null);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const [traveledVhState, setTraveledVhState] = useState(0);

  const stepVh = frameHeightVh + gapVh;
  const transitionVh = stepVh;
  const centerTopVh = (100 - frameHeightVh) / 2;
  const transitionCount = Math.max(scenes.length - 1, 0);
  const holdVhByScene = useMemo(() => scenes.map((scene) => scene.holdVh ?? holdVh), [scenes, holdVh]);
  const { sceneStartVh, scrollTrackVh } = useMemo(() => {
    const starts: number[] = [];
    let cursor = 0;
    for (let i = 0; i < scenes.length; i += 1) {
      starts.push(cursor);
      cursor += holdVhByScene[i];
      if (i < transitionCount) {
        cursor += transitionVh;
      }
    }
    return { sceneStartVh: starts, scrollTrackVh: scenes.length ? cursor : 0 };
  }, [holdVhByScene, scenes.length, transitionCount, transitionVh]);
  const initialStripYVh = scenes.length ? centerTopVh - stepVh : centerTopVh;
  const rootHeightVh = 100 + scrollTrackVh;
  const renderedScenes = scenes.length
    ? [
        {
          ...scenes[scenes.length - 1],
          id: `edge-top-${scenes[scenes.length - 1].id}`,
          content: undefined,
          sceneIndex: -1,
        },
        ...scenes.map((scene, sceneIndex) => ({ ...scene, sceneIndex })),
        {
          ...scenes[0],
          id: `edge-bottom-${scenes[0].id}`,
          content: undefined,
          sceneIndex: -1,
        },
      ]
    : [];
  const renderedSceneCount = renderedScenes.length;

  const stripYRaw = useMotionValue(initialStripYVh);
  const stripY = useTransform(stripYRaw, (v) => `${v}vh`);

  useEffect(() => {
    if (!scenes.length) return;

    const computeYFromTravel = (traveledVh: number) => {
      let remaining = clamp(traveledVh, 0, scrollTrackVh);
      let y = initialStripYVh;

      for (let i = 0; i < transitionCount; i += 1) {
        const currentHoldVh = holdVhByScene[i];
        if (remaining <= currentHoldVh) return y;
        remaining -= currentHoldVh;

        const moved = clamp(remaining, 0, transitionVh);
        y -= moved;
        if (remaining <= transitionVh) return y;
        remaining -= transitionVh;
      }

      return initialStripYVh - transitionCount * transitionVh;
    };

    const update = () => {
      const rootEl = rootRef.current;
      if (!rootEl) return;

      const rect = rootEl.getBoundingClientRect();
      const maxTravelPx = Math.max(rootEl.offsetHeight - window.innerHeight, 0);
      const traveledPx = clamp(-rect.top, 0, maxTravelPx);
      const traveledVh = (traveledPx / window.innerHeight) * 100;

      stripYRaw.set(computeYFromTravel(traveledVh));
      setTraveledVhState((current) => (Math.abs(current - traveledVh) > 0.04 ? traveledVh : current));
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, [
    holdVhByScene,
    initialStripYVh,
    scenes.length,
    sceneStartVh,
    scrollTrackVh,
    stripYRaw,
    transitionCount,
    transitionVh,
  ]);

  const activeSceneIndex = useMemo(() => {
    if (!scenes.length) return -1;
    const traveledVh = clamp(traveledVhState, 0, scrollTrackVh);

    for (let i = 0; i < scenes.length; i += 1) {
      const holdStartVh = sceneStartVh[i];
      const holdEndVh = holdStartVh + holdVhByScene[i];

      if (traveledVh <= holdEndVh || i === scenes.length - 1) {
        return i;
      }

      const transitionEndVh = holdEndVh + transitionVh;
      if (traveledVh < transitionEndVh) {
        const transitionProgress = (traveledVh - holdEndVh) / transitionVh;
        return transitionProgress < 0.5 ? i : i + 1;
      }
    }

    return scenes.length - 1;
  }, [holdVhByScene, sceneStartVh, scenes.length, scrollTrackVh, transitionVh, traveledVhState]);

  const activeRenderedIndex = activeSceneIndex >= 0 ? activeSceneIndex + 1 : 0;

  useEffect(() => {
    if (!renderedSceneCount) return;

    const playMin = activeRenderedIndex - 1;
    const playMax = activeRenderedIndex + 1;

    Object.entries(videoRefs.current).forEach(([indexKey, element]) => {
      if (!element) return;
      const index = Number(indexKey);
      const shouldPlay = index >= playMin && index <= playMax;

      if (shouldPlay) {
        if (!element.paused) return;
        const playPromise = element.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }
        return;
      }

      if (!element.paused) element.pause();
    });
  }, [activeRenderedIndex, renderedSceneCount]);

  return (
    <main ref={rootRef} className={`relative min-h-screen w-full ${className}`}>
      <div className="fixed inset-0 z-0 overflow-hidden p-2 sm:p-0" style={{ backgroundColor }}>
        <motion.div
          className="pointer-events-auto absolute inset-x-0 top-0 flex flex-col items-center"
          style={{
            y: stripY,
            minHeight: `${renderedScenes.length * stepVh}vh`,
            gap: `${gapVh}vh`,
          }}
        >
          {renderedScenes.map((scene, renderedIndex) => {
            let sceneContent: ReactNode = null;
            if (typeof scene.content === "function") {
              sceneContent =
                scene.sceneIndex >= 0
                  ? scene.content({
                      sceneIndex: scene.sceneIndex,
                      holdProgress: clamp(
                        (traveledVhState - sceneStartVh[scene.sceneIndex]) /
                          holdVhByScene[scene.sceneIndex],
                        0,
                        1
                      ),
                      isActive:
                        traveledVhState >= sceneStartVh[scene.sceneIndex] &&
                        traveledVhState <= sceneStartVh[scene.sceneIndex] + holdVhByScene[scene.sceneIndex],
                    })
                  : null;
            } else {
              sceneContent = scene.content ?? null;
            }

            const distanceFromActive = Math.abs(renderedIndex - activeRenderedIndex);
            const shouldPlayVideo = distanceFromActive <= 1;
            const shouldLoadVideo = distanceFromActive <= 2;
            const preloadMode: "none" | "metadata" | "auto" =
              shouldPlayVideo ? "auto" : shouldLoadVideo ? "metadata" : "none";

            return (
              <div
                key={scene.id}
                className={`relative shrink-0 overflow-hidden rounded-xl ${scene.frameClassName ?? ""}`}
                style={{
                  height: `${frameHeightVh}vh`,
                  width: `min(94vw, calc(${frameHeightVh}vh * 16 / 9))`,
                }}
              >
                <video
                  ref={(el) => {
                    videoRefs.current[renderedIndex] = el;
                  }}
                  src={shouldLoadVideo ? scene.videoSrc : undefined}
                  poster={scene.poster}
                  autoPlay={shouldPlayVideo}
                  muted
                  loop
                  playsInline
                  preload={shouldLoadVideo ? preloadMode : "none"}
                  onLoadedData={(event) => {
                    if (!shouldPlayVideo) return;
                    const video = event.currentTarget;
                    if (!video.paused) return;
                    const playPromise = video.play();
                    if (playPromise && typeof playPromise.catch === "function") {
                      playPromise.catch(() => {});
                    }
                  }}
                  className={`h-full w-full rounded-xl object-cover bg-black ${scene.videoClassName ?? ""}`}
                  style={videoBlur > 0 ? { filter: `blur(${videoBlur}px)` } : undefined}
                />
                <div className={`absolute inset-0 z-[1] ${scene.contentClassName ?? ""}`}>
                  {sceneContent}
                </div>
              </div>
            );
          })}
        </motion.div>

        <FilmViewportOverlays
          grainOpacity={grainOpacity}
          tintColor={tintColor}
          tintBlendMode={tintBlendMode}
          enableScratches={enableScratches}
          enableScanlines={enableScanlines}
          enableVignette={enableVignette}
          enableFlicker={enableFlicker}
          enableGateWeave={enableGateWeave}
        />
      </div>

      <section className="pointer-events-none relative z-10" style={{ height: `${rootHeightVh}vh` }}>
        {scenes.map((scene, index) => (
          <span
            key={`anchor-${scene.id}`}
            id={scene.id}
            className="absolute left-0 top-0 h-px w-px"
            style={{ top: `${sceneStartVh[index] + holdVhByScene[index]}vh` }}
            aria-hidden
          />
        ))}
      </section>
    </main>
  );
}
