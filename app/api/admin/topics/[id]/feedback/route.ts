import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }
  try {
    // Bewusst ohne WHERE-Bedingung in SQL (siehe Erfahrung aus der
    // Hockey-App: eine kombinierte/parametrisierte WHERE-Klausel lieferte
    // dort unzuverlässig leere Ergebnisse). Stattdessen alles laden und in
    // JS filtern - bei der zu erwartenden Datenmenge unproblematisch.
    const rows = await sql`
      select id, topic_id, content, created_at
      from feedback_entries
      order by created_at desc
    `;
    const filtered = rows.filter((r: any) => r.topic_id === params.id);
    return NextResponse.json(filtered, {
      headers: {
        "Cache-Control": "no-store",
        "X-Debug-Params-Id": params.id,
        "X-Debug-Total-Rows": String(rows.length),
        "X-Debug-Sample-Topic-Ids": JSON.stringify(
          rows.slice(0, 5).map((r: any) => r.topic_id)
        ),
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Datenbankfehler beim Laden der Feedbacks." },
      { status: 500 }
    );
  }
}
