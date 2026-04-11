"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEvent,
  type WheelEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";
import { motion } from "motion/react";
import {
  CinematicVideoStrip,
  type CinematicSceneRenderState,
  type CinematicStripScene,
} from "@/components/cinematic-video-strip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Guest, Invitee } from "@/db/schema";
import { RSVP_CLOSED_MESSAGE, RSVP_DEADLINE_LABEL, isRsvpClosed } from "@/lib/rsvp-deadline";

const ScrollGuideBumpContext = createContext<(() => void) | undefined>(undefined);

const SCROLL_HINT_NUDGE_COOLDOWN_MS = 550;

const WEDDING_DATE_TARGET = new Date("2026-08-20T14:30:00+08:00");

type CountdownParts = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

const PROGRAM_ITEMS = [
  { time: "02:30", title: "Wedding ceremony" },
  { time: "06:00", title: "Reception" },
  { time: "07:00", title: "Dinner" },
  { time: "08:00", title: "Cake slicing and speech" },
  { time: "09:00", title: "First dance and party" },
  { time: "10:00", title: "Send off" },
];

const SECTION_TWO_CAROUSEL_PHOTOS = [
  { src: "/images/carousel/carousel_1.webp", caption: "where it all began" },
  { src: "/images/carousel/carousel_busay.webp" },
  { src: "/images/carousel/carousel_peppa.webp" },
  { src: "/images/carousel/carousel_sg.jpeg", caption: "travels..." },
  { src: "/images/carousel/carousel_thai.jpeg" },
  { src: "/images/carousel/carousel_bar.webp" },
  { src: "/images/carousel/carousel_cablecar.webp" },
  { src: "/images/carousel/carousel_penny.jpg", caption: "milestones" },
  { src: "/images/carousel/carousel_melvin.JPG" },
  { src: "/images/carousel/carousel_tavolata.webp", caption: "dates" },
  { src: "/images/carousel/carousel_film.webp" },
  { src: "/images/carousel/carousel_tagaytay.webp" },
  { src: "/images/carousel/carousel_oceanpark.webp" },
  { src: "/images/carousel/carousel_lake.webp" },
];

const STORY_CAROUSEL_HOLD_VH = Math.max(100, SECTION_TWO_CAROUSEL_PHOTOS.length * 14);

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function getCountdownParts(target: Date): CountdownParts {
  const diffMs = Math.max(target.getTime() - Date.now(), 0);
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: pad2(days),
    hours: pad2(hours),
    minutes: pad2(minutes),
    seconds: pad2(seconds),
  };
}

function SceneOneTypewriter() {
  const text = "kristoffer and aubrey";
  const [visibleLength, setVisibleLength] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    if (visibleLength >= text.length) return;
    const timer = setTimeout(() => {
      setVisibleLength((current) => current + 1);
    }, 80);
    return () => clearTimeout(timer);
  }, [text.length, visibleLength]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCursorVisible((current) => !current);
    }, 530);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-full items-center justify-center p-4 text-center sm:p-6">
      <h1
        className="font-mono text-4xl font-bold text-white sm:text-6xl"
        style={{
          textShadow:
            "0 2px 4px rgba(0,0,0,0.72), 0 0 14px rgba(0,0,0,0.5), 0 0 24px rgba(0,0,0,0.34)",
        }}
      >
        {text.slice(0, visibleLength)}
        <span
          className={`ml-[2px] inline-block w-0.5 align-bottom ${
            cursorVisible ? "opacity-100" : "opacity-0"
          } bg-white`}
          style={{ height: "1em" }}
          aria-hidden
        />
      </h1>
    </div>
  );
}

