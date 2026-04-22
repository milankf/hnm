"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export type SeatingGuest = {
  id: string;
  name: string;
  displayName: string;
  attending: boolean | null;
  seatTableIndex: number | null;
  seatRow: number | null;
  seatCol: number | null;
};

const CHAIR_COLS = 2;
const TABLES_WIDE = 3;
const DEFAULT_SEAT_ROWS = 2;

const HEAD_TABLE_INDEX = -1;
const HEAD_SLOT_COUNT = 12;

const HEAD_LAYOUT: { slot: number; col: number; row: number; label: string }[] = [
  { slot: 0, col: 1, row: 1, label: "1" },
  { slot: 1, col: 2, row: 1, label: "2" },
  { slot: 2, col: 3, row: 1, label: "3" },
  { slot: 3, col: 6, row: 1, label: "3" },
  { slot: 4, col: 7, row: 1, label: "2" },
  { slot: 5, col: 8, row: 1, label: "1" },
  { slot: 6, col: 1, row: 2, label: "1" },
  { slot: 7, col: 1, row: 3, label: "2" },
  { slot: 8, col: 1, row: 4, label: "3" },
  { slot: 9, col: 8, row: 2, label: "1" },
  { slot: 10, col: 8, row: 3, label: "2" },
  { slot: 11, col: 8, row: 4, label: "3" },
];

type CellKey = `${number},${number},${number}`;

function cellKey(tableIndex: number, row: number, col: number): CellKey {
  return `${tableIndex},${row},${col}`;
}

type SeatingArrangementClientProps = {
  initialGuests: SeatingGuest[];
  initialTableRowCounts: Record<number, number>;
  initialBrideLeftOfGroom: boolean;
};

