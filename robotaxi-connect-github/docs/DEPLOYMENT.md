# Railway-Deployment

## Web-Service

Für ein **eigenes Robotaxi-Repository** liegen `package.json` und Dockerfiles direkt an der Repository-Wurzel: Root Directory `/`, Web-Konfigurationspfad `/railway.toml`, Worker-Konfigurationspfad `/railway.worker.toml`. Die folgenden `/apps/robotaxi-connect`-Pfade gelten ausschließlich, wenn die Anwendung im bisherigen übergeordneten Repository bleibt. Siehe [Einrichtung mit eigenem Repository](GITHUB-RAILWAY-START.md).

1. Eigenes Railway-Projekt und eigenen Service erstellen. Den bestehenden PAN-Viewer-Service unverändert lassen.
2. Repository verbinden, **Root Directory: `/apps/robotaxi-connect`** setzen. Build-Konfiguration: `railway.toml`, Dockerfile `Dockerfile`. Bei Railway-Konfigurationspfaden, die repository-relativ verlangt werden, `/apps/robotaxi-connect/railway.toml` angeben.
3. Web-Variablen aus `ENVIRONMENT.md` setzen. Keine Supabase Secret-/Service-Role-Keys und keine Resend-Keys im Web-Service.
4. Neue Supabase-Migrationen separat anwenden. Kein automatisches `db push` beim App-Start und kein Seed im Build.
5. Docker baut Next standalone; der Runner verwendet einen unprivilegierten Node-Benutzer. Railway gibt `PORT` vor, der Server bindet `0.0.0.0`.
6. Eigene Domain/TLS einrichten, `ROBOTAXI_APP_URL` und Supabase Site URL/Redirects konsistent aktualisieren.
7. `/api/health` prüft den laufenden Prozess. `/api/ready` liefert erst bei gültiger Robotaxi-Datenbank, URL und freigeschalteter Registrierung 200. Auth- und fachlichen End-to-End-Test zusätzlich ausführen.

Kein persistent beschreibbares App-Dateisystem nötig: Firmendaten liegen in Postgres, Dateien im privaten Supabase Storage.

## E-Mail-Worker

Im selben neuen Railway-Projekt einen zweiten Service aus demselben Root Directory anlegen:

- Dockerfile `Dockerfile.worker`, Konfiguration `railway.worker.toml` (gegebenenfalls repository-relativer Pfad).
- Keine öffentliche Domain, kein HTTP-Healthcheck.
- Eigene Worker-Variablen: Robotaxi Supabase URL/Ref/Publishable-Key/Secret-Key, App URL, Brand-Name, E-Mail-Absender, `ROBOTAXI_EMAIL_PROVIDER=resend`, `RESEND_API_KEY`.
- Start via Docker-CMD `npm run email:worker`, `NODE_ENV=production`.
- Ein Worker genügt. Leasing und `SKIP LOCKED` verhindern konkurrierende Verarbeitung. Beendigung per SIGTERM lässt den laufenden kleinen Batch auslaufen.

Der Worker beansprucht maximal fünf Nachrichten, protokolliert jeden begonnenen Versuch und bestätigt den Ausgang mit dem Lease-Token. Pro Nachricht höchstens acht automatische Versuche, exponentielle Verzögerung bis eine Stunde. Permanente 4xx-Fehler außer 429 werden nicht erneut gesendet. Inhalte von Providerfehlern werden nicht in Logs kopiert.

Resend hält Idempotenzschlüssel 24 Stunden. Bereits begonnene Aufträge, die älter als 23 Stunden sind, werden bei Wiederaufnahme zur manuellen Abstimmung markiert (`DELIVERY_RECONCILIATION_REQUIRED`), damit nach einem langen Ausfall keine doppelte E-Mail unbemerkt versendet wird. Im Anbieter-Dashboard prüfen, ob die Nachricht zugestellt wurde, bevor ein Administrator auf Betriebsebene einen erneuten Auftrag veranlasst.

## Backup, Aufbewahrung und Betrieb

- Supabase-Backups/PITR passend zum gewählten Tarif aktivieren und Restore in einer isolierten Umgebung üben. Storage-Objekte benötigen eine passende separate Backup-/Aufbewahrungsstrategie.
- Monitoring für Health, Readiness, Worker-Neustarts, wartende/fehlgeschlagene E-Mails und Datenbankfehler einrichten.
- Datenbank ist führend: Audit und Outbox werden im selben Commit wie die Geschäftsaktion erstellt. Ein Versandproblem rollt die dokumentierte Vermittlung nicht zurück.
- Archivierung ist keine physische Löschung. Aufbewahrungs- und Löschkonzept muss der Betreiber festlegen; Datenschutzanfragen werden geprüft abgearbeitet. Service-/DB-Owner-Zugriffe sind eine privilegierte Vertrauensgrenze.
- Anwendungsversionen und SQL-Migrationen gemeinsam dokumentieren. Bei Rollback nur abwärtskompatible Anwendungsversionen starten; keine historischen Geschäfts-/Auditdaten löschen.

## Freigabe

Vor öffentlichem Betrieb `PRODUCTION-CHECKLIST.md` vollständig abarbeiten. Der lokale Build und die PostgreSQL-Tests belegen keine reale SMTP-Zustellung, keinen laufenden Railway-Service und keinen gehosteten Storage-End-to-End-Test.
