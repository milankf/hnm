"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users, UserPlus, ExternalLink, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import type { Invitee, Guest } from "@/db/schema";

type InviteeWithGuests = Invitee & { guests: Guest[] };

type AdminClientProps = {
  invitees: InviteeWithGuests[];
  baseUrl: string;
  adminKey?: string;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function GuestStatusBadge({ guest }: { guest: Guest }) {
  if (guest.attending === true) {
    return (
      <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-600/90">
        <CheckCircle2 className="h-3 w-3" />
        Coming
      </Badge>
    );
  }
  if (guest.attending === false) {
    return (
      <Badge variant="secondary" className="gap-1">
        <XCircle className="h-3 w-3" />
        Declined
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <HelpCircle className="h-3 w-3" />
      No response
    </Badge>
  );
}

export function AdminClient({ invitees, baseUrl, adminKey }: AdminClientProps) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(adminKey && { Authorization: `Bearer ${adminKey}` }),
  };
  const [inviteesList, setInviteesList] = useState(invitees);
  const [familyOpen, setFamilyOpen] = useState(false);
  const [individualOpen, setIndividualOpen] = useState(false);
  const [familyDisplayName, setFamilyDisplayName] = useState("");
  const [familySlug, setFamilySlug] = useState("");
  const [familyMembers, setFamilyMembers] = useState(["", ""]);
  const [indDisplayName, setIndDisplayName] = useState("");
  const [indSlug, setIndSlug] = useState("");
  const [familyStatus, setFamilyStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [familyStatusMessage, setFamilyStatusMessage] = useState("");
  const [indStatus, setIndStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [indStatusMessage, setIndStatusMessage] = useState("");

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
    setIndStatus("idle");
    setIndStatusMessage("");
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

  return (
    <div className="min-h-screen bg-background px-6 py-12 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Guest list</h1>
            <p className="mt-1 text-muted-foreground">
              Manage invitees and track RSVP status
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            ← Back to site
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
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
        </div>

        <div className="space-y-4">
          {inviteesList.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground" />
                <p className="mt-2 font-medium">No invitees yet</p>
                <p className="text-sm text-muted-foreground">
                  Add a family or individual to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            inviteesList.map((inv) => {
              const link = `${baseUrl}/${inv.slug}`;
              return (
                <Card key={inv.id}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-lg">{inv.displayName}</CardTitle>
                      <CardDescription className="mt-0.5 capitalize">
                        {inv.type}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="shrink-0 capitalize">
                      {inv.type}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {inv.guests.map((g) => (
                        <div
                          key={g.id}
                          className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5"
                        >
                          <span className="text-sm font-medium">{g.name}</span>
                          <GuestStatusBadge guest={g} />
                        </div>
                      ))}
                    </div>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {link}
                    </a>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

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
      </div>
    </div>
  );
}