export function SeatingArrangementClient({
  initialGuests,
  initialTableRowCounts,
  initialBrideLeftOfGroom,
}: SeatingArrangementClientProps) {
  const [guests, setGuests] = useState(initialGuests);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [brideLeftOfGroom, setBrideLeftOfGroom] = useState(initialBrideLeftOfGroom);
  const [rowCounts, setRowCounts] = useState<Record<number, number>>(() => {
    const m: Record<number, number> = { ...initialTableRowCounts };
    for (const g of initialGuests) {
      if (g.seatTableIndex != null && g.seatTableIndex >= 0 && g.seatRow != null) {
        const ti = g.seatTableIndex;
        m[ti] = Math.max(m[ti] ?? DEFAULT_SEAT_ROWS, g.seatRow + 1);
      }
    }
    return m;
  });

  const rowCountsRef = useRef(rowCounts);
  rowCountsRef.current = rowCounts;

  const maxTableIndexFromGuests = useMemo(
    () =>
      guests.reduce(
        (m, g) =>
          g.seatTableIndex != null && g.seatTableIndex >= 0
            ? Math.max(m, g.seatTableIndex)
            : m,
        -1
      ),
    [guests]
  );

  const maxTableIndexFromRowCounts = useMemo(() => {
    const keys = Object.keys(rowCounts)
      .map(Number)
      .filter((k) => k >= 0 && Number.isFinite(k));
    return keys.length ? Math.max(...keys) : -1;
  }, [rowCounts]);

  const minBands = useMemo(() => {
    const maxTi = Math.max(maxTableIndexFromGuests, maxTableIndexFromRowCounts);
    return maxTi < 0 ? 1 : Math.floor(maxTi / TABLES_WIDE) + 1;
  }, [maxTableIndexFromGuests, maxTableIndexFromRowCounts]);

  const totalBands = Math.max(1, minBands);

  const effectiveRowCounts = useMemo(() => {
    const out: Record<number, number> = { ...rowCounts };
    for (let band = 0; band < totalBands; band++) {
      for (let t = 0; t < TABLES_WIDE; t++) {
        const ti = band * TABLES_WIDE + t;
        let need = out[ti] ?? DEFAULT_SEAT_ROWS;
        for (const g of guests) {
          if (
            g.seatTableIndex === ti &&
            g.seatTableIndex >= 0 &&
            g.seatRow != null
          ) {
            need = Math.max(need, g.seatRow + 1);
          }
        }
        out[ti] = Math.max(DEFAULT_SEAT_ROWS, need);
      }
    }
    return out;
  }, [rowCounts, totalBands, guests]);

  const cellOccupant = useMemo(() => {
    const m = new Map<CellKey, string>();
    for (const g of guests) {
      if (
        g.seatTableIndex != null &&
        g.seatRow != null &&
        g.seatCol != null
      ) {
        m.set(cellKey(g.seatTableIndex, g.seatRow, g.seatCol), g.id);
      }
    }
    return m;
  }, [guests]);

  const unassigned = useMemo(
    () =>
      guests.filter(
        (g) =>
          g.seatTableIndex == null ||
          g.seatRow == null ||
          g.seatCol == null
      ),
    [guests]
  );

  const guestById = useMemo(() => new Map(guests.map((g) => [g.id, g])), [guests]);

  const persist = useCallback(
    async (
      nextGuests: SeatingGuest[],
      counts: Record<number, number>,
      brideOrder?: boolean
    ) => {
      setSaveStatus("saving");
      try {
        const res = await fetch("/api/admin/seating", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            assignments: nextGuests.map((g) => ({
              guestId: g.id,
              seatTableIndex: g.seatTableIndex,
              seatRow: g.seatRow,
              seatCol: g.seatCol,
            })),
            tableRowCounts: counts,
            ...(brideOrder !== undefined ? { brideLeftOfGroom: brideOrder } : {}),
          }),
        });
        if (!res.ok) throw new Error("save failed");
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("error");
      }
    },
    []
  );

  const buildFullRowCounts = useCallback(
    (guestList: SeatingGuest[], mergedRowCounts: Record<number, number>) => {
      const maxFromGuests = guestList.reduce(
        (m, g) =>
          g.seatTableIndex != null && g.seatTableIndex >= 0
            ? Math.max(m, g.seatTableIndex)
            : m,
        -1
      );
      const countKeys = Object.keys(mergedRowCounts)
        .map(Number)
        .filter((k) => k >= 0 && Number.isFinite(k));
      const maxFromCounts = countKeys.length ? Math.max(...countKeys) : -1;
      const maxTi = Math.max(maxFromGuests, maxFromCounts);
      const minBands =
        maxTi < 0 ? 1 : Math.floor(maxTi / TABLES_WIDE) + 1;
      const bandsTotal = Math.max(1, minBands);
      const out: Record<number, number> = {};
      for (let band = 0; band < bandsTotal; band++) {
        for (let t = 0; t < TABLES_WIDE; t++) {
          const ti = band * TABLES_WIDE + t;
          let need = mergedRowCounts[ti] ?? DEFAULT_SEAT_ROWS;
          for (const g of guestList) {
            if (
              g.seatTableIndex === ti &&
              g.seatTableIndex >= 0 &&
              g.seatRow != null
            ) {
              need = Math.max(need, g.seatRow + 1);
            }
          }
          out[ti] = Math.max(DEFAULT_SEAT_ROWS, need);
        }
      }
      return out;
    },
    []
  );

  const assignToCell = useCallback(
    (
      guestId: string,
      tableIndex: number | null,
      row: number | null,
      col: number | null
    ) => {
      setGuests((prev) => {
        const target = prev.find((g) => g.id === guestId);
        if (!target) return prev;

        const next = prev.map((g) => ({ ...g }));

        const validHall =
          tableIndex != null &&
          tableIndex >= 0 &&
          row != null &&
          col != null &&
          col >= 0 &&
          col < CHAIR_COLS;
        const validHead =
          tableIndex === HEAD_TABLE_INDEX &&
          row != null &&
          row >= 0 &&
          row < HEAD_SLOT_COUNT &&
          col === 0;

        if (validHall || validHead) {
          const other = next.find(
            (g) =>
              g.id !== guestId &&
              g.seatTableIndex === tableIndex &&
              g.seatRow === row &&
              g.seatCol === (validHead ? 0 : col)
          );
          const mover = next.find((g) => g.id === guestId)!;
          if (other) {
            other.seatTableIndex = mover.seatTableIndex;
            other.seatRow = mover.seatRow;
            other.seatCol = mover.seatCol;
          }
          mover.seatTableIndex = tableIndex;
          mover.seatRow = row;
          mover.seatCol = validHead ? 0 : col;
        } else {
          const mover = next.find((g) => g.id === guestId)!;
          mover.seatTableIndex = null;
          mover.seatRow = null;
          mover.seatCol = null;
        }

        const merged = { ...rowCountsRef.current };
        const counts = buildFullRowCounts(next, merged);
        void persist(next, counts);
        return next;
      });
    },
    [persist, buildFullRowCounts]
  );

  const toggleBrideGroom = () => {
    const next = !brideLeftOfGroom;
    setBrideLeftOfGroom(next);
    const merged = { ...rowCountsRef.current };
    const counts = buildFullRowCounts(guests, merged);
    void persist(guests, counts, next);
  };

  const addSeatRowToTable = (tableIndex: number) => {
    if (tableIndex < 0) return;
    setRowCounts((prev) => {
      let base = prev[tableIndex] ?? DEFAULT_SEAT_ROWS;
      for (const g of guests) {
        if (g.seatTableIndex === tableIndex && g.seatRow != null) {
          base = Math.max(base, g.seatRow + 1);
        }
      }
      base = Math.max(DEFAULT_SEAT_ROWS, base);
      const merged = { ...prev, [tableIndex]: base + 1 };
      const full = buildFullRowCounts(guests, merged);
      void persist(guests, full);
      return merged;
    });
  };

  const onDragStart = (e: React.DragEvent, guestId: string) => {
    e.dataTransfer.setData("text/plain", guestId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(guestId);
  };

  const onDragEnd = () => setDraggingId(null);

  const onDragOverCell = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDropCell = (
    e: React.DragEvent,
    tableIndex: number,
    row: number,
    col: number
  ) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) assignToCell(id, tableIndex, row, col);
    setDraggingId(null);
  };

  const onDropHeadSlot = (e: React.DragEvent, slot: number) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) assignToCell(id, HEAD_TABLE_INDEX, slot, 0);
    setDraggingId(null);
  };

  const onDropPool = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) assignToCell(id, null, null, null);
    setDraggingId(null);
  };

  const renderGuestChip = (g: SeatingGuest, compact?: boolean) => (
    <div
      key={g.id}
      draggable
      onDragStart={(e) => onDragStart(e, g.id)}
      onDragEnd={onDragEnd}
      className={`cursor-grab rounded-md border border-border bg-card px-2 py-1.5 text-sm shadow-sm active:cursor-grabbing ${
        draggingId === g.id ? "opacity-60" : ""
      } ${compact ? "text-center w-full" : ""}`}
      title={`${g.name} · ${g.displayName}`}
    >
      <div className="font-medium leading-tight line-clamp-2">{g.name}</div>
      {!compact && (
        <div className="text-xs text-muted-foreground truncate max-w-[160px]">
          {g.displayName}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-4 py-8 font-mono sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium">Seating arrangement</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pending and confirmed guests only. Start with the <strong>head table</strong>{" "}
              (bride &amp; groom), then hall tables: <strong>{CHAIR_COLS} columns</strong> per
              table; use <strong>Add seats</strong> for more chair rows per table.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus === "saving" && (
              <span className="text-sm text-muted-foreground">Saving…</span>
            )}
            {saveStatus === "saved" && (
              <span className="text-sm text-green-600">Saved</span>
            )}
            {saveStatus === "error" && (
              <span className="text-sm text-destructive">Save failed</span>
            )}
            <Link
              href="/_admin"
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm hover:bg-accent"
            >
              Admin
            </Link>
          </div>
        </div>

        <div
          className="mb-8 rounded-lg border border-dashed border-border bg-muted/30 p-4"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }}
          onDrop={onDropPool}
        >
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Unassigned</h2>
          <div className="flex flex-wrap gap-2 min-h-[48px]">
            {unassigned.length === 0 ? (
              <span className="text-sm text-muted-foreground">Everyone is seated</span>
            ) : (
              unassigned.map((g) => renderGuestChip(g))
            )}
          </div>
        </div>

        <section className="mb-10 rounded-xl border-2 border-primary/25 bg-primary/5 p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium">Head table</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Bride and groom in the center; numbered seats match your sketch (1–2–3, sides,
                then 3–2–1).
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="font-mono text-xs shrink-0"
              onClick={toggleBrideGroom}
            >
              Swap bride ↔ groom
            </Button>
          </div>
          <div
            className="mx-auto max-w-4xl rounded-lg border border-border bg-background/80 p-3 sm:p-4"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
              gridTemplateRows: "repeat(4, minmax(4.25rem, auto))",
              gap: "0.5rem",
            }}
          >
            {HEAD_LAYOUT.map(({ slot, col, row, label }) => {
              const k = cellKey(HEAD_TABLE_INDEX, slot, 0);
              const occupantId = cellOccupant.get(k);
              const occupant = occupantId ? guestById.get(occupantId) : null;
              return (
                <div
                  key={slot}
                  style={{ gridColumn: col, gridRow: row }}
                  onDragOver={onDragOverCell}
                  onDrop={(e) => onDropHeadSlot(e, slot)}
                  className="relative flex min-h-[4.25rem] flex-col items-center justify-center rounded-md border border-border bg-card/90 p-1 transition-colors hover:bg-muted/40"
                >
                  <span className="absolute left-1 top-0.5 text-[10px] font-medium text-muted-foreground">
                    {label}
                  </span>
                  {occupant ? renderGuestChip(occupant, true) : null}
                </div>
              );
            })}
            <div
              style={{
                gridColumn: brideLeftOfGroom ? 4 : 5,
                gridRow: 1,
              }}
              className="flex items-center justify-center rounded-lg border-2 border-primary/50 bg-background px-1 py-2 text-center text-sm font-semibold tracking-tight text-foreground"
            >
              Bride
            </div>
            <div
              style={{
                gridColumn: brideLeftOfGroom ? 5 : 4,
                gridRow: 1,
              }}
              className="flex items-center justify-center rounded-lg border-2 border-primary/50 bg-background px-1 py-2 text-center text-sm font-semibold tracking-tight text-foreground"
            >
              Groom
            </div>
          </div>
        </section>

        <div className="space-y-8">
          {Array.from({ length: totalBands }, (_, band) => {
            const globalTableNumber = band * TABLES_WIDE;
            return (
              <div
                key={band}
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {Array.from({ length: TABLES_WIDE }, (_, tInBand) => {
                  const tableIndex = globalTableNumber + tInBand;
                  const tableNum = tableIndex + 1;
                  const seatRows = effectiveRowCounts[tableIndex] ?? DEFAULT_SEAT_ROWS;

                  return (
                    <div
                      key={tableIndex}
                      className="rounded-lg border-2 border-foreground/15 bg-card/50 p-3 shadow-sm"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Table {tableNum}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 font-mono text-xs"
                          onClick={() => addSeatRowToTable(tableIndex)}
                        >
                          + Add seats (row)
                        </Button>
                      </div>
                      <div
                        className="grid gap-2"
                        style={{
                          gridTemplateColumns: `repeat(${CHAIR_COLS}, minmax(0, 1fr))`,
                          gridTemplateRows: `repeat(${seatRows}, minmax(4.5rem, auto))`,
                        }}
                      >
                        {Array.from({ length: seatRows * CHAIR_COLS }, (_, i) => {
                          const row = Math.floor(i / CHAIR_COLS);
                          const col = i % CHAIR_COLS;
                          const k = cellKey(tableIndex, row, col);
                          const occupantId = cellOccupant.get(k);
                          const occupant = occupantId ? guestById.get(occupantId) : null;

                          return (
                            <div
                              key={k}
                              onDragOver={onDragOverCell}
                              onDrop={(e) => onDropCell(e, tableIndex, row, col)}
                              className="flex min-h-[4.5rem] items-center justify-center rounded-md border border-border bg-background/80 p-1 transition-colors hover:bg-muted/50"
                            >
                              {occupant ? renderGuestChip(occupant, true) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
