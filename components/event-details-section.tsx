"use client";

import { useRef } from "react";
import { useScroll, useTransform, motion } from "motion/react";

const REDEMPTORIST_MAP =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3925.362719142451!2d123.89463091122549!3d10.312828867530003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a9994619a399c5%3A0x62ccfa864eb99b47!2sOur%20Mother%20of%20Perpetual%20Help%20-%20Redemptorist%20Church!5e0!3m2!1sen!2sph!4v1773590347823!5m2!1sen!2sph";
const BEVERLY_MAP =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3925.0379983293246!2d123.88599001122567!3d10.338844267068673!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a9992a4c5852ad%3A0x604242490d8f54ec!2sBeverly%20View%20Events%20Pavilion!5e0!3m2!1sen!2sph!4v1773590373227!5m2!1sen!2sph";

const PHOTOS = ["/redemptorist.jpg", "/beverly.jpg"];

export default function EventDetailsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Date/time scroll up and fade out as user scrolls (0 → 0.25) – driven by scroll, not discrete
  const dateTimeOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0]);
  const dateTimeY = useTransform(scrollYProgress, [0, 0.22], [0, -80]);
  const dateTimeHeight = useTransform(scrollYProgress, [0, 0.22], [80, 0]);
  const dateTimeMarginBottom = useTransform(scrollYProgress, [0, 0.22], [16, 0]);
  // Top spacer shrinks so church anchors at top as date scrolls away
  const topSpacer = useTransform(scrollYProgress, [0, 0.22], [120, 0]);

  // Photos: scroll-linked open/close – extended ranges for more viewing time before close
  const photos1Opacity = useTransform(scrollYProgress, [0.22, 0.38, 0.65, 0.9], [0, 1, 1, 0]);
  const photos1Height = useTransform(scrollYProgress, [0.22, 0.38, 0.65, 0.9], [0, 600, 600, 0]);
  // Beverly: open, stay visible, then close (like Redemptorist – bit of scroll won't close immediately)
  const photos2Opacity = useTransform(scrollYProgress, [0.84, 0.88, 0.96, 1.0], [0, 1, 1, 0]);
  const photos2Height = useTransform(scrollYProgress, [0.84, 0.88, 0.96, 1.0], [0, 600, 600, 0]);
  // "Scroll to close" hint – visible during Beverly stay, fades as close begins
  const scrollCloseHintOpacity = useTransform(scrollYProgress, [0.88, 0.90, 0.94, 0.96], [0, 1, 1, 0]);
  // Venues scroll up as we transition to Program
  const venueBlockY = useTransform(scrollYProgress, [0.88, 1.0], [0, -400]);
  const venueBlockOpacity = useTransform(scrollYProgress, [0.9, 1.0], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative max-w-full bg-background"
      style={{ height: "300vh" }}
    >
      <div className="sticky top-0 flex min-h-screen max-w-full flex-col px-6 py-12 pt-8 sm:px-12">
        {/* Top spacer - shrinks as we scroll so church moves up and anchors */}
        <motion.div style={{ height: topSpacer }} className="overflow-hidden" />

        {/* Date and Time - scroll up and fade out with scroll */}
        <motion.div
          className="overflow-hidden"
          style={{
            height: dateTimeHeight,
            marginBottom: dateTimeMarginBottom,
          }}
        >
          <motion.div
            className="font-mono text-2xl font-semibold text-foreground sm:text-3xl"
            style={{ y: dateTimeY, opacity: dateTimeOpacity }}
          >
            <div>August 20, 2026</div>
            <div>3:00 PM</div>
          </motion.div>
        </motion.div>

        {/* Redemptorist Church - anchors at top as date scrolls away */}
        <div className="mb-3 font-mono text-2xl font-medium text-foreground sm:text-4xl">
          Redemptorist Church
        </div>

        {/* Photos 1: Church – photo + map */}
        <motion.div
          className="mb-3 overflow-hidden origin-top"
          style={{ height: photos1Height, opacity: photos1Opacity }}
        >
          <div className="flex min-w-0 flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-6">
            <img
              src={PHOTOS[0]}
              alt=""
              className="aspect-[4/3] w-full rounded-sm object-cover"
            />
            <div className="aspect-square w-full min-h-0 shrink-0 overflow-hidden rounded-sm">
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

        {/* Beverly View Events Pavillion */}
        <div className="font-mono text-2xl font-medium text-foreground sm:text-4xl">
          Beverly View Events Pavillion
        </div>

        {/* Photos 2: Beverly – photo + map + scroll to close hint */}
        <motion.div
          className="mt-3 overflow-hidden origin-top relative"
          style={{ height: photos2Height, opacity: photos2Opacity }}
        >
          <div className="flex min-w-0 flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-6">
            <img
              src={PHOTOS[1]}
              alt=""
              className="aspect-[4/3] w-full rounded-sm object-cover"
            />
            <div className="aspect-square w-full min-h-0 shrink-0 overflow-hidden rounded-sm">
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
  );
}
