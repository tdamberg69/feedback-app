import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminRequest, generateLinkKey } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }
  try {
    const rows = await sql`
      select t.id, t.title, t.description, t.link_key, t.active, t.created_at,
             count(f.id)::int as feedback_count
      from feedback_topics t
      left join feedback_entries f on f.topic_id = t.id
      group by t.id
      order by t.created_at desc
    `;
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Datenbankfehler beim Laden der Themen." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }
  try {
    const body = await req.json();
    const title: string = (body.title ?? "").trim();
    const description: string | null = body.description?.trim() || null;

    if (!title) {
      return NextResponse.json({ error: "Titel ist ein Pflichtfeld." }, { status: 400 });
    }

    // Falls der generierte Schlüssel (praktisch unmöglich) doch schon
    // existiert, ein paar Mal neu versuchen.
    for (let attempt = 0; attempt < 5; attempt++) {
      const linkKey = generateLinkKey();
      try {
        const rows = await sql`
          insert into feedback_topics (title, description, link_key)
          values (${title}, ${description}, ${linkKey})
          returning id, title, description, link_key, active, created_at
        `;
        return NextResponse.json({ ...rows[0], feedback_count: 0 }, { status: 201 });
      } catch (err: any) {
        if (err?.code === "23505") continue; // Kollision, nochmal versuchen
        throw err;
      }
    }
    return NextResponse.json(
      { error: "Konnte keinen eindeutigen Link generieren, bitte erneut versuchen." },
      { status: 500 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Datenbankfehler beim Anlegen des Themas." },
      { status: 500 }
    );
  }
}
