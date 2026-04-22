import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guests, seatingHeadSettings, seatingTableConfig } from "@/db/schema";
import { eq } from "drizzle-orm";

function getAdminPin() {
  return process.env.ADMIN_PIN ?? process.env.ADMIN_SECRET ?? "";
}

function isAuthorized(request: NextRequest) {
  const adminPin = getAdminPin();
  if (!adminPin) return true;

  const authHeader = request.headers.get("authorization");
  const bearerKey = authHeader?.replace("Bearer ", "").trim() || "";
  const queryKey = new URL(request.url).searchParams.get("key") ?? "";
  const cookiePin = request.cookies.get("admin_pin")?.value ?? "";

  return bearerKey === adminPin || queryKey === adminPin || cookiePin === adminPin;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { assignments, tableRowCounts, brideLeftOfGroom } = body as {
      assignments?: {
        guestId: string;
        seatTableIndex: number | null;
        seatRow: number | null;
        seatCol: number | null;
      }[];
      tableRowCounts?: Record<string, number>;
      brideLeftOfGroom?: boolean;
    };

    const now = new Date();

    if (Array.isArray(assignments)) {
      for (const {
        guestId,
        seatTableIndex,
        seatRow,
        seatCol,
      } of assignments) {
        if (!guestId) continue;
        const placed =
          seatTableIndex != null && seatRow != null && seatCol != null;
        await db
          .update(guests)
          .set({
            seatTableIndex: placed ? seatTableIndex : null,
            seatRow: placed ? seatRow : null,
            seatCol: placed ? seatCol : null,
            updatedAt: now,
          })
          .where(eq(guests.id, guestId));
      }
    }

    if (tableRowCounts && typeof tableRowCounts === "object") {
      for (const [key, raw] of Object.entries(tableRowCounts)) {
        const tableIndex = Number(key);
        const seatRows = Math.max(1, Math.floor(Number(raw)));
        if (!Number.isFinite(tableIndex) || tableIndex < 0 || !Number.isFinite(seatRows)) continue;
        await db
          .insert(seatingTableConfig)
          .values({ tableIndex, seatRows })
          .onConflictDoUpdate({
            target: seatingTableConfig.tableIndex,
            set: { seatRows },
          });
      }
    }

    if (typeof brideLeftOfGroom === "boolean") {
      await db
        .insert(seatingHeadSettings)
        .values({ singleton: 1, brideLeftOfGroom })
        .onConflictDoUpdate({
          target: seatingHeadSettings.singleton,
          set: { brideLeftOfGroom },
        });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Seating save error:", err);
    return NextResponse.json({ error: "Failed to save seating" }, { status: 500 });
  }
}
