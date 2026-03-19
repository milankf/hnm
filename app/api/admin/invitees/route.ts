import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invitees, guests } from "@/db/schema";
import { and, asc, eq, ne } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get("authorization");
  const key = authHeader?.replace("Bearer ", "") ?? new URL(request.url).searchParams.get("key");
  if (adminSecret && key !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, displayName, slug, memberNames, individualSide } = body as {
      type: "family" | "individual";
      displayName: string;
      slug: string;
      memberNames?: string[];
      individualSide?: "bride" | "groom";
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
      if (individualSide !== "bride" && individualSide !== "groom") {
        return NextResponse.json(
          { error: "Individual side must be bride or groom" },
          { status: 400 }
        );
      }
      const [invitee] = await db
        .insert(invitees)
        .values({
          type: "individual",
          individualSide,
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

export async function PATCH(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get("authorization");
  const key = authHeader?.replace("Bearer ", "") ?? new URL(request.url).searchParams.get("key");
  if (adminSecret && key !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { inviteeId, displayName, slug, memberNames, individualSide } = body as {
      inviteeId: string;
      displayName: string;
      slug: string;
      memberNames?: string[];
      individualSide?: "bride" | "groom";
    };

    if (!inviteeId?.trim() || !displayName?.trim() || !slug?.trim()) {
      return NextResponse.json({ error: "Missing inviteeId, displayName, or slug" }, { status: 400 });
    }

    const normalizedDisplayName = displayName.trim();
    const normalizedSlug = slug.trim();

    const currentInvitee = await db.select().from(invitees).where(eq(invitees.id, inviteeId)).limit(1);
    if (currentInvitee.length === 0) {
      return NextResponse.json({ error: "Invitee not found" }, { status: 404 });
    }

    const existingSlug = await db
      .select()
      .from(invitees)
      .where(and(eq(invitees.slug, normalizedSlug), ne(invitees.id, inviteeId)))
      .limit(1);
    if (existingSlug.length > 0) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
    }

    const rawNames = Array.isArray(memberNames) ? memberNames : [];
    const sanitizedNames = rawNames.map((name) => name.trim()).filter(Boolean);
    const inviteeType = currentInvitee[0].type;
    const nextIndividualSide =
      inviteeType === "individual"
        ? individualSide === "bride" || individualSide === "groom"
          ? individualSide
          : currentInvitee[0].individualSide ?? "bride"
        : null;
    const nextNames =
      inviteeType === "individual"
        ? [sanitizedNames[0] ?? normalizedDisplayName]
        : sanitizedNames;

    if (inviteeType === "family" && nextNames.length === 0) {
      return NextResponse.json({ error: "Family must have at least one member" }, { status: 400 });
    }

    const [updatedInvitee] = await db
      .update(invitees)
      .set({
        displayName: normalizedDisplayName,
        slug: normalizedSlug,
        individualSide: nextIndividualSide,
        updatedAt: new Date(),
      })
      .where(eq(invitees.id, inviteeId))
      .returning();

    const existingGuests = await db
      .select()
      .from(guests)
      .where(eq(guests.inviteeId, inviteeId))
      .orderBy(asc(guests.createdAt));

    const sharedLength = Math.min(existingGuests.length, nextNames.length);

    for (let index = 0; index < sharedLength; index += 1) {
      const guest = existingGuests[index];
      const nextName = nextNames[index];
      if (guest.name !== nextName) {
        await db
          .update(guests)
          .set({ name: nextName, updatedAt: new Date() })
          .where(eq(guests.id, guest.id));
      }
    }

    if (nextNames.length > existingGuests.length) {
      const newNames = nextNames.slice(existingGuests.length);
      await db
        .insert(guests)
        .values(newNames.map((name) => ({ inviteeId, name })));
    } else if (existingGuests.length > nextNames.length) {
      const extras = existingGuests.slice(nextNames.length);
      for (const guest of extras) {
        await db.delete(guests).where(eq(guests.id, guest.id));
      }
    }

    const updatedGuests = await db
      .select()
      .from(guests)
      .where(eq(guests.inviteeId, inviteeId))
      .orderBy(asc(guests.createdAt));

    return NextResponse.json({ invitee: updatedInvitee, guests: updatedGuests });
  } catch (err) {
    console.error("Admin update invitee error:", err);
    return NextResponse.json({ error: "Failed to update invitee" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get("authorization");
  const key = authHeader?.replace("Bearer ", "") ?? new URL(request.url).searchParams.get("key");
  if (adminSecret && key !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { inviteeId } = body as { inviteeId: string };

    if (!inviteeId?.trim()) {
      return NextResponse.json({ error: "Missing inviteeId" }, { status: 400 });
    }

    const deleted = await db
      .delete(invitees)
      .where(eq(invitees.id, inviteeId))
      .returning({ id: invitees.id });

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Invitee not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin delete invitee error:", err);
    return NextResponse.json({ error: "Failed to delete invitee" }, { status: 500 });
  }
}
