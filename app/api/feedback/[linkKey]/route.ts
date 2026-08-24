import { NextRequest, NextResponse } from "next/server";
import { sql, RATING_VALUES } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { linkKey: string } }
) {
  try {
    const rows = await sql`
      select id, title, description, active, emoji_rating_enabled, emoji_unsure_enabled
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
      select id, active, emoji_rating_enabled, emoji_unsure_enabled
      from feedback_topics where link_key = ${params.linkKey}
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
    const content: string | null = (body.content ?? "").trim() || null;

    let rating: string | null = null;
    if (topic.emoji_rating_enabled && body.rating) {
      if (!(RATING_VALUES as readonly string[]).includes(body.rating)) {
        return NextResponse.json({ error: "Ungültige Bewertung." }, { status: 400 });
      }
      if (body.rating === "unsure" && !topic.emoji_unsure_enabled) {
        return NextResponse.json({ error: "Ungültige Bewertung." }, { status: 400 });
      }
      rating = body.rating;
    }

    // Mindestens Text ODER (falls aktiviert) eine Emoji-Bewertung nötig.
    if (!content && !rating) {
      return NextResponse.json(
        { error: "Bitte Feedback eingeben oder eine Bewertung auswählen." },
        { status: 400 }
      );
    }

    // Bewusst: es wird NICHTS außer Text/Bewertung + Zeitstempel gespeichert.
    await sql`
      insert into feedback_entries (topic_id, content, rating)
      values (${topic.id}, ${content}, ${rating})
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
