import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invitees, guests } from "@/db/schema";
import { and, eq, ilike } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug")?.trim();
    const familyName = searchParams.get("familyName")?.trim();

    if (!slug && !familyName) {
      return NextResponse.json(
        { error: "Missing slug or familyName" },
        { status: 400 }
      );
    }

    let invitee = null;

    if (slug) {
      const rows = await db.select().from(invitees).where(eq(invitees.slug, slug)).limit(1);
      invitee = rows[0] ?? null;
    } else if (familyName) {
      const queryName = familyName.toLowerCase();

      const exactFamilyRows = await db
        .select()
        .from(invitees)
        .where(
          and(
            eq(invitees.type, "family"),
            ilike(invitees.displayName, familyName)
          )
        )
        .limit(1);

      if (exactFamilyRows[0]) {
        invitee = exactFamilyRows[0];
      } else {
        const individualCandidates = await db
          .select()
          .from(invitees)
          .where(
            and(
              eq(invitees.type, "individual"),
              ilike(invitees.displayName, `%${familyName}%`)
            )
          )
          .limit(25);

        const lastNameExact = individualCandidates.find((row) => {
          const tokens = row.displayName.trim().toLowerCase().split(/\s+/);
          const lastName = tokens[tokens.length - 1] ?? "";
          return lastName === queryName;
        });

        if (lastNameExact) {
          invitee = lastNameExact;
        } else {
          const partialFamilyRows = await db
            .select()
            .from(invitees)
            .where(
              and(
                eq(invitees.type, "family"),
                ilike(invitees.displayName, `%${familyName}%`)
              )
            )
            .limit(1);

          if (partialFamilyRows[0]) {
            invitee = partialFamilyRows[0];
          } else {
            invitee = individualCandidates[0] ?? null;
          }
        }
      }
    }

    if (!invitee) {
      return NextResponse.json(
        { error: "Invitation not found for that family or last name" },
        { status: 404 }
      );
    }

    const guestRows = await db.select().from(guests).where(eq(guests.inviteeId, invitee.id));
    return NextResponse.json({ invitee, guests: guestRows });
  } catch (err) {
    console.error("RSVP invitee lookup error:", err);
    return NextResponse.json(
      { error: "Failed to load invitation" },
      { status: 500 }
    );
  }
}
