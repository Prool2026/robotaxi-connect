# Robotaxi Connect: wöchentliche Redaktion

## Umsetzung
- Öffentliche Route: /de/developments und /en/developments.
- Inhalt: src/config/developments.ts. Ausgaben nach Datum absteigend anzeigen; neue Ausgaben ergänzen, historische Ausgaben erhalten. Stabile IDs nicht ändern.
- Datum der letzten Prüfung niemals ohne tatsächliche Recherche erhöhen.
- Recherche wöchentlich montags um 09:00 Europe/Berlin. Die Codex-Aufgabe bereitet Änderungen lokal vor. Veröffentlichung erfolgt mit dem bestehenden GitHub-/Railway-Deployment; kein Hintergrunddienst auf Railway eingerichtet.
- Die Website zeigt ausdrücklich den letzten redaktionellen Stand, keine Zusage einer Echtzeit-Abdeckung.

## Recherche
Hersteller/Anbieter: Tesla/Cybercab, Waymo, Volkswagen/MOIA/Mobileye, Wayve/Uber, Baidu/Apollo Go, WeRide, Pony.ai und relevante europäische Betreiber. Kuratierte Auswahl, kein Vollständigkeitsversprechen.
Primärquellen bevorzugen: Unternehmensmeldungen, Behörden, veröffentlichte Genehmigungen. Veröffentlichungsdatum und Ereignisdatum unterscheiden; UK und EU getrennt betrachten. Fahrassistenz, beaufsichtigte Testfahrten, fahrerlose Tests und kommerziellen Betrieb klar trennen. Anbieterbehauptung nicht als unabhängigen Nachweis darstellen.
Je Beitrag: Unternehmen, Region, Status, belegte Fakten, Quelle und Quelldatum, tatsächliches Prüfdatum, Europa-Einordnung, ausdrücklich eigene Einschätzung für Flotten. Ältere Quellen nicht als aktuellen Genehmigungsstand ausgeben. Änderungen gegenüber Vorwoche benennen. Bei unverändertem Stand nicht künstlich neue Meldungen erzeugen.
Korrekturen transparent als datierte Korrektur am betroffenen Beitrag kenntlich machen.

## Videos
Die zwei eingereichten YouTube-Links sind mit per oEmbed geprüften Titeln/Kanälen aufgenommen. Kanalbeschreibungen und Kapitel aus den öffentlichen YouTube-Seiten wurden gelesen; darauf basierende Themenüberblicke und Zeitmarken sind ausdrücklich als solche gekennzeichnet. Deutsche ASR-Spuren vorhanden, Abruf lieferte leeren Inhalt. Volltext/Audio nicht abgerufen; keinen vollständigen Video-Faktencheck behaupten.
- https://www.youtube.com/watch?v=Y2cfkJHB6r4
- https://www.youtube.com/watch?v=s05BycmfU7E
Nach Zugriff auf Video/Transkript: eigene kurze Zusammenfassung, relevante Zeitmarken nur aus tatsächlich gesichtetem Material, Aussagen mit Primärquellen abgleichen; unbestätigte Aussagen kennzeichnen. Keine vollständigen fremden Transkripte veröffentlichen. Kein Autoplay, keine externen Vorschaubilder oder Player ohne Nutzeraktion; derzeit normale YouTube-Links.

## Veröffentlichung
Nur Änderungen des News-Bereichs übernehmen. Die separaten lokalen Rechtsentwürfe sind noch nicht freigegeben und dürfen nicht versehentlich in den Release kopiert werden. Typecheck sowie Desktop/Mobilansicht und Archivlinks prüfen. Bestehende Betreiber-/Netzwerkzugriffsregeln nicht verändern.

## Ergänzung vom 16.09.2026: Videoauswertung
Der Nutzer hat für Fraunhofer IEM eine Inhaltszusammenfassung und für Tesla Welt ein vollständiges ASR-Transkript bereitgestellt. Redaktionelle DE/EN-Auswertung in src/components/video-analysis.tsx; öffentlich als jeweilige Grundlage gekennzeichnet. Tesla Support (FSD, Cybercab) und NHTSA-Mitteilung vom 25.06.2026 gegengeprüft. Technikdetails ohne Originalbeleg bleiben Videoaussagen. 17,5 % beziehen sich rechnerisch auf kumulierte Meilen, nicht Flottengröße; 500.000 Meilen entsprechen rund 805.000 km. Private Rohtexte nicht in Release/GitHub kopieren. Frühere vorläufige Themenüberblicke werden durch diese datierte Ergänzung ersetzt.

## Wissen & FAQ
Ratgeberdaten: src/config/knowledge.ts. Übersicht und einzelne Artikel unter /de/wissen und /en/wissen. Fünf recherchierte Einstiegsfragen, Stand 16.09.2026. Quellen BMV (27.05.2026), StVG §1f, PBefG §2, Tesla Support und MOIA. Planungsratschläge und Beispielkosten als eigene Einordnung markieren. Beide Sprachfassungen gemeinsam aktualisieren. Bei wesentlichen Änderungen einen datierten DE/EN-Eintrag in history ergänzen; URLs erhalten. reviewed nur nach tatsächlicher Prüfung erhöhen. Sitemap leitet Artikel automatisch ab. Keine Garantie von Google-Ranking oder FAQ-Rich-Results. Search Console ist noch nicht eingerichtet.
