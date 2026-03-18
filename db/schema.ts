import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const inviteeTypeEnum = pgEnum("invitee_type", ["family", "individual"]);

// Invitee = either a family or an individual
// URL: hisolermilan.com/[slug]
export const invitees = pgTable("invitees", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  type: inviteeTypeEnum("type").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Guests = people (family members or the individual)
export const guests = pgTable("guests", {
  id: uuid("id").primaryKey().defaultRandom(),
  inviteeId: uuid("invitee_id")
    .notNull()
    .references(() => invitees.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  attending: boolean("attending"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const inviteesRelations = relations(invitees, ({ many }) => ({
  guests: many(guests),
}));

export const guestsRelations = relations(guests, ({ one }) => ({
  invitee: one(invitees),
}));

export type Invitee = typeof invitees.$inferSelect;
export type NewInvitee = typeof invitees.$inferInsert;
export type Guest = typeof guests.$inferSelect;
export type NewGuest = typeof guests.$inferInsert;
