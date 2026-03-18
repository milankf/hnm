import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invitees, guests } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get("authorization");
  const key = authHeader?.replace("Bearer ", "") ?? new URL(request.url).searchParams.get("key");
  if (adminSecret && key !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, displayName, slug, memberNames } = body as {
      type: "family" | "individual";
      displayName: string;
      slug: string;
      memberNames?: string[];
    };

    if (!type || !displayName?.trim() || !slug?.trim()) {
      return NextResponse.json(
        { error: "Missing type, displayName, or slug" },
        { status: 400 }
      );
    }

    const existing = await db.select().from(invitees).where(eq(invitees.slug, slug)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Slug already in use" },
        { status: 400 }
      );
    }

    if (type === "family") {
      const names = Array.isArray(memberNames) ? memberNames.filter(Boolean) : [];
      if (names.length === 0) {
        return NextResponse.json(
          { error: "Family must have at least one member" },
          { status: 400 }
        );
      }
      const [invitee] = await db
        .insert(invitees)
        .values({
          type: "family",
          displayName: displayName.trim(),
          slug: slug.trim(),
        })
        .returning();
      const guestRows = await db
        .insert(guests)
        .values(names.map((name) => ({ inviteeId: invitee.id, name: name.trim() })))
        .returning();
      return NextResponse.json({ invitee, guests: guestRows });
    }

    if (type === "individual") {
      const [invitee] = await db
        .insert(invitees)
        .values({
          type: "individual",
          displayName: displayName.trim(),
          slug: slug.trim(),
        })
        .returning();
      const [guest] = await db
        .insert(guests)
        .values({
          inviteeId: invitee.id,
          name: displayName.trim(),
        })
        .returning();
      return NextResponse.json({ invitee, guests: [guest] });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err) {
    console.error("Admin create invitee error:", err);
    return NextResponse.json(
      { error: "Failed to create invitee" },
      { status: 500 }
    );
  }
}
