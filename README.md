# Feedback-App

Ermöglicht anonymes Freitext-Feedback zu einem Thema. Ein Admin legt Themen
an und bekommt dafür einen nicht erratbaren Link, den er weitergeben kann.
Feedback-Geber sehen Titel und Beschreibung, geben Freitext ein und können
danach nicht mehr auf ihr eigenes Feedback zugreifen - es wird bewusst
nichts über den Absender gespeichert.

Kosten: **0 €** (Vercel Hobby + Neon Free Tier).

## 1. Datenbank: gleiches Neon-Projekt wie die anderen Apps

1. Im Neon-Dashboard das bestehende Projekt öffnen (dasselbe, das auch
   `recipes` bzw. `hockey_*`-Tabellen enthält).
2. Im **SQL Editor** den Inhalt von `neon-feedback-schema.sql` ausführen.
   Legt zwei neue, eigenständige Tabellen an.
3. Die **Connection String** kennst du bereits aus den anderen Projekten -
   das ist dein `DATABASE_URL`.

## 2. Admin-Passwort festlegen

Ein Passwort deiner Wahl, wird als `ADMIN_PASSWORD` gesetzt. Kann (und
sollte) sich von den Passwörtern der anderen Apps unterscheiden.

## 3. Lokal einrichten (optional, zum Testen)

```bash
npm install
cp .env.local.example .env.local
# .env.local mit echten Werten befüllen
npm run dev
```

## 4. Deployment auf Vercel (kostenlos)

1. Dieses Projekt in ein **eigenes, neues** GitHub-Repository pushen
   (Dateien direkt im Root).
2. Auf vercel.com → "Add New Project" → Repo auswählen → Next.js wird
   automatisch erkannt.
3. Unter **Environment Variables**:
   - `DATABASE_URL` = deine Neon Connection String
   - `ADMIN_PASSWORD` = dein gewähltes Admin-Passwort
4. Deploy.

## 5. Erste Schritte

1. `https://deine-app.vercel.app/admin` öffnen, mit `ADMIN_PASSWORD`
   einloggen.
2. Neues Thema anlegen (Titel + optionale Beschreibung).
3. Den generierten Link (z.B. `https://deine-app.vercel.app/f/kQ3f7z9XpN2`)
   über den Kopieren-Button holen und an die Feedback-Geber verschicken.

## Wie es funktioniert

**Feedback-Geber (`/f/nicht-erratbarer-link`)**
- Sehen Titel + Beschreibung des Themas
- Können Freitext eingeben und absenden
- Nach dem Absenden: Bestätigung, aber kein Zugriff mehr auf das eigene
  Feedback - können aber sofort ein weiteres, unabhängiges Feedback abgeben
- Ist das Thema auf "inaktiv" gesetzt, wird stattdessen ein Hinweis
  angezeigt und die Eingabe ist gesperrt
- Es wird **ausschließlich** der Freitext plus Datum/Uhrzeit gespeichert -
  keine IP-Adresse, keine Kennung, kein Bezug zum Absender

**Admin (`/admin`)**
- Themen anlegen, Titel/Beschreibung bearbeiten, aktiv/inaktiv umschalten
- Link pro Thema einsehen und kopieren
- Alle Feedbacks zu einem Thema einsehen (Feedback-Geber können das nicht)
- Einzelnes Feedback löschen (mit Sicherheitsabfrage)
- Ganzes Thema löschen (mit Sicherheitsabfrage, löscht automatisch auch
  alle zugehörigen Feedbacks)