function SceneTwoPhotoCarousel({ holdProgress }: { holdProgress: number }) {
  const bumpScrollHint = useContext(ScrollGuideBumpContext);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxShiftPx, setMaxShiftPx] = useState(0);
  const [smoothShiftPx, setSmoothShiftPx] = useState(0);
  const smoothShiftPxRef = useRef(0);
  const shiftAnimationRef = useRef<number | null>(null);
  const scrollHintLastNudgeAtRef = useRef(0);
  const touchOriginRef = useRef<{ x: number; y: number } | null>(null);
  const touchNudgedRef = useRef(false);

  const maybeBumpScrollHint = useCallback(() => {
    if (!bumpScrollHint) return;
    const now = Date.now();
    if (now - scrollHintLastNudgeAtRef.current < SCROLL_HINT_NUDGE_COOLDOWN_MS) return;
    scrollHintLastNudgeAtRef.current = now;
    bumpScrollHint();
  }, [bumpScrollHint]);

  const onCarouselWheel = useCallback(
    (e: WheelEvent<HTMLDivElement>) => {
      const horizontalIntent =
        (e.shiftKey && Math.abs(e.deltaY) > 1) ||
        (Math.abs(e.deltaX) > 8 && Math.abs(e.deltaX) > Math.abs(e.deltaY));
      if (!horizontalIntent) return;
      maybeBumpScrollHint();
    },
    [maybeBumpScrollHint]
  );

  const onCarouselTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) {
      touchOriginRef.current = null;
      return;
    }
    touchOriginRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    touchNudgedRef.current = false;
  }, []);

  const onCarouselTouchMove = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (!touchOriginRef.current || touchNudgedRef.current || e.touches.length !== 1) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const dx = x - touchOriginRef.current.x;
      const dy = y - touchOriginRef.current.y;
      if (Math.abs(dx) < 28) return;
      if (Math.abs(dx) < Math.abs(dy) * 1.15) return;
      touchNudgedRef.current = true;
      maybeBumpScrollHint();
    },
    [maybeBumpScrollHint]
  );

  useEffect(() => {
    const measure = () => {
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!viewport || !track) return;
      setMaxShiftPx(Math.max(track.scrollWidth - viewport.clientWidth, 0));
    };

    measure();
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (ro) {
      if (viewportRef.current) ro.observe(viewportRef.current);
      if (trackRef.current) ro.observe(trackRef.current);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, []);

  const carouselProgress = Math.min(holdProgress / 0.88, 1);
  const targetShiftPx = maxShiftPx * carouselProgress;

  useEffect(() => {
    if (holdProgress >= 0.94) {
      if (shiftAnimationRef.current) {
        cancelAnimationFrame(shiftAnimationRef.current);
      }
      shiftAnimationRef.current = requestAnimationFrame(() => {
        smoothShiftPxRef.current = targetShiftPx;
        setSmoothShiftPx(targetShiftPx);
        shiftAnimationRef.current = null;
      });
      return;
    }

    if (shiftAnimationRef.current) {
      cancelAnimationFrame(shiftAnimationRef.current);
      shiftAnimationRef.current = null;
    }

    const animate = () => {
      const current = smoothShiftPxRef.current;
      const next = current + (targetShiftPx - current) * 0.18;

      if (Math.abs(targetShiftPx - next) <= 0.2) {
        smoothShiftPxRef.current = targetShiftPx;
        setSmoothShiftPx(targetShiftPx);
        shiftAnimationRef.current = null;
        return;
      }

      smoothShiftPxRef.current = next;
      setSmoothShiftPx(next);
      shiftAnimationRef.current = requestAnimationFrame(animate);
    };

    shiftAnimationRef.current = requestAnimationFrame(animate);

    return () => {
      if (shiftAnimationRef.current) {
        cancelAnimationFrame(shiftAnimationRef.current);
        shiftAnimationRef.current = null;
      }
    };
  }, [holdProgress, targetShiftPx]);

  return (
    <div className="flex h-full items-center justify-center p-4 sm:p-6">
      <div className="w-full">
        <p
          className="mb-3 text-center font-mono text-2xl font-extrabold tracking-[0.06em] text-white sm:mb-5 sm:text-4xl"
          style={{
            textShadow:
              "0 2px 4px rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.75), 0 0 30px rgba(0,0,0,0.5)",
          }}
        >
          Our Story
        </p>
        <div
          ref={viewportRef}
          className="w-full overflow-hidden py-1 sm:py-2"
          onWheel={onCarouselWheel}
          onTouchStart={onCarouselTouchStart}
          onTouchMove={onCarouselTouchMove}
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
          }}
        >
        <div
          ref={trackRef}
          className="flex items-start gap-2 pr-[12vw] sm:gap-3 sm:pr-[9vw] lg:pr-[7vw]"
          style={{
            transform: `translateX(-${smoothShiftPx}px)`,
            willChange: "transform",
          }}
        >
          {SECTION_TWO_CAROUSEL_PHOTOS.map((photo, index) => (
            <div key={`${photo.src}-${index}`} className="w-[60vw] shrink-0 sm:w-[34vw] lg:w-[26vw]">
              <Image
                src={photo.src}
                alt={`Wedding memory ${index + 1}`}
                width={720}
                height={480}
                sizes="(max-width: 640px) 60vw, (max-width: 1024px) 34vw, 26vw"
                className="aspect-square w-full rounded-md object-cover"
              />
              {photo.caption && (
                <p
                  className="mt-2 px-1 font-mono text-xs font-bold text-white sm:text-sm"
                  style={{
                    textShadow:
                      "0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.75), 0 0 18px rgba(0,0,0,0.55)",
                  }}
                >
                  {photo.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}

function SceneTwoCountdown({ holdProgress }: { holdProgress: number }) {
  const [countdown, setCountdown] = useState<CountdownParts>(() => getCountdownParts(WEDDING_DATE_TARGET));

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdownParts(WEDDING_DATE_TARGET));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const units = [
    { label: "days", value: countdown.days },
    { label: "hours", value: countdown.hours },
    { label: "minutes", value: countdown.minutes },
    { label: "seconds", value: countdown.seconds },
  ];
  const dateText = "AUGUST 20, 2026 (THU)";
  const timeText = "2:30 PM";
  void holdProgress;

  return (
    <div className="flex h-full items-center justify-center p-6 text-center">
      <div
        className="font-mono text-white"
        style={{
          textShadow:
            "0 2px 4px rgba(0,0,0,0.72), 0 0 14px rgba(0,0,0,0.5), 0 0 24px rgba(0,0,0,0.34)",
        }}
      >
        <div className="grid grid-cols-4 gap-1.5 sm:gap-4">
          {units.map((unit) => {
            return (
              <div
                key={unit.label}
                className="min-w-0 rounded-md border border-white/30 bg-black/25 px-1.5 py-2.5 sm:px-3 sm:py-4"
              >
                <p className="truncate font-mono text-[clamp(1.15rem,6.2vw,1.9rem)] font-bold leading-none tabular-nums sm:text-5xl">
                  {unit.value}
                </p>
                <p className="mt-2 text-[9px] font-semibold tracking-[0.12em] text-white/85 sm:text-xs sm:tracking-[0.16em]">
                  {unit.label}
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-xl font-bold uppercase tracking-[0.2em] text-white sm:text-3xl">
          {dateText}
        </p>
        <p className="mt-3 text-lg font-medium tracking-[0.18em] text-white/95 sm:text-2xl">
          {timeText}
        </p>
      </div>
    </div>
  );
}

function VenueRevealScene({
  holdProgress,
  header,
  venueText,
  imageSrc,
  imageAlt,
  mapsLink,
}: {
  holdProgress: number;
  header: string;
  venueText: string;
  imageSrc: string;
  imageAlt: string;
  mapsLink: string;
}) {
  const typingProgress = Math.min(holdProgress / 0.58, 1);
  const typedLength = Math.floor(typingProgress * venueText.length);
  const revealProgress = Math.min(Math.max((holdProgress - 0.62) / 0.3, 0), 1);

  return (
    <div
      className="flex h-full flex-col p-4 text-white sm:p-6"
      style={{
        textShadow:
          "0 2px 4px rgba(0,0,0,0.72), 0 0 14px rgba(0,0,0,0.5), 0 0 24px rgba(0,0,0,0.34)",
      }}
    >
      <p className="text-left font-mono text-sm font-semibold uppercase tracking-[0.18em] sm:text-base">
        {header}
      </p>

      <div className="mt-4">
        <h2 className="font-mono text-3xl font-bold sm:text-5xl">
          {venueText.slice(0, typedLength)}
          {typingProgress < 1 && (
            <span className="ml-[2px] inline-block h-[1em] w-0.5 animate-pulse bg-white align-bottom" />
          )}
        </h2>
      </div>

      <div
        className="pointer-events-auto mt-auto w-full max-w-[440px] overflow-hidden rounded-lg border border-white/40 bg-black/25 sm:ml-auto sm:max-w-[520px]"
        style={{
          opacity: revealProgress,
          transform: `translateY(${(1 - revealProgress) * 18}px) scale(${0.96 + revealProgress * 0.04})`,
        }}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={720}
          height={480}
          sizes="(max-width: 640px) 100vw, 520px"
          className="h-56 w-full object-cover sm:h-64"
        />
        <a
          href={mapsLink}
          target="_blank"
          rel="noreferrer"
          className="block px-4 py-3 text-center font-mono text-xs font-semibold uppercase tracking-[0.14em] text-white underline decoration-white/70 underline-offset-3 sm:text-sm"
        >
          Open in Google Maps
        </a>
      </div>
    </div>
  );
}

function SceneThreeVenue({ holdProgress }: { holdProgress: number }) {
  return (
    <VenueRevealScene
      holdProgress={holdProgress}
      header="Please join us at..."
      venueText="Redemptorist Church"
      imageSrc="/images/venues/redemptorist.jpg"
      imageAlt="Redemptorist Church"
      mapsLink="https://maps.app.goo.gl/KoUTB73YiY9NqnJeA"
    />
  );
}

function SceneFourVenue({ holdProgress }: { holdProgress: number }) {
  return (
    <VenueRevealScene
      holdProgress={holdProgress}
      header="And..."
      venueText="Beverly View Events Pavillion"
      imageSrc="/images/venues/beverly.jpg"
      imageAlt="Beverly View Events Pavilion"
      mapsLink="https://maps.app.goo.gl/BexKk87q2VL8twJv8"
    />
  );
}

function SceneFiveProgram({ holdProgress }: { holdProgress: number }) {
  void holdProgress;

  return (
    <div
      className="flex h-full flex-col p-4 text-white sm:p-6"
      style={{
        textShadow:
          "0 2px 4px rgba(0,0,0,0.72), 0 0 14px rgba(0,0,0,0.5), 0 0 24px rgba(0,0,0,0.34)",
      }}
    >
      <div className="flex flex-1 items-center justify-center px-2 py-4">
        <div className="w-full max-w-[860px] rounded-lg border border-white/35 bg-black/45 px-4 py-5 sm:px-6 sm:py-6">
          <p className="mb-3 text-center font-mono text-2xl font-extrabold tracking-[0.06em] text-white sm:mb-5 sm:text-4xl">
            What&apos;s the plan?
          </p>
          <div className="space-y-1.5 sm:space-y-2">
            {PROGRAM_ITEMS.map((item) => {
              return (
                <div key={`${item.time}-${item.title}`} className="font-mono text-center">
                  <p className="text-base font-medium sm:text-2xl">
                    <span className="font-bold tracking-[0.08em]">{item.time}</span>
                    <span className="mx-2 text-white/70">-</span>
                    <span>{item.title}</span>
                  </p>
                </div>
              );
            })}
          </div>
          <p className="mx-auto mt-5 max-w-3xl text-center font-mono text-[11px] leading-relaxed text-white/85 sm:mt-6 sm:text-sm">
            We have chosen to hold an intimate wedding so that we may celebrate this meaningful
            milestone with the people who matter most to us.
          </p>
        </div>
      </div>
    </div>
  );
}

function DressCodeColorDots({
  includeWhite = true,
  revealProgress = 1,
}: {
  includeWhite?: boolean;
  revealProgress?: number;
}) {
  const clampedReveal = Math.min(Math.max(revealProgress, 0), 1);
  const colors = includeWhite
    ? [
        "bg-black border-white/40",
        "bg-white border-white/50",
        "bg-blue-500 border-white/40",
        "bg-[#1f2a44] border-white/40",
      ]
    : ["bg-black border-white/40", "bg-blue-500 border-white/40", "bg-[#1f2a44] border-white/40"];

  return (
    <div
      className="mt-3 flex items-center gap-3 sm:mt-4 sm:gap-4"
      aria-label="Avoid black, white, blue, and navy blue"
    >
      {colors.map((colorClass, index) => {
        const dotStart = 0.08 + index * 0.16;
        const dotProgress = Math.min(Math.max((clampedReveal - dotStart) / 0.22, 0), 1);
        const dotScale = 0.55 + dotProgress * 0.45;
        return (
          <span
            key={`${colorClass}-${index}`}
            className={`inline-block h-7 w-7 rounded-full border sm:h-9 sm:w-9 ${colorClass}`}
            style={{
              opacity: dotProgress,
              transform: `scale(${dotScale})`,
              transformOrigin: "center",
            }}
          />
        );
      })}
    </div>
  );
}

function DressCodePanel({
  label,
  attireText,
  imageSrc,
  imageAlt,
  portraitImage = false,
  includeWhiteColor = true,
  revealProgress = 1,
  colorDotsProgress = 1,
}: {
  label: string;
  attireText?: string;
  imageSrc: string;
  imageAlt: string;
  portraitImage?: boolean;
  includeWhiteColor?: boolean;
  revealProgress?: number;
  colorDotsProgress?: number;
}) {
  const clampedReveal = Math.min(Math.max(revealProgress, 0), 1);
  const clampedDotsReveal = Math.min(Math.max(colorDotsProgress, 0), 1);
  const photoDevelopProgress = Math.min(Math.max((clampedReveal - 0.05) / 0.42, 0), 1);
  const photoBlur = (1 - photoDevelopProgress) * 8;
  const photoGrayscale = 1 - photoDevelopProgress;
  const photoSaturate = 0.25 + photoDevelopProgress * 0.75;
  const photoContrast = 0.85 + photoDevelopProgress * 0.15;
  const photoOpacity = 0.45 + photoDevelopProgress * 0.55;

  return (
    <div className="grid items-center gap-3 rounded-lg border border-white/30 bg-black/30 p-3 sm:grid-cols-[1fr_1.2fr] sm:gap-5 sm:p-4">
      <Dialog>
        <div className={portraitImage ? "mx-auto inline-flex flex-col items-center sm:mx-0" : ""}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="inline-flex cursor-zoom-in overflow-hidden rounded-md transition-opacity hover:opacity-90"
              aria-label={`Open ${label} dress code photo preview`}
            >
              <Image
                src={imageSrc}
                alt={imageAlt}
                width={640}
                height={420}
                sizes="(max-width: 640px) 52vw, 325px"
                className={`block object-cover ${
                  portraitImage
                    ? "aspect-square w-[52vw] max-w-[275px] sm:w-[32vw] sm:max-w-[325px]"
                    : "h-32 w-full sm:h-40"
                }`}
                style={{
                  filter: `grayscale(${photoGrayscale}) saturate(${photoSaturate}) contrast(${photoContrast}) blur(${photoBlur}px)`,
                  opacity: photoOpacity,
                }}
              />
            </button>
          </DialogTrigger>
          {portraitImage && (
            <p className="mt-1 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-white/55 sm:text-xs">
              Click photo to open
            </p>
          )}
        </div>
        <DialogContent
          showCloseButton={false}
          overlayClassName="bg-black/20 backdrop-blur-[1px]"
          className="w-auto max-w-[calc(100vw-0.75rem)] border-none bg-transparent p-0 shadow-none sm:max-w-[calc(100%-2rem)]"
        >
          <DialogTitle className="sr-only">{label} dress code photo preview</DialogTitle>
          <div className="flex flex-col items-end gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                className="font-mono !text-white hover:!text-black focus:!text-white"
                style={{ textShadow: "none" }}
              >
                Close
                <XIcon />
              </Button>
            </DialogClose>
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={1600}
              height={2200}
              sizes="100vw"
              className="h-[calc(100vh-5.75rem)] w-auto max-w-full rounded-xl object-contain sm:h-[88vh] sm:max-w-[calc(100vw-3rem)]"
            />
          </div>
        </DialogContent>
      </Dialog>
      <div className="text-left">
        <p className="font-mono text-lg font-bold text-white sm:text-2xl">{label}</p>
        {attireText && (
          <p className="mt-1 font-mono text-xs tracking-[0.08em] text-white/90 sm:text-sm">{attireText}</p>
        )}
        <p className="mt-1 font-mono text-xs tracking-[0.08em] text-white/90 sm:text-sm">
          Please avoid wearing the following colors.
        </p>
        <DressCodeColorDots includeWhite={includeWhiteColor} revealProgress={clampedDotsReveal} />
      </div>
    </div>
  );
}

function SceneSixDressCodeLadies({ holdProgress }: { holdProgress: number }) {
  const panelReveal = Math.min(Math.max((holdProgress - 0.06) / 0.28, 0), 1);
  const panelTranslateX = (1 - panelReveal) * -90;
  const dotsReveal = Math.min(Math.max((holdProgress - 0.56) / 0.32, 0), 1);

  return (
    <div
      className="flex h-full flex-col items-center justify-center p-4 text-white sm:p-6"
      style={{
        textShadow:
          "0 2px 4px rgba(0,0,0,0.72), 0 0 14px rgba(0,0,0,0.5), 0 0 24px rgba(0,0,0,0.34)",
      }}
    >
      <div
        className="w-full max-w-4xl"
        style={{
          opacity: panelReveal,
          transform: `translateX(${panelTranslateX}px)`,
        }}
      >
        <p className="mb-3 text-center font-mono text-2xl font-extrabold tracking-[0.06em] sm:mb-5 sm:text-4xl">
          What to wear
        </p>
        <DressCodePanel
          label="Ladies"
          attireText="Long dress"
          imageSrc="/images/dress-code/ladies.jpeg"
          imageAlt="Ladies dress code inspiration"
          portraitImage={true}
          revealProgress={panelReveal}
          colorDotsProgress={dotsReveal}
        />
      </div>
    </div>
  );
}

function SceneSevenDressCodeGents({ holdProgress }: { holdProgress: number }) {
  const panelReveal = Math.min(Math.max((holdProgress - 0.06) / 0.28, 0), 1);
  const panelTranslateX = (1 - panelReveal) * 90;
  const dotsReveal = Math.min(Math.max((holdProgress - 0.56) / 0.32, 0), 1);

  return (
    <div
      className="flex h-full flex-col items-center justify-center p-4 text-white sm:p-6"
      style={{
        textShadow:
          "0 2px 4px rgba(0,0,0,0.72), 0 0 14px rgba(0,0,0,0.5), 0 0 24px rgba(0,0,0,0.34)",
      }}
    >
      <div
        className="w-full max-w-4xl"
        style={{
          opacity: panelReveal,
          transform: `translateX(${panelTranslateX}px)`,
        }}
      >
        <p className="mb-3 text-center font-mono text-2xl font-extrabold tracking-[0.06em] sm:mb-5 sm:text-4xl">
          What to wear
        </p>
        <DressCodePanel
          label="Gents"
          attireText="Barong"
          imageSrc="/images/dress-code/gents.jpg"
          imageAlt="Gents dress code inspiration"
          portraitImage={true}
          includeWhiteColor={false}
          revealProgress={panelReveal}
          colorDotsProgress={dotsReveal}
        />
      </div>
    </div>
  );
}

const WISHLIST_TEXT =
  "If you feel like bringing a little something but aren't sure what to get us, we've put together a few wishes to help us start our married life.";

function SceneEightWishlist({ holdProgress }: { holdProgress: number }) {
  const [cursorVisible, setCursorVisible] = useState(true);
  const typingProgress = Math.min(holdProgress / 0.65, 1);
  const typedLength = Math.floor(typingProgress * WISHLIST_TEXT.length);
  const showCursor = typedLength < WISHLIST_TEXT.length;
  const buttonReveal = Math.min(Math.max((holdProgress - 0.7) / 0.25, 0), 1);

  useEffect(() => {
    if (!showCursor) return;
    const timer = setInterval(() => setCursorVisible((c) => !c), 530);
    return () => clearInterval(timer);
  }, [showCursor]);

  return (
    <div
      className="flex h-full flex-col items-start justify-start p-6 pt-10 text-white sm:p-8 sm:pt-12"
      style={{
        textShadow:
          "0 2px 4px rgba(0,0,0,0.72), 0 0 14px rgba(0,0,0,0.5), 0 0 24px rgba(0,0,0,0.34)",
      }}
    >
      <p className="w-full max-w-2xl text-left font-mono text-xl leading-relaxed sm:text-2xl">
        {WISHLIST_TEXT.slice(0, typedLength)}
        {showCursor && (
          <span
            className={`ml-0.5 inline-block h-[1em] w-0.5 align-bottom bg-white ${
              cursorVisible ? "opacity-100" : "opacity-0"
            }`}
            style={{ transition: "opacity 0s" }}
            aria-hidden
          />
        )}
      </p>
      <div
        className="mt-8"
        style={{
          opacity: buttonReveal,
          transform: `translateY(${(1 - buttonReveal) * 12}px)`,
        }}
      >
        <Link
          href="/wishlist"
          className="inline-flex h-9 items-center justify-center rounded-md border border-white px-4 py-2 font-mono text-sm font-bold uppercase tracking-[0.12em] text-black shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-colors hover:bg-white/80 bg-white/65"
          style={{ textShadow: "none" }}
          aria-label="View wishlist"
        >
          View wishlist
        </Link>
      </div>
    </div>
  );
}

type InviteeLookupResponse = {
  invitee: Invitee;
  guests: Guest[];
};
type GuestResponseMap = Record<string, boolean | null>;
type GuestRespondedMap = Record<string, boolean>;

function SceneNineRsvp({ initialSlug }: { initialSlug?: string }) {
  const router = useRouter();
  const [invitee, setInvitee] = useState<Invitee | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [responses, setResponses] = useState<GuestResponseMap>({});
  const [respondedByGuestId, setRespondedByGuestId] = useState<GuestRespondedMap>({});
  const [familyName, setFamilyName] = useState("");
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "error">("idle");
  const [lookupMessage, setLookupMessage] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const rsvpClosed = isRsvpClosed();

  const normalizedSlug = initialSlug?.trim();
  const showDeadlineInInviteText = !rsvpClosed;

  const applyInviteePayload = (payload: InviteeLookupResponse) => {
    setInvitee(payload.invitee);
    setGuests(payload.guests);
    const nextResponses: GuestResponseMap = {};
    const nextResponded: GuestRespondedMap = {};
    for (const guest of payload.guests) {
      nextResponses[guest.id] = guest.attending ?? null;
      nextResponded[guest.id] = Boolean(guest.respondedAt);
    }
    setResponses(nextResponses);
    setRespondedByGuestId(nextResponded);
    setLookupStatus("idle");
    setLookupMessage("");
  };

  const loadInvitee = async (query: { slug?: string; familyName?: string }) => {
    const params = new URLSearchParams();
    if (query.slug) params.set("slug", query.slug);
    if (query.familyName) params.set("familyName", query.familyName);

    const res = await fetch(`/api/rsvp/invitee?${params.toString()}`);
    if (!res.ok) {
      const errData = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(errData?.error ?? "Invitation not found");
    }

    const data = (await res.json()) as InviteeLookupResponse;
    return data;
  };

  useEffect(() => {
    if (!normalizedSlug) return;
    let active = true;

    (async () => {
      setLookupStatus("loading");
      setLookupMessage("");
      try {
        const payload = await loadInvitee({ slug: normalizedSlug });
        if (!active) return;
        applyInviteePayload(payload);
      } catch (err) {
        if (!active) return;
        setLookupStatus("error");
        setLookupMessage(err instanceof Error ? err.message : "Failed to load invitee");
      }
    })();

    return () => {
      active = false;
    };
  }, [normalizedSlug]);

  const handleFamilyLookup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (rsvpClosed) return;
    const trimmed = familyName.trim();
    if (!trimmed) return;

    setLookupStatus("loading");
    setLookupMessage("");
    try {
      const payload = await loadInvitee({ familyName: trimmed });
      applyInviteePayload(payload);
      router.push(`/${payload.invitee.slug}#rsvp`);
      setLookupMessage(`Welcome, ${payload.invitee.displayName}.`);
    } catch (err) {
      setLookupStatus("error");
      setLookupMessage(err instanceof Error ? err.message : "Failed to find family");
    }
  };

  const submitRsvp = async (
    nextResponses: GuestResponseMap,
    options?: { allowNoCheckedMembers?: boolean }
  ) => {
    if (!invitee) return;
    if (rsvpClosed) {
      setSubmitStatus("error");
      setSubmitMessage(RSVP_CLOSED_MESSAGE);
      return;
    }
    if (
      invitee.type === "family" &&
      !options?.allowNoCheckedMembers &&
      !guests.some((guest) => nextResponses[guest.id] === true)
    ) {
      setSubmitStatus("error");
      setSubmitMessage("Please check at least one family member before submitting RSVP.");
      return;
    }
    setSubmitMessage("");
    setSubmitStatus("submitting");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteeId: invitee.id,
          responses: guests.map((guest) => ({
            guestId: guest.id,
            attending: nextResponses[guest.id] ?? null,
          })),
        }),
      });
      if (!res.ok) {
        const errData = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errData?.error ?? "Failed to submit RSVP");
      }
      const nextResponded: GuestRespondedMap = {};
      for (const guest of guests) {
        nextResponded[guest.id] = nextResponses[guest.id] !== null;
      }
      setRespondedByGuestId(nextResponded);
      setSubmitStatus("success");
      setSubmitMessage("");
    } catch (err) {
      setSubmitStatus("error");
      setSubmitMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  const isFamily = invitee?.type === "family";
  const individualGuest = guests[0];

  return (
    <div
      className="flex h-full flex-col items-center justify-start p-4 pt-8 text-white sm:p-6 sm:pt-10"
      style={{
        textShadow:
          "0 2px 4px rgba(0,0,0,0.72), 0 0 14px rgba(0,0,0,0.5), 0 0 24px rgba(0,0,0,0.34)",
      }}
    >
      <h2 className="text-center font-mono text-6xl font-extrabold tracking-[0.08em] sm:text-8xl md:text-9xl">
        RSVP
      </h2>
      {rsvpClosed && (
        <p className="mt-3 text-center font-mono text-base text-white/90 sm:text-lg">{RSVP_CLOSED_MESSAGE}</p>
      )}
      {!rsvpClosed && !invitee && (
        <p className="mt-3 text-center font-mono text-sm text-white/90 sm:text-base">
          Kindly submit your reply by {RSVP_DEADLINE_LABEL}.
        </p>
      )}

      {!invitee && !rsvpClosed && (
        <form
          onSubmit={handleFamilyLookup}
          className="mt-8 w-full max-w-xl rounded-lg border border-white/35 bg-black/35 p-4 sm:p-6"
        >
          <p className="mb-4 text-center font-mono text-sm text-white/90 sm:text-base">
            Enter your family name or your last name to continue.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={familyName}
              onChange={(event) => setFamilyName(event.target.value)}
              placeholder="Family name or last name"
              className="font-mono text-white placeholder:text-white/50"
            />
            <Button type="submit" disabled={lookupStatus === "loading"} className="font-mono">
              {lookupStatus === "loading" ? "Finding..." : "Continue"}
            </Button>
          </div>
          {lookupMessage && (
            <p
              className={`mt-3 text-center font-mono text-sm ${
                lookupStatus === "error" ? "text-red-300" : "text-white/85"
              }`}
            >
              {lookupMessage}
            </p>
          )}
        </form>
      )}

      {invitee && isFamily && !rsvpClosed && (
        <div className="rsvp-scroll-panel mt-7 max-h-[68vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-white/35 bg-black/35 p-4 sm:max-h-[64vh] sm:p-6">
          <p className="mb-4 text-center font-mono text-sm leading-relaxed text-white/95 sm:text-lg">
            We&apos;re so happy to celebrate with {invitee.displayName}. We truly hope you can join us, and
            please let us know who will be attending:
            {showDeadlineInInviteText && (
              <span className="mt-2 block text-sm font-semibold text-white/90 sm:text-base">
                Kindly submit your reply by {RSVP_DEADLINE_LABEL}.
              </span>
            )}
          </p>
          {guests.some((guest) => respondedByGuestId[guest.id]) && (
            <p className="mb-3 text-center font-mono text-xs text-white/85 sm:text-sm">
              Members marked as responded can still update their answer before {RSVP_DEADLINE_LABEL}.
            </p>
          )}
          <ul className="space-y-3">
            {guests.map((guest) => {
              const memberResponse = responses[guest.id] ?? null;

              return (
                <li key={guest.id} className="flex items-center gap-3">
                  <div className="flex w-full items-center gap-2">
                    <span className="font-mono text-white sm:text-lg">{guest.name}</span>
                    <div className="relative ml-auto grid h-8 w-28 grid-cols-2 overflow-hidden rounded-md border border-white/30">
                      <motion.span
                        aria-hidden
                        initial={false}
                        className="pointer-events-none absolute inset-y-0 w-1/2"
                        animate={{
                          left: memberResponse === true ? "50%" : "0%",
                          opacity: memberResponse === null ? 0 : 1,
                          backgroundColor:
                            memberResponse === true ? "rgba(16,185,129,0.85)" : "rgba(239,68,68,0.85)",
                        }}
                        transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.45 }}
                      />
                      <button
                        type="button"
                        aria-label={`${guest.name} not attending`}
                        aria-pressed={memberResponse === false}
                        className={`relative z-10 flex h-8 items-center justify-center px-2 font-mono text-xs uppercase tracking-[0.06em] transition-colors ${
                          memberResponse === false
                            ? "text-white"
                            : "text-white/80 hover:bg-white/10"
                        }`}
                        onClick={() =>
                          setResponses((prev) => ({
                            ...prev,
                            [guest.id]: prev[guest.id] === false ? null : false,
                          }))
                        }
                      >
                        No
                      </button>
                      <button
                        type="button"
                        aria-label={`${guest.name} attending`}
                        aria-pressed={memberResponse === true}
                        className={`relative z-10 flex h-8 items-center justify-center border-l border-white/30 px-2 font-mono text-xs uppercase tracking-[0.06em] transition-colors ${
                          memberResponse === true
                            ? "text-white"
                            : "text-white/80 hover:bg-white/10"
                        }`}
                        onClick={() =>
                          setResponses((prev) => ({
                            ...prev,
                            [guest.id]: prev[guest.id] === true ? null : true,
                          }))
                        }
                      >
                        Yes
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="sticky bottom-0 mt-5 rounded-md border border-white/20 bg-black/70 p-2 shadow-[0_-8px_20px_rgba(0,0,0,0.35)] backdrop-blur-[2px]">
            <div className="flex">
              <Button
                type="button"
                onClick={() => void submitRsvp(responses)}
                disabled={submitStatus === "submitting"}
                className="w-full font-mono"
              >
                {submitStatus === "submitting" ? "Submitting..." : "Submit RSVP"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {invitee && !isFamily && !rsvpClosed && (
        <div className="mt-7 w-full max-w-2xl rounded-lg border border-white/35 bg-black/35 p-4 text-center sm:p-6">
          <p className="mb-5 font-mono text-sm leading-relaxed text-white/95 sm:text-lg">
            We&apos;re so happy to invite {individualGuest?.name ?? invitee.displayName} to celebrate this day
            with us, and we sincerely hope you&apos;re able to come.
            {showDeadlineInInviteText && (
              <span className="mt-2 block text-sm font-semibold text-white/90 sm:text-base">
                Kindly submit your reply by {RSVP_DEADLINE_LABEL}.
              </span>
            )}
          </p>
          {individualGuest && respondedByGuestId[individualGuest.id] && (
            <p className="mb-4 font-mono text-xs text-white/85 sm:text-sm">
              You already responded:{" "}
              {responses[individualGuest.id] === true
                ? "I'm coming"
                : responses[individualGuest.id] === false
                  ? "I'm not coming"
                  : "No final response yet"}
              . You can still update this before {RSVP_DEADLINE_LABEL}.
            </p>
          )}
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              type="button"
              variant="destructive"
              className="font-mono"
              onClick={() => {
                if (!individualGuest) return;
                const next = { ...responses, [individualGuest.id]: false };
                setResponses(next);
                void submitRsvp(next);
              }}
            >
              I&apos;m not coming
            </Button>
            <Button
              type="button"
              className="font-mono"
              onClick={() => {
                if (!individualGuest) return;
                const next = { ...responses, [individualGuest.id]: true };
                setResponses(next);
                void submitRsvp(next);
              }}
            >
              I&apos;m coming
            </Button>
          </div>
        </div>
      )}

      {!rsvpClosed && submitStatus === "success" && (
        <p className="mt-4 font-mono text-sm text-white/90">Thank you! Your response has been saved.</p>
      )}
      {!rsvpClosed && submitStatus === "error" && (
        <p className="mt-4 text-center font-mono text-sm text-red-300">
          {submitMessage || "Something went wrong. Please try again."}
        </p>
      )}
    </div>
  );
}

const SCENES_BASE: CinematicStripScene[] = [
  {
    id: "scene-1",
    videoSrc: "/videos/intro_vid.mp4",
    poster: "/images/posters/intro_vid.jpg",
    content: <SceneOneTypewriter />,
  },
  {
    id: "story",
    videoSrc: "/videos/beach_vid.mp4",
    poster: "/images/posters/beach_vid.jpg",
    holdVh: STORY_CAROUSEL_HOLD_VH,
    content: ({ holdProgress }: CinematicSceneRenderState) => (
      <SceneTwoPhotoCarousel holdProgress={holdProgress} />
    ),
  },
  {
    id: "date",
    videoSrc: "/videos/walk_vid.mp4",
    poster: "/images/posters/walk_vid.jpg",
    holdVh: 12.5,
    content: ({ holdProgress }: CinematicSceneRenderState) => <SceneTwoCountdown holdProgress={holdProgress} />,
  },
  {
    id: "church",
    videoSrc: "/videos/dagat_vid.mp4",
    poster: "/images/posters/dagat_vid.jpg",
    contentClassName: "pointer-events-auto",
    content: ({ holdProgress }: CinematicSceneRenderState) => (
      <SceneThreeVenue holdProgress={holdProgress} />
    ),
  },
  {
    id: "reception",
    videoSrc: "/videos/chest_vid.mp4",
    poster: "/images/posters/chest_vid.jpg",
    contentClassName: "pointer-events-auto",
    content: ({ holdProgress }: CinematicSceneRenderState) => (
      <SceneFourVenue holdProgress={holdProgress} />
    ),
  },
  {
    id: "program",
    videoSrc: "/videos/footprints_vid.mp4",
    poster: "/images/posters/footprints_vid.jpg",
    holdVh: 12.5,
    content: ({ holdProgress }: CinematicSceneRenderState) => (
      <SceneFiveProgram holdProgress={holdProgress} />
    ),
  },
  {
    id: "ladies",
    videoSrc: "/videos/palawan_vid.mp4",
    poster: "/images/posters/palawan_vid.jpg",
    videoClassName: "object-bottom",
    content: ({ holdProgress }: CinematicSceneRenderState) => (
      <SceneSixDressCodeLadies holdProgress={holdProgress} />
    ),
  },
  {
    id: "gents",
    videoSrc: "/videos/lights_vid.mp4",
    poster: "/images/posters/lights_vid.jpg",
    content: ({ holdProgress }: CinematicSceneRenderState) => (
      <SceneSevenDressCodeGents holdProgress={holdProgress} />
    ),
  },
  {
    id: "wishlist",
    videoSrc: "/videos/photobooth_vid.mp4",
    poster: "/images/posters/photobooth_vid.jpg",
    contentClassName: "pointer-events-auto",
    content: ({ holdProgress }: CinematicSceneRenderState) => (
      <SceneEightWishlist holdProgress={holdProgress} />
    ),
  },
];

type WeddingPageProps = {
  initialSlug?: string;
};

export function WeddingPage({ initialSlug }: WeddingPageProps) {
  const backgroundAudioRef = useRef<HTMLAudioElement>(null);
  const [scrollGuideNudgeKey, setScrollGuideNudgeKey] = useState(0);
  const bumpScrollHint = useCallback(() => setScrollGuideNudgeKey((k) => k + 1), []);

  useEffect(() => {
    const audio = backgroundAudioRef.current;
    if (!audio) return;

    audio.volume = 0.1;
    const playAudio = () => {
      void audio.play().catch(() => {
        // Autoplay can be blocked until first interaction.
      });
    };

    playAudio();

    const onFirstInteraction = () => {
      playAudio();
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    };

    window.addEventListener("pointerdown", onFirstInteraction);
    window.addEventListener("keydown", onFirstInteraction);

    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;

    let attempts = 0;
    const maxAttempts = 20;
    const timer = window.setInterval(() => {
      const target = document.getElementById(hash);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        window.clearInterval(timer);
        return;
      }
      attempts += 1;
      if (attempts >= maxAttempts) {
        window.clearInterval(timer);
      }
    }, 60);

    return () => window.clearInterval(timer);
  }, []);

  const scenes = useMemo<CinematicStripScene[]>(
    () => [
      ...SCENES_BASE,
      {
        id: "rsvp",
        videoSrc: "/videos/bus_vid.mp4",
        poster: "/images/posters/bus_vid.jpg",
        holdVh: 0,
        contentClassName: "pointer-events-auto",
        content: <SceneNineRsvp initialSlug={initialSlug} />,
      },
    ],
    [initialSlug]
  );

  return (
    <ScrollGuideBumpContext.Provider value={bumpScrollHint}>
      {/* <audio ref={backgroundAudioRef} src="/inmylife.mp3" autoPlay loop preload="auto" className="hidden" /> */}
      <CinematicVideoStrip
        scenes={scenes}
        holdVh={25}
        gapVh={4}
        frameHeightVh={70}
        enableScratches={false}
        enableVignette={true}
        enableScanlines={true}
        enableFlicker={true}
        enableGateWeave={true}
        scrollGuide={{
          visibleWhileSceneIndexLessThan: 2,
          text: "Scroll down",
        }}
        scrollGuideNudgeKey={scrollGuideNudgeKey}
      />
    </ScrollGuideBumpContext.Provider>
  );
}
