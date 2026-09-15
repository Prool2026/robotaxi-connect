# Umsetzungs- und Prüfstand · 15.09.2026

## Isolation

Alle Änderungen liegen ausschließlich in `apps/robotaxi-connect`. `git diff HEAD` für die zuvor vorhandenen, versionierten PAN-Dateien ist leer. Keine PAN-Umgebungsdatei wurde gelesen oder übernommen; keine externe Supabase-Datenbank wurde kontaktiert oder verändert. Es wurde kein Deployment veröffentlicht und kein Commit erzeugt.

## Phasen

| Phase                      | Umsetzung                                                                                                                                  | Wesentliche Dateien / Migrationen                                                                           | Nächster betrieblicher Schritt                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1 · Architektur            | Repository- und Betriebsgrenzen analysiert, eigenständiges Paket, Brand und Datenmodell                                                    | `docs/ARCHITECTURE.md`, `package.json`, `src/config`, Migration 001                                         | Neues Supabase-Projekt anlegen                                   |
| 2 · Auth/RLS               | SSR-Auth, bestätigte E-Mail, Rollen, Firmenmitgliedschaften, SQL-RLS, Datenbank-Identitätsmarker                                           | `src/lib/auth.ts`, `src/lib/supabase`, `src/proxy.ts`, Migrationen 001/005                                  | Neue URL, Publishable-Key und Project Ref konfigurieren          |
| 3 · Landing/i18n           | Responsive Landingpage, eigene Vektorgrafik, DE/EN, zentrale Texte, rechtliche Platzhalter                                                 | `src/app/[locale]/page.tsx`, `src/i18n/messages.ts`, `src/app/globals.css`, `public/logo.svg`               | Finalen Brand und Rechtstexte einsetzen                          |
| 4 · Firmenportal           | Account/Verifizierung/Firmenprofil, Freigabezustand, Flotte, veröffentlichte Vermittlungen, Verträge, Dokumente, Account                   | `src/app/actions`, `src/components/portal-screen.tsx`, `src/components/company-form.tsx`                    | Reale Staging-Registrierung und Auth-Mail prüfen                 |
| 5 · Administration         | KPIs, paginierte Listen, Firmen/Kontakte/Anbieter, Status, Notizen, mehrere bestätigte Firmenbenutzer                                      | `src/components/admin-screen.tsx`, `src/components/admin-forms.tsx`, `src/lib/data.ts`, Migrationen 003/005 | Eigenen ersten Admin nach E-Mail-Bestätigung zuweisen            |
| 6 · Vermittlung/E-Mail     | Dialog, vollständige Vorschau, ausgewählte Daten, idempotente atomare Vermittlung, DE/EN-Outbox und austauschbarer Versandtransport        | `src/components/referral-form.tsx`, `src/lib/email`, `scripts/email-worker.ts`, Migrationen 001/002/004     | Worker, verifizierten Absender, Resend und Auth-SMTP einrichten  |
| 7 · Verträge/Storage       | Verträge und interne Konditionen getrennt, private Uploads, Typ-/Signatur-/Größenprüfung, Sichtbarkeit/Archivierung, kurzlebige Downloads  | `src/app/api/documents`, `src/lib/validation.ts`, Migration 001                                             | Gehosteten Upload/Download mit zwei echten Staging-Firmen prüfen |
| 8 · Audit/Sicherheit/Tests | Unveränderliche Audit-Einträge, SQL-Mandantentests, Transaktions-/Rollen-/Worker-Tests, CSP, Export, Deaktivierung, Deploymentvorbereitung | `tests`, `src/app/api`, `Dockerfile*`, `railway*.toml`, `docs`                                              | Produktionscheckliste und externe Abnahme durchführen            |

## Verifikation

