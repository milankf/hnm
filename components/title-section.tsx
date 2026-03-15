"use client";

import { useEffect, useState } from "react";

const TEXT = "kristoffer and aubrey";
const TYPING_SPEED_MS = 80;
const CURSOR_BLINK_MS = 530;

export default function TitleSection() {
  const [visibleLength, setVisibleLength] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [typewriterDone, setTypewriterDone] = useState(false);

  useEffect(() => {
    if (visibleLength >= TEXT.length) {
      setTypewriterDone(true);
      return;
    }
    const t = setTimeout(
      () => setVisibleLength((n) => n + 1),
      TYPING_SPEED_MS
    );
    return () => clearTimeout(t);
  }, [visibleLength]);

  useEffect(() => {
    if (typewriterDone) return;
    const t = setInterval(() => setShowCursor((s) => !s), CURSOR_BLINK_MS);
    return () => clearInterval(t);
  }, [typewriterDone]);

  return (
    <div className="relative grid min-h-screen w-full place-items-center overflow-hidden bg-background">
      <div className="relative h-full w-full max-h-screen max-w-full overflow-hidden rounded-sm">
        {/* Text */}
        <div className="relative z-10 flex min-h-full w-full items-center justify-center sm:justify-center">
          <div className="text-center font-mono text-4xl font-medium text-foreground sm:text-6xl sm:text-left">
            {TEXT.slice(0, visibleLength)}
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
  );
}
