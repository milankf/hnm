"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  UserPlus,
  Copy,
  Check,
  CircleCheck,
  CircleX,
  CircleMinus,
  MoreVertical,
} from "lucide-react";
import type { Invitee, Guest } from "@/db/schema";

type InviteeWithGuests = Invitee & { guests: Guest[] };
type IndividualSide = "bride" | "groom";
type BulkStatus = "idle" | "submitting" | "success" | "error";
type ParsedFamilyBlock = {
  displayName: string;
  memberNames: string[];
};

type AdminClientProps = {
  invitees: InviteeWithGuests[];
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function buildUniqueSlug(base: string, usedSlugs: Set<string>): string {
  const normalizedBase = base.trim() || "invitee";
  let candidate = normalizedBase;
  let suffix = 2;
  while (usedSlugs.has(candidate)) {
    candidate = `${normalizedBase}-${suffix}`;
    suffix += 1;
  }
  usedSlugs.add(candidate);
  return candidate;
}

function parseBulkFamilies(input: string): ParsedFamilyBlock[] {
  const blocks = input
    .split(/\n\s*\n+/)
    .map((block) =>
      block
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    )
    .filter((lines) => lines.length > 0);

  if (blocks.length === 0) {
    throw new Error("Paste at least one family block.");
  }

  return blocks.map((lines, index) => {
    const displayName = lines[0];
    const memberNames = lines.slice(1);
    if (!displayName) {
      throw new Error(`Family block ${index + 1} is missing a family name.`);
    }
    if (memberNames.length === 0) {
      throw new Error(`Family block ${index + 1} needs at least one member name.`);
    }
    return { displayName, memberNames };
  });
}

function parseBulkIndividuals(input: string): string[] {
  const names = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (names.length === 0) {
    throw new Error("Paste at least one name.");
  }
  return names;
}

function MemberStatusIcon({ attending }: { attending: boolean | null | undefined }) {
  if (attending === true) {
    return <CircleCheck className="h-3.5 w-3.5 shrink-0 text-green-600" />;
  }
  if (attending === false) {
    return <CircleX className="h-3.5 w-3.5 shrink-0 text-red-600" />;
  }
  return <CircleMinus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
}

export function AdminClient({ invitees }: AdminClientProps) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const [inviteesList, setInviteesList] = useState(invitees);
  const [familyOpen, setFamilyOpen] = useState(false);
  const [individualOpen, setIndividualOpen] = useState(false);
  const [bulkFamiliesOpen, setBulkFamiliesOpen] = useState(false);
  const [bulkIndividualsOpen, setBulkIndividualsOpen] = useState(false);
  const [familyDisplayName, setFamilyDisplayName] = useState("");
  const [familySlug, setFamilySlug] = useState("");
  const [familyMembers, setFamilyMembers] = useState(["", ""]);
  const [indDisplayName, setIndDisplayName] = useState("");
  const [indSlug, setIndSlug] = useState("");
  const [indSide, setIndSide] = useState<IndividualSide>("bride");
  const [familyStatus, setFamilyStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [familyStatusMessage, setFamilyStatusMessage] = useState("");
  const [indStatus, setIndStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [indStatusMessage, setIndStatusMessage] = useState("");
  const [bulkFamiliesText, setBulkFamiliesText] = useState("");
  const [bulkFamiliesStatus, setBulkFamiliesStatus] = useState<BulkStatus>("idle");
  const [bulkFamiliesStatusMessage, setBulkFamiliesStatusMessage] = useState("");
  const [bulkIndividualsText, setBulkIndividualsText] = useState("");
  const [bulkIndividualsSide, setBulkIndividualsSide] = useState<IndividualSide>("bride");
  const [bulkIndividualsStatus, setBulkIndividualsStatus] = useState<BulkStatus>("idle");
  const [bulkIndividualsStatusMessage, setBulkIndividualsStatusMessage] = useState("");
  const [copiedInviteeId, setCopiedInviteeId] = useState<string | null>(null);
  const [listActionNotice, setListActionNotice] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const [editOpen, setEditOpen] = useState(false);
  const [editInviteeId, setEditInviteeId] = useState<string | null>(null);
  const [editType, setEditType] = useState<"family" | "individual">("family");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editSide, setEditSide] = useState<IndividualSide>("bride");
  const [editMembers, setEditMembers] = useState<string[]>([""]);
  const [editStatus, setEditStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [editStatusMessage, setEditStatusMessage] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteInviteeId, setDeleteInviteeId] = useState<string | null>(null);
  const [deleteInviteeName, setDeleteInviteeName] = useState("");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [deleteStatusMessage, setDeleteStatusMessage] = useState("");

  const resetFamilyForm = () => {
    setFamilyDisplayName("");
    setFamilySlug("");
    setFamilyMembers(["", ""]);
    setFamilyStatus("idle");
    setFamilyStatusMessage("");
  };

  const resetIndividualForm = () => {
    setIndDisplayName("");
    setIndSlug("");
    setIndSide("bride");
    setIndStatus("idle");
    setIndStatusMessage("");
  };

  const resetBulkFamiliesForm = () => {
    setBulkFamiliesText("");
    setBulkFamiliesStatus("idle");
    setBulkFamiliesStatusMessage("");
  };

  const resetBulkIndividualsForm = () => {
    setBulkIndividualsText("");
    setBulkIndividualsSide("bride");
    setBulkIndividualsStatus("idle");
    setBulkIndividualsStatusMessage("");
  };

  const resetEditForm = () => {
    setEditInviteeId(null);
    setEditType("family");
    setEditDisplayName("");
    setEditSlug("");
    setEditSide("bride");
    setEditMembers([""]);
    setEditStatus("idle");
    setEditStatusMessage("");
  };

  const resetDeleteForm = () => {
    setDeleteInviteeId(null);
    setDeleteInviteeName("");
    setDeleteStatus("idle");
    setDeleteStatusMessage("");
  };

  const addFamilyMember = () => setFamilyMembers((prev) => [...prev, ""]);
  const updateFamilyMember = (i: number, v: string) =>
    setFamilyMembers((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  const removeFamilyMember = (i: number) =>
    setFamilyMembers((prev) => prev.filter((_, j) => j !== i));

  const addEditMember = () => setEditMembers((prev) => [...prev, ""]);
  const updateEditMember = (i: number, v: string) =>
    setEditMembers((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  const removeEditMember = (i: number) =>
    setEditMembers((prev) => prev.filter((_, j) => j !== i));

  const submitFamily = async () => {
    const members = familyMembers.filter(Boolean);
    if (!familyDisplayName.trim() || !familySlug.trim() || members.length === 0) return;
    setFamilyStatus("submitting");
    setFamilyStatusMessage("");
    try {
      const res = await fetch("/api/admin/invitees", {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: "family",
          displayName: familyDisplayName.trim(),
          slug: familySlug.trim(),
          memberNames: members,
        }),
      });
      const errData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(errData.error ?? "Failed to create family");
      }
      const data = errData as { invitee: Invitee; guests: Guest[] };
      setInviteesList((prev) => [...prev, { ...data.invitee, guests: data.guests }]);
      setFamilyStatus("success");
      setFamilyStatusMessage("Family added successfully.");
      setTimeout(() => {
        setFamilyOpen(false);
        resetFamilyForm();
      }, 1500);
    } catch (e) {
      setFamilyStatus("error");
      setFamilyStatusMessage(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const submitIndividual = async () => {
    if (!indDisplayName.trim() || !indSlug.trim()) return;
    setIndStatus("submitting");
    setIndStatusMessage("");
    try {
      const res = await fetch("/api/admin/invitees", {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: "individual",
          individualSide: indSide,
          displayName: indDisplayName.trim(),
          slug: indSlug.trim(),
        }),
      });
      const errData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(errData.error ?? "Failed to create individual");
      }
      const data = errData as { invitee: Invitee; guests: Guest[] };
      setInviteesList((prev) => [...prev, { ...data.invitee, guests: data.guests }]);
      setIndStatus("success");
      setIndStatusMessage("Individual added successfully.");
      setTimeout(() => {
        setIndividualOpen(false);
        resetIndividualForm();
      }, 1500);
    } catch (e) {
      setIndStatus("error");
      setIndStatusMessage(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const submitBulkFamilies = async () => {
    setBulkFamiliesStatus("submitting");
    setBulkFamiliesStatusMessage("");

    try {
      const parsedFamilies = parseBulkFamilies(bulkFamiliesText);
      const usedSlugs = new Set(inviteesList.map((inv) => inv.slug));
      const createdInvitees: InviteeWithGuests[] = [];
      const errors: string[] = [];

      for (const family of parsedFamilies) {
        const slug = buildUniqueSlug(slugify(family.displayName) || "family", usedSlugs);
        try {
          const res = await fetch("/api/admin/invitees", {
            method: "POST",
            headers,
            body: JSON.stringify({
              type: "family",
              displayName: family.displayName,
              slug,
              memberNames: family.memberNames,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error((data as { error?: string }).error ?? "Failed to create family");
          }
          const payload = data as { invitee: Invitee; guests: Guest[] };
          createdInvitees.push({ ...payload.invitee, guests: payload.guests });
        } catch (err) {
          errors.push(`${family.displayName}: ${err instanceof Error ? err.message : "Failed"}`);
        }
      }

      if (createdInvitees.length > 0) {
        setInviteesList((prev) => [...prev, ...createdInvitees]);
      }

      if (errors.length === 0) {
        setBulkFamiliesStatus("success");
        setBulkFamiliesStatusMessage(`Imported ${createdInvitees.length} families.`);
        window.setTimeout(() => {
          setBulkFamiliesOpen(false);
          resetBulkFamiliesForm();
        }, 1200);
        return;
      }

      setBulkFamiliesStatus("error");
      setBulkFamiliesStatusMessage(
        `Imported ${createdInvitees.length}/${parsedFamilies.length}. ${errors.slice(0, 2).join(" | ")}`
      );
    } catch (err) {
      setBulkFamiliesStatus("error");
      setBulkFamiliesStatusMessage(err instanceof Error ? err.message : "Failed to import families.");
    }
  };

  const submitBulkIndividuals = async () => {
    setBulkIndividualsStatus("submitting");
    setBulkIndividualsStatusMessage("");

    try {
      const parsedNames = parseBulkIndividuals(bulkIndividualsText);
      const usedSlugs = new Set(inviteesList.map((inv) => inv.slug));
      const createdInvitees: InviteeWithGuests[] = [];
      const errors: string[] = [];

      for (const name of parsedNames) {
        const slug = buildUniqueSlug(slugify(name) || "invitee", usedSlugs);
        try {
          const res = await fetch("/api/admin/invitees", {
            method: "POST",
            headers,
            body: JSON.stringify({
              type: "individual",
              individualSide: bulkIndividualsSide,
              displayName: name,
              slug,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error((data as { error?: string }).error ?? "Failed to create individual");
          }
          const payload = data as { invitee: Invitee; guests: Guest[] };
          createdInvitees.push({ ...payload.invitee, guests: payload.guests });
        } catch (err) {
          errors.push(`${name}: ${err instanceof Error ? err.message : "Failed"}`);
        }
      }

      if (createdInvitees.length > 0) {
        setInviteesList((prev) => [...prev, ...createdInvitees]);
      }

      if (errors.length === 0) {
        setBulkIndividualsStatus("success");
        setBulkIndividualsStatusMessage(
          `Imported ${createdInvitees.length} ${bulkIndividualsSide} individuals.`
        );
        window.setTimeout(() => {
          setBulkIndividualsOpen(false);
          resetBulkIndividualsForm();
        }, 1200);
        return;
      }

      setBulkIndividualsStatus("error");
      setBulkIndividualsStatusMessage(
        `Imported ${createdInvitees.length}/${parsedNames.length}. ${errors.slice(0, 2).join(" | ")}`
      );
    } catch (err) {
      setBulkIndividualsStatus("error");
      setBulkIndividualsStatusMessage(err instanceof Error ? err.message : "Failed to import names.");
    }
  };

  const copyInviteeLink = async (slug: string, inviteeId: string) => {
    const path = `/${slug}`;
    const fullUrl =
      typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedInviteeId(inviteeId);
      window.setTimeout(() => setCopiedInviteeId((current) => (current === inviteeId ? null : current)), 1200);
    } catch {
      // best effort fallback
      setCopiedInviteeId(inviteeId);
      window.setTimeout(() => setCopiedInviteeId((current) => (current === inviteeId ? null : current)), 1200);
    }
  };

  const showListActionNotice = (type: "success" | "error", message: string) => {
    setListActionNotice({ type, message });
    window.setTimeout(() => {
      setListActionNotice((current) => (current?.message === message ? null : current));
    }, 1800);
  };

  const resetMembersToPending = async ({
    inviteeId,
    guestIds,
    resetAllMembers = false,
  }: {
    inviteeId: string;
    guestIds?: string[];
    resetAllMembers?: boolean;
  }) => {
    try {
      const res = await fetch("/api/admin/invitees", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          action: "resetPending",
          inviteeId,
          guestIds,
          resetAllMembers,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Failed to reset to pending");
      }
      const payload = data as { invitee: Invitee; guests: Guest[] };
      setInviteesList((prev) =>
        prev.map((inv) =>
          inv.id === payload.invitee.id
            ? { ...inv, ...payload.invitee, guests: payload.guests }
            : inv
        )
      );
      showListActionNotice("success", "RSVP reset to pending.");
    } catch (err) {
      showListActionNotice("error", err instanceof Error ? err.message : "Failed to reset RSVP.");
    }
  };

  const openEditModal = (inv: InviteeWithGuests) => {
    setEditInviteeId(inv.id);
    setEditType(inv.type);
    setEditDisplayName(inv.displayName);
    setEditSlug(inv.slug);
    setEditSide((inv.individualSide as IndividualSide) ?? "bride");
    const memberNames = inv.guests.map((g) => g.name);
    setEditMembers(memberNames.length > 0 ? memberNames : [inv.displayName]);
    setEditStatus("idle");
    setEditStatusMessage("");
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editInviteeId) return;
    const memberNames = editMembers.map((name) => name.trim()).filter(Boolean);
    if (!editDisplayName.trim() || !editSlug.trim()) return;
    if (editType === "family" && memberNames.length === 0) return;

    setEditStatus("submitting");
    setEditStatusMessage("");
    try {
      const res = await fetch("/api/admin/invitees", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          inviteeId: editInviteeId,
          displayName: editDisplayName.trim(),
          slug: editSlug.trim(),
          individualSide: editType === "individual" ? editSide : undefined,
          memberNames: editType === "family" ? memberNames : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Failed to update invitee");
      }
      const payload = data as { invitee: Invitee; guests: Guest[] };
      setInviteesList((prev) =>
        prev.map((inv) => (inv.id === payload.invitee.id ? { ...payload.invitee, guests: payload.guests } : inv))
      );
      setEditStatus("success");
      setEditStatusMessage("Saved changes.");
      window.setTimeout(() => {
        setEditOpen(false);
        resetEditForm();
      }, 700);
    } catch (e) {
      setEditStatus("error");
      setEditStatusMessage(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const openDeleteModal = (inv: InviteeWithGuests) => {
    setDeleteInviteeId(inv.id);
    setDeleteInviteeName(inv.displayName);
    setDeleteStatus("idle");
    setDeleteStatusMessage("");
    setDeleteOpen(true);
  };

  const submitDelete = async () => {
    if (!deleteInviteeId) return;
    setDeleteStatus("submitting");
    setDeleteStatusMessage("");
    try {
      const res = await fetch("/api/admin/invitees", {
        method: "DELETE",
        headers,
        body: JSON.stringify({ inviteeId: deleteInviteeId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Failed to delete invitee");
      }
      setInviteesList((prev) => prev.filter((inv) => inv.id !== deleteInviteeId));
      setDeleteOpen(false);
      resetDeleteForm();
    } catch (e) {
      setDeleteStatus("error");
      setDeleteStatusMessage(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const allGuests = inviteesList.flatMap((invitee) => invitee.guests);
  const totalAddedCount = allGuests.length;
  const comingCount = allGuests.filter((guest) => guest.attending === true).length;
  const notComingCount = allGuests.filter((guest) => guest.attending === false).length;
  const noResponseCount = totalAddedCount - comingCount - notComingCount;
  const familyInvitees = inviteesList.filter((invitee) => invitee.type === "family");
  const individualInvitees = inviteesList.filter((invitee) => invitee.type === "individual");
  const brideIndividuals = individualInvitees.filter(
    (invitee) => (invitee.individualSide as IndividualSide | null) !== "groom"
  );
  const groomIndividuals = individualInvitees.filter(
    (invitee) => (invitee.individualSide as IndividualSide | null) === "groom"
  );

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Guest list</h1>
            <p className="mt-1 text-muted-foreground">
              Manage invitees and track RSVP status
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/admin/seating"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Seating arrangement
            </Link>
            <Link
              href="/"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              ← Back to site
            </Link>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => {
              resetFamilyForm();
              setFamilyOpen(true);
            }}
          >
            <Users className="h-4 w-4" />
            Add family
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => {
              resetIndividualForm();
              setIndividualOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4" />
            Add individual
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => {
              resetBulkFamiliesForm();
              setBulkFamiliesOpen(true);
            }}
          >
            Bulk families
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => {
              resetBulkIndividualsForm();
              setBulkIndividualsOpen(true);
            }}
          >
            Bulk bride/groom
          </Button>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-md border px-2 py-1.5">
            <p className="text-[10px] uppercase text-muted-foreground">Invited</p>
            <p className="text-base font-semibold leading-none">{totalAddedCount}</p>
          </div>
          <div className="rounded-md border px-2 py-1.5">
            <p className="text-[10px] uppercase text-muted-foreground">Coming</p>
            <p className="text-base font-semibold leading-none text-green-600">{comingCount}</p>
          </div>
          <div className="rounded-md border px-2 py-1.5">
            <p className="text-[10px] uppercase text-muted-foreground">No response</p>
            <p className="text-base font-semibold leading-none text-muted-foreground">{noResponseCount}</p>
          </div>
          <div className="rounded-md border px-2 py-1.5">
            <p className="text-[10px] uppercase text-muted-foreground">Not coming</p>
            <p className="text-base font-semibold leading-none text-red-600">{notComingCount}</p>
          </div>
        </div>
        {listActionNotice && (
          <Alert
            className="mb-3 py-2"
            variant={listActionNotice.type === "error" ? "destructive" : "default"}
          >
            <AlertDescription>{listActionNotice.message}</AlertDescription>
          </Alert>
        )}

        {inviteesList.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground" />
              <p className="mt-2 font-medium">No invitees yet</p>
              <p className="text-sm text-muted-foreground">
                Add a family or individual to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {familyInvitees.map((inv) => (
                <Card key={inv.id} className="p-2">
                  <CardContent className="flex flex-col p-2">
                    <CardTitle className="line-clamp-2 flex items-center justify-between text-xs sm:text-sm">
                      {inv.displayName}
                      <div className="ml-1 flex items-center gap-0.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-fit px-2 text-xs"
                          onClick={() => void copyInviteeLink(inv.slug, inv.id)}
                        >
                          {copiedInviteeId === inv.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-fit px-2 text-xs">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditModal(inv)}>Edit family</DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                void resetMembersToPending({
                                  inviteeId: inv.id,
                                  resetAllMembers: true,
                                })
                              }
                            >
                              Reset family to pending
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>Reset member to pending</DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {inv.guests.map((guest) => (
                                  <DropdownMenuItem
                                    key={guest.id}
                                    onClick={() =>
                                      void resetMembersToPending({
                                        inviteeId: inv.id,
                                        guestIds: [guest.id],
                                      })
                                    }
                                  >
                                    {guest.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteModal(inv)}
                              className="text-destructive focus:text-destructive"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardTitle>
                    <ul className="space-y-0.5">
                      {inv.guests.map((g) => (
                        <li key={g.id} className="flex min-w-0 items-center gap-1 text-[11px] font-medium sm:text-xs">
                          <MemberStatusIcon attending={g.attending} />
                          <span className="truncate">{g.name}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { title: "Bride individuals", invitees: brideIndividuals },
                { title: "Groom individuals", invitees: groomIndividuals },
              ].map((group) => (
                <Card key={group.title}>
                  <CardContent className="p-2">
                    <CardTitle className="text-xs sm:text-sm">{group.title}</CardTitle>
                    <ul className="mt-1.5 space-y-1">
                      {group.invitees.length === 0 ? (
                        <li className="text-[11px] text-muted-foreground sm:text-xs">None</li>
                      ) : (
                        group.invitees.map((inv) => (
                          <li key={inv.id} className="flex items-center justify-between gap-2 text-[11px] sm:text-xs">
                            <span className="flex min-w-0 items-center gap-1 font-medium">
                              <MemberStatusIcon attending={inv.guests[0]?.attending} />
                              <span className="truncate">{inv.displayName}</span>
                            </span>
                            <span className="flex shrink-0 items-center gap-0.5">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-fit px-1.5"
                                onClick={() => void copyInviteeLink(inv.slug, inv.id)}
                              >
                                {copiedInviteeId === inv.id ? (
                                  <Check className="h-3.5 w-3.5" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-6 w-fit px-1.5">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditModal(inv)}>
                                    Edit individual
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      void resetMembersToPending({
                                        inviteeId: inv.id,
                                        resetAllMembers: true,
                                      })
                                    }
                                  >
                                    Reset to pending
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => openDeleteModal(inv)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Add family dialog */}
        <Dialog
          open={familyOpen}
          onOpenChange={(open) => {
            setFamilyOpen(open);
            if (!open) resetFamilyForm();
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add family</DialogTitle>
              <DialogDescription>
                Create a new family invitee with multiple guests.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="family-display-name">Display name</Label>
                <Input
                  id="family-display-name"
                  value={familyDisplayName}
                  onChange={(e) => {
                    setFamilyDisplayName(e.target.value);
                    if (!familySlug) setFamilySlug(slugify(e.target.value));
                  }}
                  placeholder="e.g. Santos Family"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="family-slug">URL slug</Label>
                <Input
                  id="family-slug"
                  value={familySlug}
                  onChange={(e) => setFamilySlug(e.target.value)}
                  placeholder="e.g. santos"
                />
              </div>
              <div className="space-y-2">
                <Label>Family members</Label>
                {familyMembers.map((name, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={name}
                      onChange={(e) => updateFamilyMember(i, e.target.value)}
                      placeholder="Name"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={() => removeFamilyMember(i)}
                      disabled={familyMembers.length <= 2}
                    >
                      −
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={addFamilyMember}
                >
                  + Add member
                </Button>
              </div>
              {familyStatus === "success" && familyStatusMessage && (
                <Alert variant="default">
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{familyStatusMessage}</AlertDescription>
                </Alert>
              )}
              {familyStatus === "error" && familyStatusMessage && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{familyStatusMessage}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setFamilyOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={submitFamily}
                disabled={familyStatus === "submitting"}
              >
                {familyStatus === "submitting" ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add individual dialog */}
        <Dialog
          open={individualOpen}
          onOpenChange={(open) => {
            setIndividualOpen(open);
            if (!open) resetIndividualForm();
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add individual</DialogTitle>
              <DialogDescription>
                Create a new individual invitee.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="ind-display-name">Name</Label>
                <Input
                  id="ind-display-name"
                  value={indDisplayName}
                  onChange={(e) => {
                    setIndDisplayName(e.target.value);
                    if (!indSlug) setIndSlug(slugify(e.target.value));
                  }}
                  placeholder="e.g. Juan Dela Cruz"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ind-slug">URL slug</Label>
                <Input
                  id="ind-slug"
                  value={indSlug}
                  onChange={(e) => setIndSlug(e.target.value)}
                  placeholder="e.g. juan-dela-cruz"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ind-side">Side</Label>
                <select
                  id="ind-side"
                  value={indSide}
                  onChange={(e) => setIndSide(e.target.value as IndividualSide)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none"
                >
                  <option value="bride">Bride</option>
                  <option value="groom">Groom</option>
                </select>
              </div>
              {indStatus === "success" && indStatusMessage && (
                <Alert variant="default">
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{indStatusMessage}</AlertDescription>
                </Alert>
              )}
              {indStatus === "error" && indStatusMessage && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{indStatusMessage}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIndividualOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={submitIndividual}
                disabled={indStatus === "submitting"}
              >
                {indStatus === "submitting" ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk families dialog */}
        <Dialog
          open={bulkFamiliesOpen}
          onOpenChange={(open) => {
            setBulkFamiliesOpen(open);
            if (!open) resetBulkFamiliesForm();
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Bulk add families</DialogTitle>
              <DialogDescription>
                Paste family blocks. First line is family name, next lines are members, blank line separates families.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Label htmlFor="bulk-families-text">Families text</Label>
              <textarea
                id="bulk-families-text"
                value={bulkFamiliesText}
                onChange={(e) => setBulkFamiliesText(e.target.value)}
                rows={12}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm shadow-xs outline-none"
                placeholder={`Sample Family
Member 1
Member 2

Sample2 Family
Member 3
Member 4`}
              />
              {bulkFamiliesStatus === "success" && bulkFamiliesStatusMessage && (
                <Alert variant="default">
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{bulkFamiliesStatusMessage}</AlertDescription>
                </Alert>
              )}
              {bulkFamiliesStatus === "error" && bulkFamiliesStatusMessage && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{bulkFamiliesStatusMessage}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setBulkFamiliesOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={submitBulkFamilies}
                disabled={bulkFamiliesStatus === "submitting"}
              >
                {bulkFamiliesStatus === "submitting" ? "Importing…" : "Import families"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk individuals dialog */}
        <Dialog
          open={bulkIndividualsOpen}
          onOpenChange={(open) => {
            setBulkIndividualsOpen(open);
            if (!open) resetBulkIndividualsForm();
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Bulk add bride or groom individuals</DialogTitle>
              <DialogDescription>
                Paste one name per line and choose whether these names belong to bride or groom.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-individual-side">Side</Label>
                <select
                  id="bulk-individual-side"
                  value={bulkIndividualsSide}
                  onChange={(e) => setBulkIndividualsSide(e.target.value as IndividualSide)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none"
                >
                  <option value="bride">Bride</option>
                  <option value="groom">Groom</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulk-individual-text">Names</Label>
                <textarea
                  id="bulk-individual-text"
                  value={bulkIndividualsText}
                  onChange={(e) => setBulkIndividualsText(e.target.value)}
                  rows={12}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm shadow-xs outline-none"
                  placeholder={`Friend 1
Friend 2
Friend 3`}
                />
              </div>
              {bulkIndividualsStatus === "success" && bulkIndividualsStatusMessage && (
                <Alert variant="default">
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{bulkIndividualsStatusMessage}</AlertDescription>
                </Alert>
              )}
              {bulkIndividualsStatus === "error" && bulkIndividualsStatusMessage && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{bulkIndividualsStatusMessage}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setBulkIndividualsOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={submitBulkIndividuals}
                disabled={bulkIndividualsStatus === "submitting"}
              >
                {bulkIndividualsStatus === "submitting" ? "Importing…" : "Import individuals"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit invitee dialog */}
        <Dialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) resetEditForm();
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editType === "family" ? "Edit family" : "Edit individual"}</DialogTitle>
              <DialogDescription>Update invitee details and members.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-display-name">{editType === "family" ? "Display name" : "Name"}</Label>
                <Input
                  id="edit-display-name"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder={editType === "family" ? "e.g. Santos Family" : "e.g. Juan Dela Cruz"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-slug">URL slug</Label>
                <Input
                  id="edit-slug"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  placeholder="e.g. santos"
                />
              </div>
              {editType === "individual" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-side">Side</Label>
                  <select
                    id="edit-side"
                    value={editSide}
                    onChange={(e) => setEditSide(e.target.value as IndividualSide)}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none"
                  >
                    <option value="bride">Bride</option>
                    <option value="groom">Groom</option>
                  </select>
                </div>
              )}
              {editType === "family" && (
                <div className="space-y-2">
                  <Label>Family members</Label>
                  {editMembers.map((name, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={name}
                        onChange={(e) => updateEditMember(i, e.target.value)}
                        placeholder="Name"
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        onClick={() => removeEditMember(i)}
                        disabled={editMembers.length <= 1}
                      >
                        −
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" type="button" onClick={addEditMember}>
                    + Add member
                  </Button>
                </div>
              )}
              {editStatus === "success" && editStatusMessage && (
                <Alert variant="default">
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{editStatusMessage}</AlertDescription>
                </Alert>
              )}
              {editStatus === "error" && editStatusMessage && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{editStatusMessage}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={submitEdit} disabled={editStatus === "submitting"}>
                {editStatus === "submitting" ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirm dialog */}
        <Dialog
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open);
            if (!open) resetDeleteForm();
          }}
        >
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete family</DialogTitle>
              <DialogDescription>
                This will permanently remove <span className="font-medium">{deleteInviteeName}</span> and all members.
              </DialogDescription>
            </DialogHeader>
            {deleteStatus === "error" && deleteStatusMessage && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{deleteStatusMessage}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" type="button" onClick={submitDelete} disabled={deleteStatus === "submitting"}>
                {deleteStatus === "submitting" ? "Deleting…" : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
