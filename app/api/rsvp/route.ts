import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { RSVP_CLOSED_MESSAGE, isRsvpClosed } from "@/lib/rsvp-deadline";

export async function POST(request: NextRequest) {
  try {
    if (isRsvpClosed()) {
      return NextResponse.json(
        { error: RSVP_CLOSED_MESSAGE },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { inviteeId, responses } = body as {
      inviteeId: string;
      responses: { guestId: string; attending: boolean | null }[];
    };

    if (!inviteeId || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: "Missing inviteeId or responses" },
        { status: 400 }
      );
    }

    const hasInvalidResponse = responses.some(
      (response) =>
        !response?.guestId ||
        !(
          typeof response.attending === "boolean" ||
          response.attending === null
        )
    );

    if (hasInvalidResponse) {
      return NextResponse.json(
        { error: "Invalid responses payload" },
        { status: 400 }
      );
    }

    const now = new Date();

    for (const { guestId, attending } of responses) {
      await db
        .update(guests)
        .set({
          attending,
          respondedAt: attending === null ? null : now,
          updatedAt: now,
        })
        .where(
          and(
            eq(guests.id, guestId),
            eq(guests.inviteeId, inviteeId)
          )
        );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("RSVP error:", err);
    return NextResponse.json(
      { error: "Failed to save RSVP" },
      { status: 500 }
    );
  }
}
