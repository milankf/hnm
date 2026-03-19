"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function AdminPinGate() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pin.trim()) return;

    setStatus("submitting");
    setMessage("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim() }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(data?.error ?? "Invalid PIN");
      }
      setPin("");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Failed to verify PIN");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <LockKeyhole className="mx-auto h-6 w-6 text-muted-foreground" />
          <CardTitle>Admin PIN</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-pin">Enter PIN</Label>
              <Input
                id="admin-pin"
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                placeholder="PIN"
              />
            </div>
            {status === "error" && message && (
              <Alert variant="destructive">
                <AlertTitle>Access denied</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={status === "submitting"}>
              {status === "submitting" ? "Checking..." : "Enter admin"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
