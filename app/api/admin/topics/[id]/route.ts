import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }
  try {
    const body = await req.json();
    const existingRows = await sql`
      select id, title, description, link_key, active, created_at
      from feedback_topics where id = ${params.id}
    `;
    const existing = existingRows[0];
    if (!existing) {
      return NextResponse.json({ error: "Thema nicht gefunden." }, { status: 404 });
    }

    const title: string =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : existing.title;
    const description: string | null =
      body.description === undefined
        ? existing.description
        : body.description?.trim() || null;
    const active: boolean =
      typeof body.active === "boolean" ? body.active : existing.active;

    const rows = await sql`
      update feedback_topics
      set title = ${title}, description = ${description}, active = ${active}
      where id = ${params.id}
      returning id, title, description, link_key, active, created_at
    `;
    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Datenbankfehler beim Aktualisieren des Themas." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }
  try {
    // Feedbacks werden per ON DELETE CASCADE automatisch mitgelöscht.
    await sql`delete from feedback_topics where id = ${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Datenbankfehler beim Löschen des Themas." },
      { status: 500 }
    );
  }
}
