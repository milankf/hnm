"use client";

import type { MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform, motion } from "motion/react";

const REDEMPTORIST_MAP =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3925.362719142451!2d123.89463091122549!3d10.312828867530003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a9994619a399c5%3A0x62ccfa864eb99b47!2sOur%20Mother%20of%20Perpetual%20Help%20-%20Redemptorist%20Church!5e0!3m2!1sen!2sph!4v1773590347823!5m2!1sen!2sph";
const BEVERLY_MAP =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3925.0379983293246!2d123.88599001122567!3d10.338844267068673!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a9992a4c5852ad%3A0x604242490d8f54ec!2sBeverly%20View%20Events%20Pavilion!5e0!3m2!1sen!2sph!4v1773590373227!5m2!1sen!2sph";

const PHOTOS = ["/redemptorist.jpg", "/beverly.jpg", "/sec1_1.webp", "/obri_car.webp"];

const RSVP_GUESTS = [
  "Maria Santos",
  "Juan Dela Cruz",
  "Ana Reyes",
  "Pedro Hernandez",
  "Carmen Lopez",
];

const PROGRAM_ITEMS = [
  { time: "03:00", title: "Wedding ceremony" },
  { time: "06:30", title: "Reception" },
  { time: "07:00", title: "Dinner" },
  { time: "08:00", title: "Cake slicing and speech" },
  { time: "09:00", title: "First dance and party" },
  { time: "10:00", title: "Send off" },
];

