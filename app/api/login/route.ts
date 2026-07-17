import { NextRequest, NextResponse } from "next/server";
import {
  HARDCODED_PASSWORD,
  HARDCODED_USERNAME,
  SESSION_COOKIE,
  SESSION_VALUE,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (username === HARDCODED_USERNAME && password === HARDCODED_PASSWORD) {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, SESSION_VALUE, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return response;
  }

  return NextResponse.json(
    { ok: false, error: "Invalid credentials" },
    { status: 401 },
  );
}
