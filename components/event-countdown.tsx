"use client";

import { useState, useEffect } from "react";

const WEDDING_DATE = new Date("2026-08-20T14:30:00+08:00"); // 2:30 PM (+08)

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

type EventCountdownProps = {
  /** Use white text for dark/video backgrounds */
  variant?: "default" | "light";
};

export function EventCountdown({ variant = "default" }: EventCountdownProps) {
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const diff = WEDDING_DATE.getTime() - now.getTime();

      if (diff <= 0) {
        setDays(0);
        setHours(0);
        setMinutes(0);
        setSeconds(0);
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setDays(d);
      setHours(h);
      setMinutes(m);
      setSeconds(s);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-baseline justify-center gap-2 sm:gap-3 md:gap-4">
        <div className="flex flex-col items-center">
          <span
            className={`font-mono text-5xl font-semibold tabular-nums sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl ${variant === "light" ? "text-white" : "text-foreground"}`}
          >
            {pad(days)}
          </span>
          <span className={`font-mono text-sm sm:text-base ${variant === "light" ? "text-white/80" : "text-muted-foreground"}`}>days</span>
        </div>
        <span className={`font-mono text-4xl sm:text-5xl md:text-6xl ${variant === "light" ? "text-white/60" : "text-muted-foreground/60"}`}>:</span>
        <div className="flex flex-col items-center">
          <span
            className={`font-mono text-5xl font-semibold tabular-nums sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl ${variant === "light" ? "text-white" : "text-foreground"}`}
          >
            {pad(hours)}
          </span>
          <span className={`font-mono text-sm sm:text-base ${variant === "light" ? "text-white/80" : "text-muted-foreground"}`}>hours</span>
        </div>
        <span className={`font-mono text-4xl sm:text-5xl md:text-6xl ${variant === "light" ? "text-white/60" : "text-muted-foreground/60"}`}>:</span>
        <div className="flex flex-col items-center">
          <span
            className={`font-mono text-5xl font-semibold tabular-nums sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl ${variant === "light" ? "text-white" : "text-foreground"}`}
          >
            {pad(minutes)}
          </span>
          <span className={`font-mono text-sm sm:text-base ${variant === "light" ? "text-white/80" : "text-muted-foreground"}`}>minutes</span>
        </div>
        <span className={`font-mono text-4xl sm:text-5xl md:text-6xl ${variant === "light" ? "text-white/60" : "text-muted-foreground/60"}`}>:</span>
        <div className="flex flex-col items-center">
          <span
            className={`font-mono text-5xl font-semibold tabular-nums sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl ${variant === "light" ? "text-white" : "text-foreground"}`}
          >
            {pad(seconds)}
          </span>
          <span className={`font-mono text-sm sm:text-base ${variant === "light" ? "text-white/80" : "text-muted-foreground"}`}>seconds</span>
        </div>
      </div>
    </div>
  );
}
