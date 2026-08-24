import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminRequest, generateLinkKey } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }
  try {
    // Bewusst OHNE SQL-JOIN/GROUP BY, und mit dynamischem Cache-Buster in
    // der WHERE-Klausel - vermeidet sowohl unzuverlässige Aggregation als
    // auch mögliches Caching zwischen Server und Datenbank.
    const cacheBuster = Date.now();
    const topics = await sql`
      select id, title, description, link_key, active,
             emoji_rating_enabled, emoji_unsure_enabled, created_at
      from feedback_topics
      where ${cacheBuster}::bigint > 0
      order by created_at desc
    `;
    const allEntries = await sql`
      select id, topic_id, rating from feedback_entries
      where ${cacheBuster}::bigint > 0
    `;

    const rows = topics.map((t: any) => {
      const entries = allEntries.filter((e: any) => e.topic_id === t.id);
      return {
        ...t,
        feedback_count: entries.length,
        up_count: entries.filter((e: any) => e.rating === "up").length,
        down_count: entries.filter((e: any) => e.rating === "down").length,
        unsure_count: entries.filter((e: any) => e.rating === "unsure").length,
      };
    });

    return NextResponse.json(rows, { headers: { "Cache-Control": "no-store" } });
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
    const emojiRatingEnabled: boolean = !!body.emoji_rating_enabled;
    const emojiUnsureEnabled: boolean = emojiRatingEnabled && !!body.emoji_unsure_enabled;

    if (!title) {
      return NextResponse.json({ error: "Titel ist ein Pflichtfeld." }, { status: 400 });
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      const linkKey = generateLinkKey();
      try {
        const rows = await sql`
          insert into feedback_topics
            (title, description, link_key, emoji_rating_enabled, emoji_unsure_enabled)
          values
            (${title}, ${description}, ${linkKey}, ${emojiRatingEnabled}, ${emojiUnsureEnabled})
          returning id, title, description, link_key, active,
                    emoji_rating_enabled, emoji_unsure_enabled, created_at
        `;
        return NextResponse.json(
          { ...rows[0], feedback_count: 0, up_count: 0, down_count: 0, unsure_count: 0 },
          { status: 201 }
        );
      } catch (err: any) {
        if (err?.code === "23505") continue;
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
