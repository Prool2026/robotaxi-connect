# Kontoverwaltung und Anbieterprofile

## Reihenfolge für die Veröffentlichung

1. Im Robotaxi-Supabase-Projekt `vflyvceihfyxbwoaktpk` die Migration `supabase/migrations/202609170006_accounts.sql` ausführen. Sie legt Funktionen und die Tabelle für Anbieterprofile an; bestehende Nutzer werden dabei nicht gelöscht.
2. Supabase Edge Function `delete-account` aus `supabase/functions/delete-account/index.ts` veröffentlichen. JWT-Prüfung aktiviert lassen. SUPABASE_URL, SUPABASE_ANON_KEY und SUPABASE_SERVICE_ROLE_KEY stellt Supabase automatisch bereit; keine Schlüssel in GitHub oder im Browser hinterlegen.
3. Erst danach Webänderungen über GitHub/Railway veröffentlichen.
4. Ohne Anmeldung müssen `/de/konto`, `/de/anbieter` und `/de/admin/provider-accounts` zur Anmeldung führen. Anbieterregistrierung: `/de/register?type=technology`.

## Verhalten

- Taxi-/Flottenunternehmen: Konto, Passwort, Login-E-Mail, Namen und Firmenkontakte bearbeiten. Die Firmen-Kontakt-E-Mail ist getrennt von der Login-E-Mail.
- Anbieter: eigenes Profil, Kontoeinstellungen, persönliches Bearbeitungsverfahren. Kein Zugang zu Firmen anderer Nutzer oder internen Anbieterdaten. Adminansicht unter Anbieterregistrierungen.
- Abmelden beendet eine Sitzung. Löschen erfordert aktuelles Passwort, DELETE und ausdrückliche Bestätigung. Das Auth-Konto und persönliche Profil werden gelöscht. Bei der letzten Firmenmitgliedschaft werden auch die Firmendaten und Dateien entfernt. Gemeinsame Firmendaten bleiben für andere Mitglieder erhalten.
- Die Löschung authentifiziert den aufrufenden Benutzer. Es gibt keinen vom Formular bestimmbaren Zielbenutzer. SQL verlangt eine verifizierte E-Mail und eine höchstens zehn Minuten alte Passwortanmeldung. Administratorkonten sind ausgeschlossen.
- Storage-Dateien werden über die Storage API entfernt; kein direktes SQL-Löschen von Storage-Metadaten im Produktivbetrieb. Nutzer erhalten durch die Löschfunktion keine zusätzlichen Leserechte auf interne Dateien.
- Ein vorbereiteter Löschvorgang blockiert neue Daten/Dateien der betroffenen allein verwalteten Firma. Bei Fehlern kann derselbe Nutzer die Löschung wiederholen. Erfolg wird erst nach Abschluss gemeldet.
- Private Anbieter-/Nutzerunterlagen in externen E-Mail-Postfächern und Dienstleister-Backups werden nicht durch die Kontofunktion entfernt. Geschäftlich erforderliche Unterlagen separat und zweckgebunden aufbewahren.

## Prüfungen

`npm test`, `npm run build`, `node scripts/check-accounts.mjs` (Entwicklungsvorschau mit ROBOTAXI_DEMO=true).
Tests verwenden isolierte PostgreSQL-Daten und prüfen Rollen, Mandantentrennung, frische Authentifizierung, Storage-Fehler, vollständige Kontolöschung sowie Mehrbenutzerfirmen. Keine echten Nutzerkonten für Löschtests verwenden.
