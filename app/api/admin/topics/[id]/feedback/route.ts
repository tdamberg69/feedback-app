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
    // Zusätzlich zum Cache-Busting zwischen Browser und Server jetzt auch
    // die Abfrage selbst bei jedem Aufruf eindeutig machen, falls irgendwo
    // zwischen unserem Server und der Datenbank (Treiber, Verbindungs-Pooling
    // o.ä.) eine identische Abfrage gecacht werden könnte.
    const cacheBuster = Date.now();
    const rows = await sql`
      select id, topic_id, content, rating, created_at
      from feedback_entries
      where ${cacheBuster}::bigint > 0
      order by created_at desc
    `;
    const filtered = rows.filter((r: any) => r.topic_id === params.id);
    return NextResponse.json(filtered, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Datenbankfehler beim Laden der Feedbacks." },
      { status: 500 }
    );
  }
}
