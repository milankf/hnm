import { redirect } from "next/navigation";
import { AdminClient } from "./admin-client";
import { db } from "@/lib/db";
import { invitees, guests } from "@/db/schema";
import { asc } from "drizzle-orm";

type Props = { searchParams: Promise<{ key?: string }> };

export default async function AdminPage({ searchParams }: Props) {
  const { key } = await searchParams;
  const adminSecret = process.env.ADMIN_SECRET;

  if (adminSecret && key !== adminSecret) {
    redirect("/");
  }

  const allInvitees = await db.select().from(invitees).orderBy(asc(invitees.displayName));
  const allGuests = await db.select().from(guests);

  const inviteesWithGuests = allInvitees.map((inv) => ({
    ...inv,
    guests: allGuests.filter((g) => g.inviteeId === inv.id),
  }));

  return (
    <AdminClient
      invitees={inviteesWithGuests}
      baseUrl={process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}
      adminKey={key ?? undefined}
    />
  );
}
