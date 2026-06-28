# KochWelt

KochWelt ist eine moderne Rezeptplattform zum Entdecken, Teilen und Verwalten von Rezepten. Mit einer wachsenden Sammlung von Gerichten aus der ganzen Welt – von traditionellen Schweizer Klassikern bis zu internationalen Spezialitäten.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Sprache:** TypeScript (strict)
- **Styling:** Tailwind CSS
- **Datenbank:** Supabase (PostgreSQL)
- **Authentifizierung:** Supabase Auth
- **Datei-Upload:** Supabase Storage
- **Drag & Drop:** @dnd-kit
- **Linting:** ESLint

## Projekt einrichten

1. **Repository klonen**
   ```bash
   git clone https://github.com/dein-benutzername/kochwelt.git
   cd kochwelt
   ```

2. **Abhängigkeiten installieren**
   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren**
   Erstelle eine `.env.local`-Datei mit den Werten aus `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   Trage anschliessend deine Supabase-Projektwerte in `.env.local` ein.

4. **Supabase Projekt erstellen und Migrationen ausführen**
   ```bash
   npx supabase migration up
   ```

5. **Seed-Daten einspielen**
   ```bash
   npx supabase db seed
   ```

6. **Entwicklungsserver starten**
   ```bash
   npm run dev
   ```
   Die App ist unter [http://localhost:3000](http://localhost:3000) erreichbar.

## Funktionen

- **Rezepte durchsuchen** – Entdecke Rezepte nach Kategorien, Tags oder über die Volltextsuche
- **Rezepte erstellen & bearbeiten** – Erfasse Zutaten, Schritte, Schwierigkeitsgrad und Kochzeit
- **Publish-Toggle** – Veröffentliche Rezepte oder behalte sie als Entwurf
- **Bewertungen** – Gib Sternebewertungen ab und schreibe Kommentare
- **Mengenrechner** – Passe Portionsgrössen dynamisch an
- **Drag & Drop** – Ordne Zutaten und Schritte per Drag & Drop neu an
- **Bild-Upload** – Lade Rezeptbilder in den Supabase Storage hoch
- **Lesezeichen** – Speichere Lieblingsrezepte für später
- **Dashboard** – Verwalte alle eigenen Rezepte an einem Ort
- **Authentifizierung** – Registrierung und Login mit Supabase Auth

## Deployment

### Vercel (empfohlen)

1. Verbinde dein GitHub-Repository mit Vercel
2. Setze folgende Umgebungsvariablen im Vercel-Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploye das Projekt – Vercel erkennt Next.js automatisch

Die `vercel.json` im Projektroot konfiguriert Build- und Installationsbefehle.

> **Hinweis:** Stelle sicher, dass dein Supabase-Projekt in der Cloud läuft und die Migrations ausgeführt wurden, bevor du deployest.