- **23 lokale Tests bestanden:** tatsächliche fünf SQL-Migrationen in einem PostgreSQL-Testmotor, Rollen-/Mandantentrennung, nicht bestätigte Accounts, geschützte Firmenzuordnung, Zustimmung, Freigabe, Referral-Idempotenz/Rollback, interne Provisionen, Vertrags-/Dokument-/Storage-Policies, Audit, Worker-Leases und Wiederaufnahmegrenzen, sofortige Deaktivierung sowie Validierung, Übersetzungen und E-Mail-Templates.
- **5 HTTP-Tests bestanden:** separat gestartetes Next-Standalone-Produktionsartefakt; DE/EN-HTML, CSP/Schutzheader, anonyme Admin-/Portalzugriffe, geschützte Downloads/Export, deaktivierte Produktionsdemo selbst bei gesetztem Demo-Flag, ungültige Sprache sowie Health/Readiness.
- **Produktionsbuild und TypeScript erfolgreich.** Der anfängliche Build scheiterte an Windows-Sandbox-Schreibrechten; nach genehmigtem lokalen Build und korrigierten Testtypen wurden die Phasen 1–5 gemeinsam erfolgreich geprüft. Spätere Phasen wurden mit erweiterten Tests und abschließendem Build geprüft.
- **Browserprüfung durchgeführt:** deutsche/englische Landingpage, Sprachwechsel inklusive HTML-Sprache, ungekreuzte Registrierungseinwilligung und gesperrte Registrierung ohne Backend, Desktop-/Mobilansichten bei 390 px, Admin-KPIs/Firmendetails, Firmenportal ohne Provisionen, Vermittlungsdialog mit Pflicht-Datenauswahl und vollständiger Vorschau. Ein gefundener mobiler Kontaktbereich-Überlauf wurde behoben und in DE/EN nachgeprüft. Keine Browser-JavaScript-Fehler bei den geprüften Ansichten.
- **Client-Bundle geprüft:** keine Referenzen auf Worker-Service-Key oder Resend-Key in den ausgelieferten Browser-Chunks gefunden.

Die separate Playwright-Regressionssuite ist vorbereitet; die tatsächliche visuelle Abnahme wurde über den integrierten Browser ausgeführt. Reale Supabase-Auth-/REST-Integration ist als lokaler Integrationstest vorbereitet, aber hier mangels Supabase-Instanz/Docker und Zugangsdaten nicht ausgeführt. Reale SMTP-/Resend-Zustellung, gehosteter Storage und Railway-Docker-Deployment sind noch nicht extern verifiziert.

## Fehlende externe Werte

Neues Supabase-Projekt samt URL, Project Ref und Publishable-Key; Worker-Secret; App-Domain; juristischer Betreiber; Kontaktadresse; Versandprovider-/Absender-/SMTP-Konfiguration; freigegebene Rechtstexte. Vollständige Variablenliste: `docs/ENVIRONMENT.md` und `.env.example`.

## Betriebsgrenzen der V1

Ein Web-Replikat mit Supabase-Auth-Rate-Limits und zusätzlicher lokaler Auth-Bremse. Mehrere Admins sind vorbereitet; Mitarbeiter haben zunächst dieselben operativen Rechte. Anbieterportal/PROVIDER_USER ist noch nicht freigeschaltet. Auth-E-Mail-Versuche liegen in Supabase-/SMTP-Logs, Geschäfts-E-Mail-Versuche in der eigenen Outbox. Audits und archivierte Geschäftsdaten bleiben erhalten; physische Löschung und privilegierte Reaktivierung erfolgen nur nach geprüftem Betriebsprozess.

Die V1 ist lokal ausführbar und für die externe Einrichtung vorbereitet. Sie ist ohne diese Einrichtung und Staging-Abnahme **nicht öffentlich betriebsbereit**.

## Nachtrag: Betreiberlogo und erste Veröffentlichung

Das bereitgestellte `Robotaxi_Logo.png` ist unverändert unter `public/robotaxi-logo.png` eingebunden, einschließlich Browser-Symbol. Der SHA-256-Abgleich bestätigt die identische Originaldatei. Die lokale Website und Logo-Datei antworten mit HTTP 200; HTML referenziert das neue Logo und Browser-Symbol. TypeScript und der erneute Produktionsbuild sind erfolgreich.

Der Betreiber hat ein neues Supabase-Projekt angelegt; dessen Zugangsdaten wurden noch nicht verbunden. `docs/GITHUB-RAILWAY-START.md` beschreibt die Veröffentlichung über ein eigenes privates GitHub-Repository und zwei Railway-Dienste. Ein separates Repository verwendet Root Directory `/`; der bisherige Unterordnerpfad gilt nur für das ursprüngliche übergeordnete Repository. Das Quellcode-Paket unter `release/` ist von Git und Docker ausgeschlossen und enthält keine ausgefüllten Umgebungsdateien oder PAN-Dateien. GitHub-Publish, Supabase-Migrationen und Railway-Deployment wurden nicht ausgeführt.
