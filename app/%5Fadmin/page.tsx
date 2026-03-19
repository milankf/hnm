import { AdminClient } from "./admin-client";
import { AdminPinGate } from "./admin-pin-gate";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { invitees, guests } from "@/db/schema";
import { asc } from "drizzle-orm";

export default async function AdminPage() {
  const adminPin = process.env.ADMIN_PIN ?? process.env.ADMIN_SECRET;
  if (adminPin) {
    const cookieStore = await cookies();
    const authPin = cookieStore.get("admin_pin")?.value;
    if (authPin !== adminPin) {
      return <AdminPinGate />;
    }
  }

  const allInvitees = await db.select().from(invitees).orderBy(asc(invitees.displayName));
  const allGuests = await db.select().from(guests);

  const inviteesWithGuests = allInvitees.map((inv) => ({
    ...inv,
    guests: allGuests.filter((g) => g.inviteeId === inv.id),
  }));

  return <AdminClient invitees={inviteesWithGuests} />;
}
