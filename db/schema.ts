import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const inviteeTypeEnum = pgEnum("invitee_type", ["family", "individual"]);
export const individualSideEnum = pgEnum("individual_side", ["bride", "groom"]);

// Invitee = either a family or an individual
// URL: hisolermilan.com/[slug]
export const invitees = pgTable("invitees", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  type: inviteeTypeEnum("type").notNull(),
  individualSide: individualSideEnum("individual_side"),
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
  /**
   * Seating: which table (0 = top-left, then left-to-right, then next row of tables).
   * seatRow = row within that table (0 = head), seatCol = 0|1 (two columns of chairs).
   * All null = unassigned.
   */
  seatTableIndex: integer("seat_table_index"),
  seatRow: integer("seat_row"),
  seatCol: integer("seat_col"),
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
/** How many seat-rows each table has (each row = 2 chairs); keyed by table index */
export const seatingTableConfig = pgTable("seating_table_config", {
  tableIndex: integer("table_index").primaryKey(),
  seatRows: integer("seat_rows").notNull(),
});

/** Single row: bride/groom order at the head table (swap sides) */
export const seatingHeadSettings = pgTable("seating_head_settings", {
  singleton: integer("singleton").primaryKey().default(1),
  brideLeftOfGroom: boolean("bride_left_of_groom").notNull().default(true),
});

export type Guest = typeof guests.$inferSelect;
export type NewGuest = typeof guests.$inferInsert;
