# Environment

Alle Variablen gelten ausschließlich für Robotaxi. `.env.local` liegt in diesem Paket. Keine PAN-Datei kopieren, keine `PUBLIC_SUPABASE_*`-Fallbacks, kein `NEXT_PUBLIC_` für Secrets. Selbst der Publishable-Key wird hier nur serverseitig verwendet. Die Datenbank muss zusätzlich den durch Migration 005 angelegten Robotaxi-Identitätsmarker liefern.

| Variable                             | Benötigt von                       | Bedeutung                                                                                                                       |
| ------------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `ROBOTAXI_SUPABASE_URL`              | Web, Worker, lokale Tests          | URL des **neuen** Supabase-Projekts                                                                                             |
| `ROBOTAXI_SUPABASE_PUBLISHABLE_KEY`  | Web, Worker, lokale Tests          | Publishable-Key / lokaler anon-Key dieses Projekts                                                                              |
| `ROBOTAXI_SUPABASE_PROJECT_REF`      | Web, Worker, lokale Tests          | Muss zur URL passen; lokal `local`                                                                                              |
| `ROBOTAXI_SUPABASE_SECRET_KEY`       | **nur Worker**, lokale Seeds/Tests | Supabase Secret-Key / service_role; niemals in den Web-Service oder Browser geben                                               |
| `ROBOTAXI_APP_URL`                   | Web, Worker                        | Kanonische Origin ohne Pfad, in Produktion HTTPS                                                                                |
| `ROBOTAXI_BRAND_NAME`                | Web, Worker, Templates             | Arbeitswert Robotaxi Connect                                                                                                    |
| `ROBOTAXI_LEGAL_NAME`                | Web                                | Juristischer Betreibername                                                                                                      |
| `ROBOTAXI_BRAND_DOMAIN`              | Web                                | Öffentliche Domain                                                                                                              |
| `ROBOTAXI_SUPPORT_EMAIL`             | Web                                | Öffentliche Kontaktadresse; leer erzeugt keinen erfundenen Kontakt                                                              |
| `ROBOTAXI_LOGO`                      | Web                                | Lokaler Pfad innerhalb `public`, Standard `/robotaxi-logo.png`                                                                  |
| `ROBOTAXI_EMAIL_FROM`                | Worker                             | Verifizierter Absender, z. B. Betreibername und eigene Domain                                                                   |
| `ROBOTAXI_EMAIL_PROVIDER`            | Worker                             | `resend`; weitere Transportklassen implementieren `EmailTransport`                                                              |
| `RESEND_API_KEY`                     | **nur Worker**                     | API-Key für verifizierten Versand                                                                                               |
| `ROBOTAXI_LEGAL_READY`               | Web                                | `true` erst nach Ersetzung und Freigabe der Rechtstexte; sperrt sonst Produktionsregistrierung                                  |
| `ROBOTAXI_DEMO`                      | lokale Entwicklung                 | `true` schaltet schreibgeschützte Demo frei; in Produktion ignoriert                                                            |
| `ROBOTAXI_ALLOW_DEMO_SEED`           | lokale Entwicklung                 | Explizite Freigabe des lokalen Seeds; niemals produktiv setzen                                                                  |
| `ROBOTAXI_DEMO_PASSWORD`             | lokaler Seed                       | Selbst gewähltes lokales Testpasswort, mindestens 12 Zeichen; wird nicht ausgegeben                                             |
| `ROBOTAXI_TEST_DATABASE`             | lokale Integration                 | `true` nur für wegwerfbares lokales Supabase                                                                                    |
| `ROBOTAXI_BROWSER_URL`               | Browserregression                  | Optional bereits laufende lokale Demo; Standard `http://127.0.0.1:3100`                                                         |
| `NODE_ENV`                           | Web, Worker                        | Railway `production`; Next setzt es beim Build/Start                                                                            |
| `PORT`                               | Railway Web                        | Railway setzt den Listen-Port automatisch                                                                                       |
| `HOSTNAME`                           | Railway Web                        | Docker setzt `0.0.0.0`                                                                                                          |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Web Build                          | Optional für spätere mehrere Instanzen; stabiler Next-kompatibler Schlüssel, bei gemeinsamem Build für alle Instanzen identisch |

Auth-SMTP wird in Supabase konfiguriert, nicht als Passwort in der Web-Anwendung. SPF/DKIM/DMARC und Auth-Redirects gehören zum neuen Absender/Projekt.

## Aktueller Stand

Es wurden keine echten Zugangsdaten bereitgestellt, gelesen oder übernommen. Sämtliche produktiven Supabase-, Domain-, Betreiber- und Versandwerte fehlen. Ein Build ist absichtlich ohne Secrets möglich.
