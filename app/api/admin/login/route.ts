import { NextRequest, NextResponse } from "next/server";
import { checkPassword, computeSessionToken, ADMIN_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const password: string = body.password ?? "";

    if (!checkPassword(password)) {
      return NextResponse.json({ error: "Falsches Passwort." }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE_NAME, computeSessionToken(), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Serverfehler beim Login. Ist ADMIN_PASSWORD gesetzt?" },
      { status: 500 }
    );
  }
}
