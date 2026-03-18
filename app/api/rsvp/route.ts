import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guests } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inviteeId, responses } = body as {
      inviteeId: string;
      responses: { guestId: string; attending: boolean }[];
    };

    if (!inviteeId || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: "Missing inviteeId or responses" },
        { status: 400 }
      );
    }

    const now = new Date();

    for (const { guestId, attending } of responses) {
      await db
        .update(guests)
        .set({
          attending,
          respondedAt: now,
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
