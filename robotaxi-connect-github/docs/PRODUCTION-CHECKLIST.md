# Produktionsfreigabe

## Infrastruktur und Konfiguration

- [ ] Eigenes Supabase-Projekt Frankfurt/eu-central-1, Project Ref und Datenbank-Identitätsmarker geprüft.
- [ ] Ausschließlich die fünf Robotaxi-Migrationen angewendet; PAN-Viewer unverändert.
- [ ] Eigener Railway-Web-Service und E-Mail-Worker. Keine Demo-Flags/-Seeds in Produktion.
- [ ] Web ohne Service-Role/Resend-Key; Worker-Secrets eingeschränkt und geschützt.
- [ ] Domain, TLS, App URL, Auth Site URL und Redirect-Whitelist konsistent.
- [ ] Supabase Auth E-Mail-Bestätigung und Passwortpolicy aktiv.
- [ ] SMTP, Resend-Domain, Absender und DNS-Einträge verifiziert.
- [ ] Auth-Templates nach finalem Branding neu erzeugt und übernommen.
- [ ] Betreibername, Impressum, Datenschutz, Nutzungsbedingungen und Kontaktadresse final geprüft. Erst danach `ROBOTAXI_LEGAL_READY=true`.
- [ ] Backups, Wiederherstellung, Datenaufbewahrung und Umgang mit Löschanfragen festgelegt.
- [ ] Ein Web-Replikat für V1; vor horizontaler Skalierung gemeinsamer Auth-Limiter und konsistente Server-Action-Schlüssel.

## Abnahmelauf auf neuer Staging-Instanz

- [ ] `npm ci`, `npm run typecheck`, `npm test`, `npm run build` erfolgreich.
- [ ] `npm run test:database` mit lokalem Supabase erfolgreich; separate gehostete Abnahme folgt.
- [ ] DE/EN Desktop/Mobil, Tastaturfokus, Formularlabels, Fehlermeldungen und Sprachwechsel geprüft.
- [ ] Zwei Firmen A/B registrieren, Bestätigungs-E-Mails in beiden Sprachen empfangen und bestätigen.
- [ ] Login vor Bestätigung abgelehnt; Passwort-Reset mit gültigem/abgelaufenem Link prüfen.
- [ ] Firma ausfüllen → PENDING_APPROVAL → Adminfreigabe → E-Mail → Portal.
- [ ] Direkte REST-Abfragen mit Token A gegen Company-ID B, B-Verträge und B-Dokumente liefern keine Daten; Rollenerhöhung und Fremdänderungen scheitern.
- [ ] Bestätigten zusätzlichen Firmenbenutzer korrekt zuordnen; bereits zugeordnete Benutzer nicht umhängen.
- [ ] Anbieter mit Kontakt anlegen; Vermittlungsdialog mit Vorschau, minimaler Datenfreigabe, Provisionsalternative und Kundenschutz durchspielen.
- [ ] Doppelte Vermittlungsübermittlung erzeugt genau einen Datensatz und zwei Outbox-Aufträge.
- [ ] Beide Geschäfts-E-Mails real empfangen; Message-ID und Versuchsliste in Datenbank prüfen.
- [ ] Worker-Neustart/Timeout/429 simulieren; keine unbemerkten Doppelzustellungen; permanente Fehler bleiben nachvollziehbar.
- [ ] Vertrag erstellen, intern lassen, PDF hochladen, anschließend freigeben; Provisionsfelder niemals im Firmenportal/REST sichtbar.
- [ ] Dokument A kann nur durch A/Admin geladen werden; direkte öffentliche Storage-URL scheitert, signierte URL läuft nach 60 Sekunden ab.
- [ ] Versteckte/archivierte Dokumente sowie Dokumente versteckter/archivierter Verträge sind für Kunden nicht abrufbar.
- [ ] Unzulässige Dateien und Dateien über 10 MB werden abgelehnt.
- [ ] Export enthält nur eigene freigegebene Firmendaten, keine internen Konditionen.
- [ ] Deaktivierung sperrt auch bereits ausgestellte Benutzer-JWTs per RLS für Geschäftsdaten.
- [ ] Audit lässt sich über normale UI/API nicht ändern oder löschen.
- [ ] `/api/health` und `/api/ready` liefern im freigegebenen Betrieb 200; Monitoring eingerichtet.

Ergebnis, Datum, geprüfte Version und verantwortliche Person im Betriebsprotokoll festhalten. Die Anwendung behauptet keine Zertifizierung oder pauschale Rechtskonformität.
