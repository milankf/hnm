"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CinematicVideoStrip,
  type CinematicSceneRenderState,
  type CinematicStripScene,
} from "@/components/cinematic-video-strip";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { Guest, Invitee } from "@/db/schema";

const WEDDING_DATE_TARGET = new Date("2026-08-20T15:00:00+08:00");

type CountdownParts = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

const PROGRAM_ITEMS = [
  { time: "03:00", title: "Wedding ceremony" },
  { time: "06:30", title: "Reception" },
  { time: "07:00", title: "Dinner" },
  { time: "08:00", title: "Cake slicing and speech" },
  { time: "09:00", title: "First dance and party" },
  { time: "10:00", title: "Send off" },
];

const SECTION_TWO_CAROUSEL_PHOTOS = [
  { src: "/carousel_1.webp", caption: "Where it all began." },
  { src: "/beverly.jpg" },
  { src: "/sec1_1.webp", caption: "A quiet in-between moment." },
  { src: "/obri_car.webp" },
  { src: "/redemptorist.jpg", caption: "A place close to our hearts." },
  { src: "/beverly.jpg" },
  { src: "/sec1_1.webp" },
  { src: "/obri_car.webp", caption: "On our way to forever." },
  { src: "/redemptorist.jpg" },
  { src: "/beverly.jpg", caption: "Celebrating with everyone we love." },
  { src: "/sec1_1.webp" },
  { src: "/obri_car.webp" },
];

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
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxShiftPx, setMaxShiftPx] = useState(0);

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

  const shiftPx = maxShiftPx * holdProgress;

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
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
          }}
        >
        <div
          ref={trackRef}
          className="flex items-start gap-2 sm:gap-3"
          style={{
            transform: `translateX(-${shiftPx}px)`,
            willChange: "transform",
          }}
        >
          <div className="h-px w-2 shrink-0 sm:w-3" aria-hidden />
          {SECTION_TWO_CAROUSEL_PHOTOS.map((photo, index) => (
            <div key={`${photo.src}-${index}`} className="w-[68vw] shrink-0 sm:w-[40vw] lg:w-[30vw]">
              <Image
                src={photo.src}
                alt={`Wedding memory ${index + 1}`}
                width={720}
                height={480}
                className="h-44 w-full rounded-md object-cover sm:h-56"
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
          <div className="h-px w-2 shrink-0 sm:w-3" aria-hidden />
        </div>
      </div>
      </div>
    </div>
  );
}

function SceneTwoCountdown() {
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
          {units.map((unit) => (
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
          ))}
        </div>
        <p className="mt-6 text-xl font-bold uppercase tracking-[0.2em] text-white sm:text-3xl">
          August 20, 2026, thu
        </p>
        <p className="mt-3 text-lg font-medium tracking-[0.18em] text-white/95 sm:text-2xl">
          3:00 PM
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
      imageSrc="/redemptorist.jpg"
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
      imageSrc="/beverly.jpg"
      imageAlt="Beverly View Events Pavilion"
      mapsLink="https://maps.app.goo.gl/BexKk87q2VL8twJv8"
    />
  );
}

