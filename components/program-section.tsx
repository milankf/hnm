"use client";

import type { MotionValue } from "motion/react";
import { useRef } from "react";
import { useScroll, useTransform, motion } from "motion/react";

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

export default function ProgramSection() {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  return (
    <section
      ref={sectionRef}
      className="relative -mt-[25vh] max-w-full bg-background"
      style={{ height: "250vh" }}
    >
      <div className="sticky top-0 flex min-h-screen max-w-full items-center justify-center px-6 py-12 sm:px-12">
        <div className="grid w-full min-w-0 grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: Program */}
          <div className="flex flex-col gap-6">
            <ProgramHeader scrollYProgress={scrollYProgress} />
            <div className="flex flex-col gap-4">
              {PROGRAM_ITEMS.map((item, i) => {
                const start = 0.06 + i * 0.14;
                const end = start + 0.12;
                return (
                  <ProgramItem
                    key={item.time}
                    item={item}
                    scrollYProgress={scrollYProgress}
                    start={start}
                    end={end}
                  />
                );
              })}
            </div>
          </div>

          {/* Right: Seating arrangement coming soon */}
          <div className="flex min-w-0 items-center justify-center">
            <SeatingComingSoon scrollYProgress={scrollYProgress} />
          </div>
        </div>
      </div>
    </section>
  );
}
