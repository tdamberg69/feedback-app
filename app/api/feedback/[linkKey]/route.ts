import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { linkKey: string } }
) {
  try {
    const rows = await sql`
      select id, title, description, active
      from feedback_topics
      where link_key = ${params.linkKey}
    `;
    if (!rows[0]) {
      return NextResponse.json(
        { error: "Kein Thema mit diesem Link gefunden." },
        { status: 404 }
      );
    }
    return NextResponse.json(rows[0], { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Datenbankfehler." }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { linkKey: string } }
) {
  try {
    const topicRows = await sql`
      select id, active from feedback_topics where link_key = ${params.linkKey}
    `;
    const topic = topicRows[0];
    if (!topic) {
      return NextResponse.json(
        { error: "Kein Thema mit diesem Link gefunden." },
        { status: 404 }
      );
    }
    if (!topic.active) {
      return NextResponse.json(
        { error: "Dieses Thema nimmt aktuell kein Feedback entgegen." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const content: string = (body.content ?? "").trim();
    if (!content) {
      return NextResponse.json({ error: "Feedback darf nicht leer sein." }, { status: 400 });
    }

    // Bewusst: es wird NICHTS außer Text + Zeitstempel gespeichert -
    // keine IP, keine Kennung, kein Bezug zum Absender.
    await sql`
      insert into feedback_entries (topic_id, content)
      values (${topic.id}, ${content})
    `;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Datenbankfehler beim Speichern des Feedbacks." },
      { status: 500 }
    );
  }
}