function SceneFiveProgram({ holdProgress }: { holdProgress: number }) {
  const total = PROGRAM_ITEMS.length;
  const revealWindow = 1 / (total + 0.6);

  return (
    <div
      className="flex h-full flex-col p-4 text-white sm:p-6"
      style={{
        textShadow:
          "0 2px 4px rgba(0,0,0,0.72), 0 0 14px rgba(0,0,0,0.5), 0 0 24px rgba(0,0,0,0.34)",
      }}
    >
      <div className="flex flex-1 items-center justify-center px-2 py-4">
        <div className="w-full max-w-[860px]">
          <p className="mb-3 text-center font-mono text-2xl font-extrabold tracking-[0.06em] text-white sm:mb-5 sm:text-4xl">
            What&apos;s the plan?
          </p>
          <div className="space-y-1.5 sm:space-y-2">
          {PROGRAM_ITEMS.map((item, index) => {
            const fromLeft = index % 2 === 0;
            const start = index * revealWindow;
            const progress = Math.min(Math.max((holdProgress - start) / revealWindow, 0), 1);
            const startX = fromLeft ? -120 : 120;
            const translateX = startX * (1 - progress);

            return (
              <div
                key={`${item.time}-${item.title}`}
                className="font-mono text-center"
                style={{
                  transform: `translateX(${translateX}px)`,
                  opacity: progress,
                }}
              >
                <p className="text-base font-medium sm:text-2xl">
                  <span className="font-bold tracking-[0.08em]">{item.time}</span>
                  <span className="mx-2 text-white/70">-</span>
                  <span>{item.title}</span>
                </p>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
}

function DressCodeColorDots() {
  return (
    <div
      className="mt-3 flex items-center gap-3 sm:mt-4 sm:gap-4"
      aria-label="Avoid black, white, blue, and navy blue"
    >
      <span className="inline-block h-7 w-7 rounded-full border border-white/40 bg-black sm:h-9 sm:w-9" />
      <span className="inline-block h-7 w-7 rounded-full border border-white/50 bg-white sm:h-9 sm:w-9" />
      <span className="inline-block h-7 w-7 rounded-full border border-white/40 bg-blue-500 sm:h-9 sm:w-9" />
      <span className="inline-block h-7 w-7 rounded-full border border-white/40 bg-[#1f2a44] sm:h-9 sm:w-9" />
    </div>
  );
}

function DressCodePanel({ label, imageSrc, imageAlt }: { label: string; imageSrc: string; imageAlt: string }) {
  return (
    <div className="grid items-center gap-3 rounded-lg border border-white/30 bg-black/30 p-3 sm:grid-cols-[1fr_1.2fr] sm:gap-5 sm:p-4">
      <div className="overflow-hidden rounded-md border border-white/20">
        <Image src={imageSrc} alt={imageAlt} width={640} height={420} className="h-32 w-full object-cover sm:h-40" />
      </div>
      <div className="text-left">
        <p className="font-mono text-lg font-bold text-white sm:text-2xl">{label}</p>
        <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-white/90 sm:text-sm">
          Avoid wearing the following colors
        </p>
        <DressCodeColorDots />
      </div>
    </div>
  );
}

function SceneSixDressCodeLadies() {
  return (
    <div
      className="flex h-full flex-col items-center justify-center p-4 text-white sm:p-6"
      style={{
        textShadow:
          "0 2px 4px rgba(0,0,0,0.72), 0 0 14px rgba(0,0,0,0.5), 0 0 24px rgba(0,0,0,0.34)",
      }}
    >
      <div className="w-full max-w-4xl">
        <p className="mb-3 text-center font-mono text-2xl font-extrabold tracking-[0.06em] sm:mb-5 sm:text-4xl">
          What to wear
        </p>
        <DressCodePanel label="Ladies" imageSrc="/sec1_1.webp" imageAlt="Ladies dress code inspiration" />
      </div>
    </div>
  );
}

function SceneSevenDressCodeGents() {
  return (
    <div
      className="flex h-full flex-col items-center justify-center p-4 text-white sm:p-6"
      style={{
        textShadow:
          "0 2px 4px rgba(0,0,0,0.72), 0 0 14px rgba(0,0,0,0.5), 0 0 24px rgba(0,0,0,0.34)",
      }}
    >
      <div className="w-full max-w-4xl">
        <p className="mb-3 text-center font-mono text-2xl font-extrabold tracking-[0.06em] sm:mb-5 sm:text-4xl">
          What to wear
        </p>
        <DressCodePanel label="Gents" imageSrc="/obri_car.webp" imageAlt="Gents dress code inspiration" />
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

function SceneNineRsvp({ initialSlug }: { initialSlug?: string }) {
  const router = useRouter();
  const [invitee, setInvitee] = useState<Invitee | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [responses, setResponses] = useState<Record<string, boolean>>({});
  const [familyName, setFamilyName] = useState("");
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "error">("idle");
  const [lookupMessage, setLookupMessage] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const normalizedSlug = initialSlug?.trim();

  const applyInviteePayload = (payload: InviteeLookupResponse) => {
    setInvitee(payload.invitee);
    setGuests(payload.guests);
    const nextResponses: Record<string, boolean> = {};
    for (const guest of payload.guests) {
      nextResponses[guest.id] = guest.attending ?? false;
    }
    setResponses(nextResponses);
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

  const submitRsvp = async (nextResponses: Record<string, boolean>) => {
    if (!invitee) return;
    setSubmitStatus("submitting");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteeId: invitee.id,
          responses: guests.map((guest) => ({
            guestId: guest.id,
            attending: nextResponses[guest.id] ?? false,
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed to submit RSVP");
      setSubmitStatus("success");
    } catch {
      setSubmitStatus("error");
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

      {!invitee && (
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

      {invitee && isFamily && (
        <div className="mt-7 w-full max-w-2xl rounded-lg border border-white/35 bg-black/35 p-4 sm:p-6">
          <p className="mb-4 text-center font-mono text-base text-white/95 sm:text-xl">
            We&apos;re so happy to celebrate with {invitee.displayName}. We truly hope you can join us, and
            please let us know who will be attending:
          </p>
          <ul className="space-y-3">
            {guests.map((guest) => (
              <li key={guest.id} className="flex items-center gap-3">
                <Checkbox
                  id={`guest-${guest.id}`}
                  checked={responses[guest.id] ?? false}
                  onCheckedChange={(checked: boolean) =>
                    setResponses((prev) => ({ ...prev, [guest.id]: checked }))
                  }
                />
                <label htmlFor={`guest-${guest.id}`} className="cursor-pointer font-mono text-white sm:text-lg">
                  {guest.name}
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="destructive"
              disabled={submitStatus === "submitting"}
              className="font-mono"
              onClick={() => {
                const next: Record<string, boolean> = {};
                for (const guest of guests) {
                  next[guest.id] = false;
                }
                setResponses(next);
                void submitRsvp(next);
              }}
            >
              We&apos;re not attending
            </Button>
            <Button
              type="button"
              onClick={() => submitRsvp(responses)}
              disabled={submitStatus === "submitting"}
              className="font-mono"
            >
              {submitStatus === "submitting" ? "Submitting..." : "Submit RSVP"}
            </Button>
          </div>
        </div>
      )}

      {invitee && !isFamily && (
        <div className="mt-7 w-full max-w-2xl rounded-lg border border-white/35 bg-black/35 p-4 text-center sm:p-6">
          <p className="mb-5 font-mono text-base text-white/95 sm:text-xl">
            We&apos;re so happy to invite {individualGuest?.name ?? invitee.displayName} to celebrate this day
            with us, and we sincerely hope you&apos;re able to come.
          </p>
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

      {submitStatus === "success" && (
        <p className="mt-4 font-mono text-sm text-white/90">Thank you! Your response has been saved.</p>
      )}
      {submitStatus === "error" && (
        <p className="mt-4 font-mono text-sm text-red-300">Something went wrong. Please try again.</p>
      )}
    </div>
  );
}

const SCENES_BASE: CinematicStripScene[] = [
  {
    id: "scene-1",
    videoSrc: "/intro_vid.mp4",
    content: <SceneOneTypewriter />,
  },
  {
    id: "story",
    videoSrc: "/walk_vid.mp4",
    holdVh: 100,
    content: ({ holdProgress }: CinematicSceneRenderState) => (
      <SceneTwoPhotoCarousel holdProgress={holdProgress} />
    ),
  },
  {
    id: "date",
    videoSrc: "/walk_vid.mp4",
    content: <SceneTwoCountdown />,
  },
  {
    id: "church",
    videoSrc: "/dagat_vid.mp4",
    contentClassName: "pointer-events-auto",
    content: ({ holdProgress }: CinematicSceneRenderState) => (
      <SceneThreeVenue holdProgress={holdProgress} />
    ),
  },
  {
    id: "reception",
    videoSrc: "/chest_vid.mp4",
    contentClassName: "pointer-events-auto",
    content: ({ holdProgress }: CinematicSceneRenderState) => (
      <SceneFourVenue holdProgress={holdProgress} />
    ),
  },
  {
    id: "program",
    videoSrc: "/intro_vid.mp4",
    content: ({ holdProgress }: CinematicSceneRenderState) => (
      <SceneFiveProgram holdProgress={holdProgress} />
    ),
  },
  {
    id: "ladies",
    videoSrc: "/walk_vid.mp4",
    content: <SceneSixDressCodeLadies />,
  },
  {
    id: "gents",
    videoSrc: "/intro_vid.mp4",
    content: <SceneSevenDressCodeGents />,
  },
  {
    id: "wishlist",
    videoSrc: "/dagat_vid.mp4",
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
        videoSrc: "/chest_vid.mp4",
        holdVh: 120,
        contentClassName: "pointer-events-auto",
        content: <SceneNineRsvp initialSlug={initialSlug} />,
      },
    ],
    [initialSlug]
  );

  return (
    <CinematicVideoStrip
      scenes={scenes}
      holdVh={25}
      gapVh={4}
      frameHeightVh={70}
      enableScratches={true}
      enableVignette={true}
      enableScanlines={true}
      enableFlicker={true}
      enableGateWeave={true}
    />
  );
}
