# Robotaxi Connect · V1

Eigenständige B2B-Vermittlungsplattform für Taxi-, Mietwagen- und Flottenunternehmen sowie Anbieter autonomer Mobilität. Der Arbeitsname ist zentral austauschbar.

**Diese Anwendung gehört nicht zum PAN-Viewer.** Alle Befehle in diesem Dokument werden im Verzeichnis dieser `package.json` ausgeführt (im ursprünglichen Workspace: `apps/robotaxi-connect`; im separaten Repository: dessen Wurzel). Sie verwendet ein neues Supabase-Projekt, eigene Schlüssel, eigene Cookies, eine eigene Lockdatei und einen eigenen Railway-Service. Keine Root-Pakete oder PAN-Migrationen ausführen oder verändern.

## Lokal starten

Voraussetzung: Node.js 22.17+ oder 24 LTS, npm.

```powershell
cd 'D:\SICHERUNG Panolite V01\CMSaasStarter-main\pan-viewer\apps\robotaxi-connect'
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Öffnen: [Deutsch](http://localhost:3100/de), [Englisch](http://localhost:3100/en). Ohne Konfiguration funktionieren die öffentliche Website und die Formularansichten. Echte Registrierung und Datenzugriff bleiben gesperrt. Es werden keine Mock-Erfolge gemeldet.

### Schreibgeschützte Demo ohne Datenbank

```powershell
$env:ROBOTAXI_DEMO='true'
npm run dev
```

[Firmenportal](http://localhost:3100/de/demo/portal) · [Adminbereich](http://localhost:3100/de/demo/admin). Alle Daten sind fiktiv. Die Demo ist vom echten Portal getrennt; `NODE_ENV=production` sperrt Demo-Routen unabhängig vom Flag. Der Demo-Seed wird niemals automatisch ausgeführt.

## Funktionsumfang

- DE/EN-Landingpage, Auth-Oberflächen, Firmenportal und Adminbereich.
- Supabase Auth: Registrierung, E-Mail-Verifizierung, Login, Logout, Passwort-Reset. Zweistufiges Firmen-Onboarding mit Zustimmung und administrativer Freigabe.
- Firmen, Kontakte, Flotten, interne Notizen, Firmenstatus und zusätzliche bestätigte Firmenbenutzer.
- Anbieter mit mehreren Kontakten, Aktivstatus und Angebotsbeschreibung.
- Vermittlungsdialog mit Vorschau aller ausgewählten Informationen. Atomare Erstellung, UUID, ausführender Admin, Zeitpunkt, Provisionsvereinbarung, Audit und zwei E-Mail-Aufträge. Doppelklicks werden über Idempotenzschlüssel abgefangen.
- Verträge, separate interne Vertragskonditionen, PDF-Zuordnung, private Dokumente und 60 Sekunden gültige Download-URLs.
- Datenbank-RLS, geschützte Rollen, Audit, Export, Löschanfragen und sofortige Account-Deaktivierung.
- Transaktionale DE/EN-E-Mails über einen austauschbaren Transport (Resend als erste Integration), unabhängiger Worker, Retry/Leasing/Versuchsprotokoll.
- Paginierte Adminlisten und serverseitig aggregierte Kennzahlen. Pipeline zeigt Fixprovisionen getrennt nach Währung; ohne Bezugswert werden Prozentprovisionen nicht in einen Geldwert umgerechnet.

## Projektstruktur

```text
src/app/[locale]/             Landing, Auth, Portal, Admin, Rechtstexte, Demo
src/app/actions/              validierte Server Actions
src/app/api/                  geschützte Downloads/Export, Health/Readiness
src/components/               wiederverwendbare Oberflächen und Formulare
src/config/brand.ts           zentrale Marke, Claim, Logo, Kontakt, Absender
src/i18n/messages.ts          vollständige DE/EN-Texte und Statuslabels
src/lib/supabase/             SSR-Client und Datenbank-Identitätsprüfung
src/lib/email/                Templates und Transport-Schnittstelle
supabase/migrations/          nur für das neue Robotaxi-Projekt
supabase/templates/           aus der Brand-Konfiguration erzeugte Auth-Templates
scripts/                     E-Mail-Worker, Auth-Templates, lokaler Seed
tests/                       PostgreSQL-/Sicherheitstests und optionale Integration
docs/                        Architektur, Betrieb und Produktionsfreigabe
```

## Einrichtung und Betrieb

**Erste Veröffentlichung mit eigenem GitHub-Repository:** [Schritt für Schritt: GitHub, Railway und Supabase](docs/GITHUB-RAILWAY-START.md).

1. [Supabase einrichten und migrieren](docs/SUPABASE.md).
2. [Umgebungsvariablen setzen](docs/ENVIRONMENT.md).
3. [Railway Web + Worker deployen](docs/DEPLOYMENT.md).
4. [Produktionscheckliste abarbeiten](docs/PRODUCTION-CHECKLIST.md).

Brand-Änderungen: `ROBOTAXI_BRAND_*`/weitere dokumentierte Variablen oder `src/config/brand.ts` anpassen, `npm run auth:templates` ausführen, Auth-Vorlagen in Supabase übernehmen und Web/Worker neu deployen. Benutzertexte liegen in einer zentralen DE/EN-Datei. Das vom Betreiber bereitgestellte RTC-Logo liegt unverändert unter `public/robotaxi-logo.png` und wird in Navigation, Fußzeile, Portal und Browser-Tab verwendet.

## Prüfungen

```powershell
npm run typecheck
npm test
npm run build
```

`npm test` führt die tatsächlichen SQL-Migrationen in PGlite (PostgreSQL) aus und prüft SQL-Rechte, RLS, Mandantentrennung, Firmenzuordnung, Adminrechte, Referral-Transaktionen, Vertrags-/Dokumentzugriff, Audit, Workerrechte, Deaktivierung und Validierung. Supabase-eigene Auth-/Storage-Infrastruktur wird dafür minimal nachgebildet. Ein erfolgreicher Test ersetzt keinen Test des gehosteten Supabase-Dienstes.

Reale Auth-/REST-Integration: eigenes **wegwerfbares lokales Supabase** starten, Testvariablen setzen, `npm run test:database`. Dieser Test erzeugt lokale Testbenutzer/-unternehmen und führt keine Löschung historischer Geschäftsdaten durch. Danach den lokalen Teststack verwerfen. Remote-URLs werden abgelehnt.

Vorbereitete Browserregression: `npx playwright install chromium`, dann `npm run test:browser`. Diese Suite erwartet eine unkonfigurierte lokale Demo (`ROBOTAXI_DEMO=true`, keine echten Backend-Keys). Für konfiguriertes Supabase gilt zusätzlich der manuelle End-to-End-Abnahmelauf in der Produktionscheckliste.

## Noch erforderliche externe Einrichtung

Ein neues Supabase-Projekt in Frankfurt, eigene API-Konfiguration, E-Mail-Absender/Resend/SMTP, Betreiberangaben und freigegebene Rechtstexte sowie ein eigener Railway-Service sind erforderlich. Ohne diese Angaben ist die V1 **nicht öffentlich betriebsbereit**. Siehe [Umsetzungs- und Prüfstand](docs/IMPLEMENTATION.md). Es wurde kein bestehendes Supabase-Projekt verändert und kein Deployment veröffentlicht.

## Quellen für Integrationsentscheidungen

[Next.js SSR und Server Actions](https://nextjs.org/docs/app/guides/authentication), [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase Auth-Templates](https://supabase.com/docs/guides/auth/auth-email-templates), [Resend-Idempotenz](https://resend.com/docs/dashboard/emails/idempotency-keys), [Railway Next.js](https://docs.railway.com/guides/fullstack-nextjs).
