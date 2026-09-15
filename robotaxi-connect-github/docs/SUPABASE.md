# Eigenes Supabase-Projekt

## 1. Neues Projekt

Im eigenen Supabase-Konto ein **neues, leeres Projekt** anlegen, EU-Region Frankfurt / `eu-central-1` auswählen. Projektname und Project Ref vor jedem Datenbankkommando prüfen. Das PAN-Viewer-Projekt nicht öffnen, verknüpfen oder migrieren. Migration 001 bricht bei vorhandenen Anwendungstabellen absichtlich ab.

## 2. Migrationen

Mit der offiziellen Supabase CLI ausschließlich aus `apps/robotaxi-connect`:

```text
supabase login
supabase link --project-ref <NEW_ROBOTAXI_PROJECT_REF>
supabase db push --dry-run
supabase db push
```

Alternativ die fünf SQL-Dateien in `supabase/migrations` in aufsteigender Reihenfolge im SQL Editor des **neuen** Projekts ausführen. Migrationen sind transaktional. Bei Fehlschlag Ursache beheben und die nicht angewendete Migration wiederholen; keine bestehende Tabelle durch `IF NOT EXISTS` übernehmen.

| Migration                | Inhalt                                                                            |
| ------------------------ | --------------------------------------------------------------------------------- |
| 001_core                 | Datenmodell, RLS, Rollen, Auth-Trigger, Audit, Geschäfts-RPCs und privater Bucket |
| 002_email_worker         | Leasing und Protokollierung der Versandversuche                                   |
| 003_dashboard            | Autorisierte, vollständige KPI-Aggregation                                        |
| 004_delivery_safety      | Permanente Versandfehler und Idempotenz-Zeitfenster                               |
| 005_identity_and_members | Datenbank-Identitätsschutz und bestätigte Firmenbenutzer zuordnen                 |

Der Bucket `company-files` ist privat, maximal 10 MB pro Datei. Niemals auf öffentlich umstellen. Keine zusätzlichen permissiven Policies auf Geschäfts- oder Storage-Tabellen hinzufügen.

## 3. Auth konfigurieren

- E-Mail-Bestätigung aktivieren, minimale Passwortlänge 12, öffentliche Anmeldung für Firmenbenutzer.
- Site URL exakt auf `ROBOTAXI_APP_URL` setzen.
- Redirects für `/de/auth/callback` und `/en/auth/callback` sowie die jeweiligen Reset-Varianten mit `?next=reset-password` erlauben. In Produktion keine Wildcard auf fremde Domains.
- Eigenes SMTP mit verifiziertem Absender konfigurieren; Supabase-Standardversand ist für Entwicklung gedacht.
- `npm run auth:templates` erzeugt DE/EN-Templates aus der zentralen Marke. Inhalt von `supabase/templates/confirmation.html` als Confirm-signup-Vorlage und `recovery.html` als Reset-password-Vorlage übernehmen. Die Sprache stammt aus der bei Registrierung gesetzten Benutzersprache.
- Supabase-Auth-Schutzmaßnahmen und projektweite Rate Limits aktivieren. Die App hat zusätzlich eine lokale Auth-Bremse und persistente SQL-Limits für Geschäftsaktionen. Vor mehreren Web-Replikaten ist ein gemeinsamer Gateway-/Redis-Limiter für öffentliche Auth-Aktionen erforderlich.

Die Vorlagen verwenden Token-Hashes und die kanonische Site URL; Bestätigung funktioniert damit auch in einem anderen Browser. Auth-Mailversand wird von **Supabase Auth/SMTP** ausgeführt und dort protokolliert. Geschäfts-E-Mails werden in `email_logs` und `email_attempts` protokolliert. Auth-Tokens werden bewusst nicht in für Admins lesbare Geschäfts-E-Mail-Logs kopiert.

## 4. Ersten Administrator einrichten

Über die Registrierung ein eigenes Benutzerkonto erstellen und E-Mail bestätigen. Den Account noch keinem Unternehmen zuordnen. Im SQL Editor des neuen Projekts die konkrete, geprüfte Adresse verwenden:

```sql
update public.profiles p
set role = 'ADMIN'
from auth.users u
where p.id = u.id
  and u.email = '<YOUR_VERIFIED_ADMIN_EMAIL>'
  and u.email_confirmed_at is not null;
```

Nur DB-Owner/vertrauenswürdiger Betrieb vergeben Rollen. User-Metadaten können keine Adminrechte verleihen. Weitere interne Mitarbeiter können auf demselben Weg `ADMIN_EMPLOYEE` erhalten. Diese Rolle hat in V1 dieselben operativen Rechte wie ADMIN; eine feinere Rechteaufteilung ist eine spätere Erweiterung. `PROVIDER_USER` ist angelegt, erhält jedoch noch keinen Firmenzugriff.

## 5. Manuellen Lead mit Account verbinden

Admin legt Firma und Ansprechpartner an. Der gewünschte Firmenbenutzer registriert einen Account und bestätigt die E-Mail-Adresse. Bevor er ein neues Unternehmen registriert, ordnet der Admin ihn in der bestehenden Firma unter „Firmenbenutzer hinzufügen“ über seine bestätigte E-Mail zu. Mehrere Benutzer pro Firma sind möglich; ein Benutzer gehört in V1 genau einer Firma an. Bereits zugeordnete Benutzer werden nicht stillschweigend umgehängt.

## Lokale Entwicklung

Docker + Supabase CLI erforderlich. `supabase start` in diesem Verzeichnis verwendet eigene Ports 55320–55324 und deaktiviert automatisches Seeding. Die von der lokalen CLI bereitgestellten Keys in **dieser** `.env.local` hinterlegen; URL `http://127.0.0.1:55321`, Ref `local`.

Optional `ROBOTAXI_ALLOW_DEMO_SEED=true` und `ROBOTAXI_DEMO_PASSWORD` setzen, dann `npm run seed:demo`. Der Seed lehnt Remote-URLs und Produktion ab. Er erzeugt ausschließlich eigene lokale Demo-Accounts, eine Firma und einen Demo-Anbieter. Keine produktiven Firmen-/Vertragsdaten durch Reset oder Seed überschreiben.
