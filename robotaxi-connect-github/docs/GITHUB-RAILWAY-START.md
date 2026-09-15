# Erste Veröffentlichung: GitHub, Railway und Supabase

## Was gehört wohin?

| Dienst                 | Aufgabe                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| GitHub                 | Privates Repository mit dem Robotaxi-Quellcode und dessen Versionen |
| Railway · Web          | Website, Adminbereich und Firmenportal ausführen                    |
| Railway · Worker       | Geschäfts-E-Mails aus der Versandwarteschlange verschicken          |
| Neues Supabase-Projekt | Datenbank, Anmeldung und privater Dateispeicher                     |
| Versanddienst          | SMTP für Supabase-Auth; Resend-API für Geschäfts-E-Mails            |

Diese Anleitung verwendet ein **eigenes Repository `robotaxi-connect`**. `package.json`, `Dockerfile`, `railway.toml` und die Ordner `src`, `public`, `supabase` liegen dort direkt auf der obersten Ebene. Deshalb lautet das Railway Root Directory hier `/`.

## 1. Eigenes privates GitHub-Repository

Am einfachsten mit GitHub Desktop:

1. Anmelden und **File → New repository** wählen.
2. Name `robotaxi-connect`, Local path zum Beispiel `D:\Projekte`. Den neuen Ordner außerhalb des bestehenden PAN-Viewer-Projekts anlegen. Zusätzliche README-, Ignore- und Lizenzvorlagen sind nicht erforderlich; die Projektdateien enthalten bereits README und `.gitignore`.
3. Das bereitgestellte Paket `robotaxi-connect-github.zip` entpacken und seinen **Inhalt** in `D:\Projekte\robotaxi-connect` kopieren. `package.json` muss direkt in diesem Ordner liegen, nicht in einem weiteren Unterordner. Eine ZIP-Datei allein ist kein deploybares Repository.
4. In GitHub Desktop die Änderungen ansehen, Summary `Initial Robotaxi Connect V1`, dann **Commit to main**.
5. **Publish repository**, **Keep this code private** aktiviert lassen und veröffentlichen.

Das Paket enthält ausschließlich Robotaxi-Quelldateien, Migrationen, Tests und Konfiguration. Es enthält keine PAN-Dateien, Git-Historie, installierten Abhängigkeiten, Build-Ausgaben oder ausgefüllten Umgebungsdateien. Die leere `.env.example` gehört zum Quellcode; tatsächliche Schlüssel kommen später in Railway Variables.

Für diese erste Bereitstellung sind weder GitHub Pages noch GitHub Actions oder GitHub Secrets nötig. Railway baut direkt aus dem verbundenen Repository. Spätere Änderungen werden im neuen lokalen Repository committed und gepusht.

