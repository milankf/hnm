"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Invitee, Guest } from "@/db/schema";

type RsvpSectionProps = {
  invitee: Invitee;
  guests: Guest[];
};

export function RsvpSection({ invitee, guests }: RsvpSectionProps) {
  const [responses, setResponses] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const g of guests) {
      initial[g.id] = g.attending ?? false;
    }
    return initial;
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const submitRsvp = async (attendingByGuestId: Record<string, boolean>) => {
    setStatus("submitting");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteeId: invitee.id,
          responses: guests.map((g) => ({
            guestId: g.id,
            attending: attendingByGuestId[g.id] ?? false,
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const handleSubmit = () => submitRsvp(responses);

  const isFamily = invitee.type === "family";

  return (
    <section className="flex min-h-screen w-full flex-col items-center justify-center gap-10 px-6 py-16 sm:px-12">
      <h2 className="text-center font-mono text-6xl font-medium text-foreground sm:text-8xl md:text-9xl">
        RSVP
      </h2>
      <p className="text-center font-mono text-lg text-muted-foreground sm:text-xl">
        {invitee.displayName}
      </p>

      {isFamily ? (
        <ul className="flex flex-col gap-4">
          {guests.map((g) => (
            <li key={g.id} className="flex items-center gap-3">
              <Checkbox
                id={g.id}
                checked={responses[g.id] ?? false}
                onCheckedChange={(checked: boolean) =>
                  setResponses((prev) => ({ ...prev, [g.id]: checked }))
                }
              />
              <label
                htmlFor={g.id}
                className="cursor-pointer font-mono text-lg text-foreground sm:text-xl"
              >
                {g.name}
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 justify-center">
            <Button
              variant={responses[guests[0]?.id ?? ""] === false ? "destructive" : "outline"}
              size="lg"
              className={responses[guests[0]?.id ?? ""] === false ? "font-mono text-white" : "font-mono"}
              type="button"
              onClick={() => {
                const id = guests[0]?.id;
                if (id) {
                  const next = { ...responses, [id]: false };
                  setResponses(next);
                  submitRsvp(next);
                }
              }}
            >
              I&apos;m sorry I can&apos;t come
            </Button>
            <Button
              variant={responses[guests[0]?.id ?? ""] === true ? "default" : "outline"}
              size="lg"
              className="font-mono data-[state=unselected]:border-primary data-[state=unselected]:text-primary data-[state=unselected]:hover:bg-primary/10"
              type="button"
              onClick={() => {
                const id = guests[0]?.id;
                if (id) {
                  const next = { ...responses, [id]: true };
                  setResponses(next);
                  submitRsvp(next);
                }
              }}
            >
              I&apos;m coming
            </Button>
          </div>
        </div>
      )}

      {isFamily && (
        <Button
          size="lg"
          className="font-mono text-base sm:text-lg"
          type="button"
          onClick={handleSubmit}
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "Submitting…" : "Submit"}
        </Button>
      )}

      {status === "success" && (
        <p className="font-mono text-muted-foreground">Thank you! Your response has been saved.</p>
      )}
      {status === "error" && (
        <p className="font-mono text-destructive">Something went wrong. Please try again.</p>
      )}
    </section>
  );
}
