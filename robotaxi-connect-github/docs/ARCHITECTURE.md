# Architekturentscheidung · 15.09.2026

## Repository-Analyse

PAN-Viewer ist eine produktive SvelteKit-2/Svelte-5-Anwendung mit Vite 6, TypeScript, Tailwind 4, Supabase Auth/Postgres/Storage, Stripe und separaten Video-/Privacy-Workern. `src/routes` enthält Marketing, Kunden-/Mitarbeiterbereiche, Viewer, Upload, Projektverwaltung, Abnahmeformulare und zahlreiche APIs. `src/hooks.server.ts` und `src/lib/server` enthalten anwendungsspezifische Auth-, Berechtigungs- und Mandantenlogik. Bestehende Migrationen liegen in `/supabase/migrations`. Node wird durch Volta konfiguriert. Vor Arbeitsbeginn war der Git-Arbeitsbaum sauber (HEAD de74b78).

Die Root-TypeScript-Konfiguration und Vitest-Includes erfassen ausschließlich `src`/`tests`; die bestehende CI baut SvelteKit vom Root. Keine dieser Dateien, keine PAN-Umgebungsdatei und keine bestehende Datenbank wird verändert oder für Robotaxi geladen. Globale Format-/Lint-Kommandos vom Root sind künftig weiterhin auf PAN zu beschränken; Robotaxi hat eigene Prüfkommandos.

## Entscheidung

Eigenständiges Paket unter `apps/robotaxi-connect`, ohne npm-Workspace-Kopplung. Eigene Lockdatei, Build, Next.js App Router, React, TypeScript, Tailwind, Supabase-SSR und Railway-Docker-Konfiguration. Das Verzeichnis lässt sich unverändert in ein eigenes Repository verschieben. Port 3100 vermeidet Kollisionen. Keine gemeinsame Code-, Cookie-, Environment-, Supabase- oder Deployment-Konfiguration.

Stabile Versionen wurden am 15.09.2026 aus npm abgefragt: Next 16.3.5, React 19.3.0, Supabase JS 2.116.0, SSR 0.12.7, Tailwind 4.3.3. Exakte installierte Versionen stehen in der Lockdatei. Grundlagen: [Next Installation](https://nextjs.org/docs/app/getting-started/installation), [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Railway Next.js](https://docs.railway.com/guides/fullstack-nextjs).

## Vertrauensgrenzen

- Server Components, Actions und kontrollierte Download-Routen verwenden ausschließlich den authentifizierten Supabase-Client mit RLS. Keine Service-Role in Web-Requests.
- Supabase Auth prüft Identität und bestätigte E-Mail; Rolle kommt aus einer geschützten Profiltabelle, niemals aus selbst gesetzten User-Metadaten. ADMIN_EMPLOYEE ist vorbereitet; PROVIDER_USER erhält in V1 keine Firmenberechtigungen.
- Mitgliedschaft wird serverseitig ermittelt. Zusätzlich erzwingt PostgreSQL RLS dieselbe Mandantengrenze auch für direkte REST-Abfragen.
- Öffentliche Vertrags-/Referral-Daten und interne kaufmännische Daten liegen physisch getrennt. Eine versehentliche `select('*')`-Abfrage kann keine Provisionen aus den Kundentabellen laden.
- Kritische Aktionen laufen als begrenzte, autorisierende SQL-Funktionen: Registrierung, Freigabe, Vermittlung und Account-Deaktivierung. Daten, Audit und E-Mail-Outbox werden atomar geschrieben.
- E-Mail-Worker ist ein separater Prozess mit Secret-Key. Transaktionsoutbox mit Leasing, Wiederholung und stabilen Idempotenzschlüsseln; jeder Versuch erhält einen Logeintrag.
- Dokumentbucket ist privat. RLS prüft Mitgliedschaft UND Freigabe-Metadaten; Download-URLs laufen nach 60 Sekunden ab.
- Audit-Log ist für Anwendungsrollen unveränderbar. DB-Owner/Service-Role bleiben eine administrative Vertrauensgrenze; keine Behauptung vollständiger Manipulationssicherheit.

## Datenmodell

`profiles → company_members → companies → fleet_profiles`; `companies → company_contacts`; `providers → provider_contacts`; `companies + providers → referrals → referral_terms`; `companies → contracts → contract_terms`; `companies + contracts → documents`. Ergänzend: `company_private`, `activities`, `audit_logs`, `email_logs`, `email_attempts`, `privacy_requests`, `rate_limits`.

Firmenstatus und Freigabezeitpunkt sind getrennt: eine spätere Vertriebsstatusänderung hebt eine Freigabe nicht auf. Archivierte Firmen und deaktivierte Profile erhalten keinen Portal-Datenzugriff. Kritische Datensätze werden archiviert/storniert; keine DELETE-Grants.

## Betriebsgrenzen

Ein neues, leeres Supabase-Projekt in Frankfurt/eu-central-1 ist zwingend. Ohne Zugangsdaten sind Landingpage und Formularvorschau verfügbar, echte Schreibvorgänge bleiben gesperrt. Demo ist explizit nur in Development möglich. Produktion benötigt freigegebene Rechtstexte, verifizierte Absenderdomain, Auth-SMTP, Backups und eine eigene Railway-Anwendung. Deployment erfolgt nicht automatisch gegen vorhandene Dienste.