function ProgramHeader({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const x = useTransform(scrollYProgress, [0, 0.04], [-60, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.04], [0, 1]);
  return (
    <motion.h2
      className="font-mono text-2xl font-medium text-foreground sm:text-3xl"
      style={{ x, opacity }}
    >
      Program
    </motion.h2>
  );
}

function ProgramItem({
  item,
  scrollYProgress,
  start,
  end,
}: {
  item: (typeof PROGRAM_ITEMS)[0];
  scrollYProgress: MotionValue<number>;
  start: number;
  end: number;
}) {
  const x = useTransform(scrollYProgress, [start, end], [-60, 0]);
  const opacity = useTransform(scrollYProgress, [start, end], [0, 1]);
  return (
    <motion.div className="font-mono" style={{ x, opacity }}>
      <span className="text-lg font-medium text-foreground sm:text-xl">
        {item.time}
      </span>{" "}
      <span className="text-muted-foreground sm:text-lg">{item.title}</span>
    </motion.div>
  );
}

function SeatingComingSoon({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const x = useTransform(scrollYProgress, [0.88, 0.96], [40, 0]);
  const opacity = useTransform(scrollYProgress, [0.88, 0.96], [0, 1]);
  return (
    <motion.div
      className="flex items-center justify-center font-mono text-lg text-muted-foreground sm:text-xl"
      style={{ x, opacity }}
    >
      Seating arrangement coming soon
    </motion.div>
  );
}

export default function Home() {
  const eventDetailsRef = useRef<HTMLElement>(null);
  const programRef = useRef<HTMLElement>(null);
  const photosCarouselRef = useRef<HTMLElement>(null);
  const rsvpRef = useRef<HTMLElement>(null);

  // ——— Title section: typewriter ———
  const [visibleLength, setVisibleLength] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [typewriterDone, setTypewriterDone] = useState(false);

  // ——— RSVP section ———
  const [rsvpChecked, setRsvpChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(RSVP_GUESTS.map((name) => [name, false]))
  );

  useEffect(() => {
    if (visibleLength >= "kristoffer and aubrey".length) {
      setTypewriterDone(true);
      return;
    }
    const t = setTimeout(() => setVisibleLength((n) => n + 1), 80);
    return () => clearTimeout(t);
  }, [visibleLength]);

  useEffect(() => {
    if (typewriterDone) return;
    const t = setInterval(() => setShowCursor((s) => !s), 530);
    return () => clearInterval(t);
  }, [typewriterDone]);

  // ——— Event details section: scroll-driven ———
  const { scrollYProgress: eventScrollYProgress } = useScroll({
    target: eventDetailsRef,
    offset: ["start start", "end end"],
  });

  const dateTimeOpacity = useTransform(eventScrollYProgress, [0, 0.22], [1, 0]);
  const dateTimeY = useTransform(eventScrollYProgress, [0, 0.22], [0, -80]);
  const dateTimeHeight = useTransform(eventScrollYProgress, [0, 0.22], [80, 0]);
  const dateTimeMarginBottom = useTransform(eventScrollYProgress, [0, 0.22], [16, 0]);
  const topSpacer = useTransform(eventScrollYProgress, [0, 0.22], [120, 0]);
  // Sequential: Redemptorist opens → closes → Beverly opens → closes → Program
  const photos1Opacity = useTransform(eventScrollYProgress, [0.22, 0.38, 0.50, 0.65], [0, 1, 1, 0]);
  const photos1Height = useTransform(eventScrollYProgress, [0.22, 0.38, 0.50, 0.65], [0, 600, 600, 0]);
  // Beverly: only after Redemptorist closes at 0.65 – open, stay, close gradually
  const photos2Opacity = useTransform(eventScrollYProgress, [0.65, 0.75, 0.82, 0.98], [0, 1, 1, 0]);
  const photos2Height = useTransform(eventScrollYProgress, [0.65, 0.75, 0.82, 0.98], [0, 600, 600, 0]);
  const scrollCloseHintOpacity = useTransform(
    eventScrollYProgress,
    [0.75, 0.78, 0.92, 0.96],
    [0, 1, 1, 0]
  );

  // ——— Program section: scroll-driven ———
  const { scrollYProgress: programScrollYProgress } = useScroll({
    target: programRef,
    offset: ["start start", "end end"],
  });
  // Program block fades in after Beverly closes; items animate one-by-one from program scroll
  const programBlockOpacity = useTransform(
    eventScrollYProgress,
    [0.99, 1.0],
    [0, 1]
  );

  // Photo carousel: scroll down → carousel moves right (vertical scroll drives horizontal)
  const { scrollYProgress: carouselScrollYProgress } = useScroll({
    target: photosCarouselRef,
    offset: ["start start", "end end"],
  });
  const smoothCarouselProgress = useSpring(carouselScrollYProgress, {
    stiffness: 60,
    damping: 25,
    mass: 0.8,
    skipInitialAnimation: true,
  });
  const carouselX = useTransform(smoothCarouselProgress, [0, 1], [0, -2900]);
  const carouselXBack = useTransform(smoothCarouselProgress, [0, 1], [0, 2500]);

  const scrollToRsvp = () => {
    rsvpRef.current?.scrollIntoView({ behavior: "instant" });
  };

  return (
    <main className="min-h-screen w-full">
      {/* Title: typewriter */}
      <div className="relative grid min-h-screen w-full place-items-center overflow-hidden bg-background">
        <div className="relative h-full w-full max-h-screen max-w-full overflow-hidden rounded-sm">
          <div className="relative z-10 flex min-h-full w-full items-center justify-center sm:justify-center">
            <div className="text-center font-mono text-4xl font-medium text-foreground sm:text-6xl sm:text-left">
              {"kristoffer and aubrey".slice(0, visibleLength)}
              <span
                className={`inline-block w-0.5 bg-foreground align-bottom transition-opacity ${
                  showCursor ? "opacity-100" : "opacity-0"
                }`}
                style={{ height: "1em", marginLeft: "2px" }}
                aria-hidden
              />
            </div>
          </div>
        </div>
      </div>

      {/* Event details: scroll-driven */}
      <section
        ref={eventDetailsRef}
        className="relative max-w-full bg-background"
        style={{ height: "500vh" }}
      >
        <div className="sticky top-0 flex min-h-screen max-w-full flex-col px-6 py-12 pt-8 sm:px-12">
          <motion.div style={{ height: topSpacer }} className="overflow-hidden" />

          <motion.div
            className="overflow-hidden"
            style={{ height: dateTimeHeight, marginBottom: dateTimeMarginBottom }}
          >
            <motion.div
              className="font-mono text-2xl font-semibold text-foreground sm:text-3xl"
              style={{ y: dateTimeY, opacity: dateTimeOpacity }}
            >
              <div>August 20, 2026</div>
              <div>3:00 PM</div>
            </motion.div>
          </motion.div>

          <div className="mb-3 font-mono text-2xl font-medium text-foreground sm:text-4xl">
            Redemptorist Church
          </div>

          <motion.div
            className="mb-3 overflow-hidden origin-top"
            style={{ height: photos1Height, opacity: photos1Opacity }}
          >
            <div className="flex min-w-0 flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-6 sm:items-stretch">
              <img
                src={PHOTOS[0]}
                alt=""
                className="aspect-[4/3] w-full min-h-0 rounded-sm object-cover"
              />
              <div className="aspect-[4/3] w-full min-h-0 overflow-hidden rounded-sm">
                <iframe
                  src={REDEMPTORIST_MAP}
                  className="h-full w-full"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </motion.div>

          <div className="font-mono text-2xl font-medium text-foreground sm:text-4xl">
            Beverly View Events Pavillion
          </div>

          <motion.div
            className="mt-3 overflow-hidden origin-top relative"
            style={{ height: photos2Height, opacity: photos2Opacity }}
          >
            <div className="flex min-w-0 flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-6 sm:items-stretch">
              <img
                src={PHOTOS[1]}
                alt=""
                className="aspect-[4/3] w-full min-h-0 rounded-sm object-cover"
              />
              <div className="aspect-[4/3] w-full min-h-0 overflow-hidden rounded-sm">
                <iframe
                  src={BEVERLY_MAP}
                  className="h-full w-full"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
            <motion.p
              className="absolute bottom-4 left-0 right-0 text-center font-mono text-sm text-muted-foreground"
              style={{ opacity: scrollCloseHintOpacity }}
            >
              Scroll to close
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Program: scroll-driven */}
      <section
        ref={programRef}
        className="relative -mt-[100vh] max-w-full bg-transparent"
        style={{ height: "250vh" }}
      >
        <motion.div
          className="sticky top-0 flex min-h-screen max-w-full items-center justify-center px-6 py-12 sm:px-12"
          style={{ opacity: programBlockOpacity }}
        >
          <div className="grid w-full min-w-0 grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col gap-6">
              <ProgramHeader scrollYProgress={programScrollYProgress} />
              <div className="flex flex-col gap-4">
                {PROGRAM_ITEMS.map((item, i) => {
                  const start = 0.06 + i * 0.14;
                  const end = start + 0.12;
                  return (
                    <ProgramItem
                      key={item.time}
                      item={item}
                      scrollYProgress={programScrollYProgress}
                      start={start}
                      end={end}
                    />
                  );
                })}
              </div>
            </div>
            <div className="flex min-w-0 items-center justify-center">
              <SeatingComingSoon scrollYProgress={programScrollYProgress} />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Photo carousel: scroll down to move through photos horizontally */}
      <section
        ref={photosCarouselRef}
        className="relative max-w-full bg-background"
        style={{ height: "150vh" }}
      >
        <div className="sticky top-0 flex min-h-screen w-full flex-col overflow-hidden px-6 py-12 sm:px-12">
          <h2 className="relative z-20 mb-4 text-center font-mono text-2xl font-medium text-foreground sm:text-3xl">
            Our story
          </h2>
          <div
            className="relative z-0 flex flex-1 items-center overflow-hidden"
            style={{
              maskImage: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)",
            }}
          >
          {/* Background carousel: 1.5x, grayscale, blurred, scrolls opposite */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            style={{ x: carouselXBack }}
          >
            <div className="flex items-center gap-6 sm:gap-8">
              {[...Array(3)].flatMap(() => PHOTOS).concat(PHOTOS[0]).map((src, i) => (
                <img
                  key={`back-${src}-${i}`}
                  src={src}
                  alt=""
                  className="aspect-square h-[24rem] w-[24rem] shrink-0 rounded-sm object-cover grayscale opacity-50 blur-sm sm:h-[30rem] sm:w-[30rem] sm:blur-md"
                />
              ))}
            </div>
          </motion.div>
          {/* Left/right fade overlays (wider for stronger edge fade) */}
          <div
            className="absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-background to-transparent pointer-events-none sm:w-40"
            aria-hidden
          />
          <div
            className="absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-background to-transparent pointer-events-none sm:w-40"
            aria-hidden
          />
          <motion.div
            className="relative z-10 flex gap-3"
            style={{ x: carouselX }}
          >
            {[...Array(3)].flatMap(() => PHOTOS).concat(PHOTOS[0]).map((src, i) => (
              <img
                key={`${src}-${i}`}
                src={src}
                alt=""
                className="aspect-square h-64 w-64 shrink-0 rounded-sm object-cover sm:h-80 sm:w-80"
              />
            ))}
          </motion.div>
          </div>
          <p className="relative z-20 mt-4 font-mono text-sm text-muted-foreground sm:text-base">
            If you&apos;d like to give gifts, we would appreciate if you looked at our{" "}
            <Link href="/registry" className="underline underline-offset-4 hover:text-foreground">
              registry
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Floating RSVP button */}
      <Button
        variant="default"
        size="lg"
        className="fixed bottom-6 right-6 z-50 font-mono shadow-lg sm:bottom-8 sm:right-8"
        onClick={scrollToRsvp}
        type="button"
      >
        RSVP
      </Button>

      {/* RSVP section */}
      <section
        ref={rsvpRef}
        className="flex min-h-screen w-full flex-col items-center justify-center gap-10 px-6 py-16 sm:px-12"
      >
        <h2 className="text-center font-mono text-6xl font-medium text-foreground sm:text-8xl md:text-9xl">
          RSVP
        </h2>
        <ul className="flex flex-col gap-4">
          {RSVP_GUESTS.map((name) => (
            <li key={name} className="flex items-center gap-3">
              <Checkbox
                id={name}
                checked={rsvpChecked[name] ?? false}
                onCheckedChange={(checked: boolean) =>
                  setRsvpChecked((prev) => ({ ...prev, [name]: checked }))
                }
              />
              <label
                htmlFor={name}
                className="cursor-pointer font-mono text-lg text-foreground sm:text-xl"
              >
                {name}
              </label>
            </li>
          ))}
        </ul>
        <Button
          size="lg"
          className="font-mono text-base sm:text-lg"
          type="button"
          onClick={() => {
            /* TODO: submit RSVP */
          }}
        >
          Submit
        </Button>
      </section>
    </main>
  );
}
