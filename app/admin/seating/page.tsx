import { cookies } from "next/headers";
import { AdminPinGate } from "../../%5Fadmin/admin-pin-gate";
import { db } from "@/lib/db";
import { guests, invitees, seatingHeadSettings, seatingTableConfig } from "@/db/schema";
import { eq, or, isNull, asc } from "drizzle-orm";
import { SeatingArrangementClient, type SeatingGuest } from "./seating-client";
import type { Guest } from "@/db/schema";

/** Best-effort map from old 4×2 global grid to per-table 2-column layout */
const HEAD_SLOT_COUNT = 12;

function normalizeSeatFromGuest(guest: Guest): Pick<
  SeatingGuest,
  "seatTableIndex" | "seatRow" | "seatCol"
> {
  if (
    guest.seatTableIndex === -1 &&
    guest.seatRow != null &&
    guest.seatRow >= 0 &&
    guest.seatRow < HEAD_SLOT_COUNT
  ) {
    return {
      seatTableIndex: -1,
      seatRow: guest.seatRow,
      seatCol: 0,
    };
  }

  if (
    guest.seatTableIndex != null &&
    guest.seatTableIndex >= 0 &&
    guest.seatRow != null &&
    guest.seatCol != null &&
    guest.seatCol >= 0 &&
    guest.seatCol <= 1
  ) {
    return {
      seatTableIndex: guest.seatTableIndex,
      seatRow: guest.seatRow,
      seatCol: guest.seatCol,
    };
  }

  if (
    guest.seatTableIndex == null &&
    guest.seatRow != null &&
    guest.seatCol != null
  ) {
    const ROWS_BAND = 2;
    const COLS_OLD = 4;
    const TABLES_WIDE = 3;
    const band = Math.floor(guest.seatRow / ROWS_BAND);
    const localRow = guest.seatRow % ROWS_BAND;
    const tableInBand = Math.floor(guest.seatCol / COLS_OLD);
    const localCol = guest.seatCol % COLS_OLD;
    const seatTableIndex = band * TABLES_WIDE + tableInBand;
    const seatCol = Math.min(1, Math.floor(localCol / 2));
    return { seatTableIndex, seatRow: localRow, seatCol };
  }

  return { seatTableIndex: null, seatRow: null, seatCol: null };
}

export default async function SeatingArrangementPage() {
  const adminPin = process.env.ADMIN_PIN ?? process.env.ADMIN_SECRET;
  if (adminPin) {
    const cookieStore = await cookies();
    const authPin = cookieStore.get("admin_pin")?.value;
    if (authPin !== adminPin) {
      return <AdminPinGate />;
    }
  }

  const rows = await db
    .select({
      guest: guests,
      invitee: invitees,
    })
    .from(guests)
    .innerJoin(invitees, eq(guests.inviteeId, invitees.id))
    .where(or(isNull(guests.attending), eq(guests.attending, true)))
    .orderBy(asc(invitees.displayName), asc(guests.name));

  const configRows = await db.select().from(seatingTableConfig);
  const initialTableRowCounts: Record<number, number> = {};
  for (const r of configRows) {
    if (r.tableIndex >= 0) {
      initialTableRowCounts[r.tableIndex] = r.seatRows;
    }
  }

  const headRows = await db.select().from(seatingHeadSettings).limit(1);
  const initialBrideLeftOfGroom = headRows[0]?.brideLeftOfGroom ?? true;

  const initialGuests: SeatingGuest[] = rows.map(({ guest, invitee }) => {
    const seat = normalizeSeatFromGuest(guest);
    return {
      id: guest.id,
      name: guest.name,
      displayName: invitee.displayName,
      attending: guest.attending,
      ...seat,
    };
  });

  return (
    <SeatingArrangementClient
      initialGuests={initialGuests}
      initialTableRowCounts={initialTableRowCounts}
      initialBrideLeftOfGroom={initialBrideLeftOfGroom}
    />
  );
}