Offizielle Anleitung: [Repository mit GitHub Desktop erstellen](https://docs.github.com/en/desktop/overview/creating-your-first-repository-using-github-desktop).

## 2. Das bereits angelegte Supabase-Projekt vorbereiten

1. Im **neuen Robotaxi-Projekt** den SQL Editor öffnen.
2. Die fünf Dateien aus `supabase/migrations` vollständig in aufsteigender Reihenfolge ausführen: `202609150001_core.sql`, `202609150002_email_worker.sql`, `202609150003_dashboard.sql`, `202609150004_delivery_safety.sql`, `202609150005_identity_and_members.sql`. Erst nach erfolgreicher Ausführung mit der nächsten Datei fortfahren. Keine PAN-Migration verwenden.
3. Abschließend ausführen:

   ```sql
   select public.robotaxi_identity();
   ```

   Erwartete Antwort: `robotaxi-connect/v1`.

4. Unter **Connect** die Projekt-URL und den Publishable-Key abrufen. Unter **Settings → API Keys** sind auch Secret-Keys verfügbar. Der Project Ref ist die Zeichenfolge vor `.supabase.co` in der Projekt-URL. Der Secret-Key wird ausschließlich für den späteren Worker benötigt.

Die Migrationen richten die Tabellen, Zugriffsrechte und den privaten Bucket ein. Auf Railway ist keine zusätzliche PostgreSQL-Datenbank und kein Dateispeicher-Volume nötig.

Mehr Details und CLI-Alternative: [SUPABASE.md](SUPABASE.md). Schlüsseltypen: [Supabase API Keys](https://supabase.com/docs/guides/getting-started/api-keys).

## 3. Railway-Projekt und Web-Service

1. In Railway ein **neues Projekt** anlegen. Einen leeren Service namens `robotaxi-web` hinzufügen.
2. Unter **Settings** Root Directory `/` verwenden und als Railway Config File `/railway.toml` setzen. Build und Start werden durch die enthaltenen Docker-Dateien festgelegt; eigene Build- oder Start-Commands leer lassen.
3. Das private GitHub-Repository `robotaxi-connect`, Branch `main`, als Source verbinden. Falls es fehlt, der Railway-GitHub-App Zugriff auf dieses neue Repository geben.
4. Unter **Variables → RAW Editor** den folgenden Block einfügen und die Platzhalter ersetzen:

   ```dotenv
   ROBOTAXI_SUPABASE_URL=https://DEIN_PROJECT_REF.supabase.co
   ROBOTAXI_SUPABASE_PROJECT_REF=DEIN_PROJECT_REF
   ROBOTAXI_SUPABASE_PUBLISHABLE_KEY=DEIN_PUBLISHABLE_KEY
   ROBOTAXI_BRAND_NAME=Robotaxi Connect
   ROBOTAXI_LOGO=/robotaxi-logo.png
   ROBOTAXI_LEGAL_NAME=DEIN_JURISTISCHER_BETREIBER
   ROBOTAXI_SUPPORT_EMAIL=DEINE_KONTAKTADRESSE
   ROBOTAXI_LEGAL_READY=false
   ROBOTAXI_DEMO=false
   ```

5. Die Änderungen deployen. Ein erster Build kann bereits bei Repository-Verbindung starten. Unter **Settings → Networking → Public Networking → Generate Domain** eine öffentliche Adresse erzeugen; falls ein Zielport abgefragt wird, `3000` verwenden. Docker startet auf Port 3000, sofern Railway keinen anderen `PORT` vorgibt; dann dessen tatsächlichen Listen-Port verwenden.
6. Die erzeugte Adresse kopieren und unter Variables zusätzlich setzen:

   ```dotenv
   ROBOTAXI_APP_URL=https://DEINE-RAILWAY-DOMAIN
   ROBOTAXI_BRAND_DOMAIN=DEINE-RAILWAY-DOMAIN
   ```

   `ROBOTAXI_APP_URL` enthält `https://`, aber kein `/de` und keinen abschließenden Pfad. Danach die Variablenänderungen deployen. Bei späterer eigener Domain diese Werte und die Supabase-URLs gemeinsam aktualisieren.

Die Website kann jetzt sichtbar sein. Die Registrierung bleibt durch `ROBOTAXI_LEGAL_READY=false` bis zur Freigabe gesperrt. `/api/health` muss 200 liefern; `/api/ready` liefert vor vollständiger Konfiguration/Freigabe absichtlich 503.

Offizielle Quellen: [Railway Variables](https://docs.railway.com/variables), [Dockerfiles](https://docs.railway.com/builds/dockerfiles), [öffentliche Domain](https://docs.railway.com/networking/public-networking).

## 4. Supabase-Auth und Rechtstexte fertigstellen

1. **Authentication → URL Configuration:** Site URL auf den exakten Wert von `ROBOTAXI_APP_URL` setzen. Folgende Redirect URLs für dieselbe Domain eintragen:

   ```text
   https://DEINE-RAILWAY-DOMAIN/de/auth/callback
   https://DEINE-RAILWAY-DOMAIN/en/auth/callback
   https://DEINE-RAILWAY-DOMAIN/de/auth/callback?next=reset-password
   https://DEINE-RAILWAY-DOMAIN/en/auth/callback?next=reset-password
   ```

2. E-Mail-Bestätigung aktivieren und Mindestpasswortlänge 12 einstellen.
3. **Authentication → Emails:** eigenes SMTP mit verifiziertem Absender einrichten. Der Standardversand ist für Entwicklung beschränkt. Für echte Firmenanmeldungen ist die eigene Versandkonfiguration erforderlich.
4. Den vollständigen HTML-Inhalt aus `supabase/templates/confirmation.html` als Bestätigungs-Vorlage und `recovery.html` als Passwort-Reset-Vorlage übernehmen. Bei Namensänderung zuerst die Templates mit `npm run auth:templates` neu erzeugen.
5. Betreiberangaben einsetzen und die noch vorhandenen rechtlichen Platzhalter unter `src/app/[locale]/legal/[page]/page.tsx` vervollständigen und freigeben. Nur das Setzen des Betreiber-Namens ersetzt die Rechtstexte nicht.
6. Erst danach im Railway-Web-Service `ROBOTAXI_LEGAL_READY=true` setzen und deployen.

Quelle: [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## 5. Railway-E-Mail-Worker

Im selben neuen Railway-Projekt einen zweiten **leeren** Service `robotaxi-mailer` anlegen. Vor dem ersten Worker-Deployment konfigurieren:

| Einstellung                           | Wert                                                    |
| ------------------------------------- | ------------------------------------------------------- |
| Source                                | Dasselbe private Repository, Branch `main`              |
| Root Directory                        | `/`                                                     |
| Railway Config File                   | `/railway.worker.toml`                                  |
| Dockerfile                            | `Dockerfile.worker` (durch diese Konfiguration gesetzt) |
| Eigene Build-/Start-Commands          | Leer lassen                                             |
| Öffentliche Domain / HTTP-Healthcheck | Keinen einrichten                                       |

Der andere Konfigurationspfad ist wichtig: `/railway.toml` würde den Web-Service bauen.

Unter Worker-Variables eintragen:

```dotenv
ROBOTAXI_SUPABASE_URL=https://DEIN_PROJECT_REF.supabase.co
ROBOTAXI_SUPABASE_PROJECT_REF=DEIN_PROJECT_REF
ROBOTAXI_SUPABASE_PUBLISHABLE_KEY=DEIN_PUBLISHABLE_KEY
ROBOTAXI_SUPABASE_SECRET_KEY=DEIN_SUPABASE_SECRET_KEY
ROBOTAXI_APP_URL=https://DEINE-RAILWAY-DOMAIN
ROBOTAXI_BRAND_NAME=Robotaxi Connect
ROBOTAXI_EMAIL_PROVIDER=resend
ROBOTAXI_EMAIL_FROM=Robotaxi Connect <VERIFIZIERTER_ABSENDER>
RESEND_API_KEY=DEIN_RESEND_KEY
```

Den Absender vorher in Resend verifizieren. Supabase-Auth-Mails laufen über das dort konfigurierte SMTP; Vermittlungs- und andere Geschäfts-E-Mails über diesen Worker. Den Worker deployen, sobald die Versandwerte vorliegen. Keine Secret-/Resend-Keys in den Web-Service oder ins Repository übernehmen.

## 6. Administrator und erster Abnahmelauf

Eigenen Account auf der Website registrieren und E-Mail bestätigen. Noch keine Firma für diesen Admin anlegen. Im neuen Supabase-SQL-Editor mit der eigenen bestätigten Adresse ausführen:

```sql
update public.profiles p
set role = 'ADMIN'
from auth.users u
where p.id = u.id
  and u.email = 'DEINE_BESTAETIGTE_ADMIN_ADRESSE'
  and u.email_confirmed_at is not null;
```

Danach neu anmelden und `/de/admin` öffnen. Firmenregistrierung, Freigabe, Vermittlung, E-Mail-Zustellung und privaten Datei-Download mit eigenen Staging-Testkonten prüfen. Erst nach diesem Abnahmelauf für echte Firmen öffnen: [PRODUCTION-CHECKLIST.md](PRODUCTION-CHECKLIST.md).

## Falls das bisherige übergeordnete Repository verwendet wird

Nur dann gelten Root Directory `/apps/robotaxi-connect`, Web Config `/apps/robotaxi-connect/railway.toml` und Worker Config `/apps/robotaxi-connect/railway.worker.toml`. Bei einem separaten Repository aus dem bereitgestellten Paket wären diese Pfade falsch. Konfigurationspfade sind immer relativ zur Repository-Wurzel, auch wenn eine andere Root Directory eingestellt ist: [Railway Monorepos](https://docs.railway.com/deployments/monorepo).
