import { NextRequest, NextResponse } from "next/server";

function getAdminPin() {
  return process.env.ADMIN_PIN ?? process.env.ADMIN_SECRET ?? "";
}

function authCookieConfig(value: string) {
  return {
    name: "admin_pin",
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export async function POST(request: NextRequest) {
  const configuredPin = getAdminPin();
  if (!configuredPin) {
    return NextResponse.json({ error: "Admin PIN is not configured." }, { status: 400 });
  }

  try {
    const body = (await request.json().catch(() => null)) as { pin?: string } | null;
    const pin = body?.pin?.trim();
    if (!pin || pin !== configuredPin) {
      return NextResponse.json({ error: "Invalid PIN." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(authCookieConfig(configuredPin));
    return response;
  } catch {
    return NextResponse.json({ error: "Failed to verify PIN." }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ ...authCookieConfig(""), maxAge: 0 });
  return response;
}
