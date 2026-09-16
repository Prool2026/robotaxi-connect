// Append new editions. Preserve prior editions as dated historical snapshots.
export type NewsItem = {
  id: string; company: string; region: string; sourceDate: string;
  source: string; sourceLabel: string;
  de: { title: string; status: string; fact: string; europe: string; takeaway: string };
  en: { title: string; status: string; fact: string; europe: string; takeaway: string };
};
export const editions: { date: string; items: NewsItem[] }[] = [{
  date: '2026-09-16',
  items: [
    {
      id: 'wayve-london', company: 'Wayve · Uber · Ford', region: 'UK', sourceDate: '2026-09-03',
      source: 'https://investor.uber.com/news-events/news/press-release-details/2026/Wayve-and-Uber-Launch-First-Ever-Autonomous-Rides-in-the-UK-2026-VoFQI1WbQi/default.aspx', sourceLabel: 'Uber Investor Relations',
      de: { title: 'London: Fahrgäste fahren mit – ein Fahrer bleibt an Bord.', status: 'Betrieb mit Aufsicht', fact: 'Uber und Wayve melden den Start beaufsichtigter Fahrten in London. Eingesetzt wird der Ford Mustang Mach-E mit Wayve-Technologie. In der Anfangsphase begleitet ein ausgebildeter Fahrer die Fahrt.', europe: 'Ein konkreter Schritt im britischen Markt. Die Meldung belegt keinen fahrerlosen Betrieb und keine Zulassung in Deutschland.', takeaway: 'Für Flotten zählt neben dem Fahrzeug, wer die Fahrt beaufsichtigt und welche Betriebskosten tatsächlich entfallen.' },
      en: { title: 'London: passengers can ride, with a driver still on board.', status: 'Supervised operations', fact: 'Uber and Wayve report launching supervised rides in London using Ford Mustang Mach-E vehicles with Wayve technology. A trained driver accompanies trips in the initial phase.', europe: 'A concrete UK milestone. This announcement does not establish driverless operations or approval in Germany.', takeaway: 'Fleet operators need to assess supervision requirements and which operating costs actually change.' },
    },
    {
      id: 'moia-platform', company: 'Volkswagen · MOIA · Mobileye', region: 'EU', sourceDate: '2025-06-23',
      source: 'https://www.moia.io/en/blog/autonomous-ridepooling-id-buzz-ad', sourceLabel: 'MOIA – ID. Buzz AD',
      de: { title: 'ID. Buzz AD: Fahrzeug, Software und Betrieb als Gesamtpaket.', status: 'Herstellerplanung', fact: 'MOIA beschreibt den ID. Buzz AD als Level-4-Fahrzeug mit Mobileye-Technologie, vier Fahrgastplätzen sowie Kamera-, LiDAR- und Radarsensoren. Die verlinkte Produktbeschreibung nennt 2027 als Ziel für autonomes Ridepooling.', europe: 'Hamburg ist ein Teststandort. Der genannte Zeitplan ist eine Anbieterangabe, kein Nachweis eines flächendeckend verfügbaren Dienstes.', takeaway: 'Bei Angeboten auch Betriebsunterstützung, Ladeinfrastruktur und das konkret freigegebene Einsatzgebiet vergleichen.' },
      en: { title: 'ID. Buzz AD: vehicle, software and operations in one package.', status: 'Manufacturer plan', fact: 'MOIA describes a Level 4 vehicle using Mobileye technology, four passenger seats and camera, lidar and radar sensors. The linked product description targets autonomous ridepooling by 2027.', europe: 'Hamburg is a testing location. The timetable is a supplier statement, not proof of widespread service availability.', takeaway: 'Compare operational support, charging infrastructure and the specific approved operating area.' },
    },
    {
      id: 'tesla-supervised', company: 'Tesla', region: 'EU', sourceDate: '2026-04-10',
      source: 'https://www.rdw.nl/en/news/2026/rdw-explanation-of-european-type-approval-tesla-with-provisional-validity-in-the-netherlands', sourceLabel: 'RDW – niederländische Fahrzeugbehörde',
      de: { title: 'FSD Supervised: Fahrerassistenz ist keine Robotaxi-Zulassung.', status: 'Behördliche Einordnung', fact: 'Die RDW erläutert in ihrer Mitteilung vom 10. April die damalige Genehmigung in den Niederlanden: Bei FSD Supervised bleibt der Fahrer verantwortlich und muss die Kontrolle behalten.', europe: 'Die Quelle beschreibt den Genehmigungsstand vom April. Sie belegt weder einen heutigen EU-weiten Freigabestand noch eine fahrerlose Cybercab-Zulassung.', takeaway: 'Cybercab-Ankündigungen und FSD Supervised getrennt bewerten. Für einen Einsatz zählt die konkrete Genehmigung am jeweiligen Standort.' },
      en: { title: 'FSD Supervised: driver assistance is not robotaxi approval.', status: 'Regulator explanation', fact: 'In its April 10 notice, RDW explains the approval granted in the Netherlands at that time: FSD Supervised leaves responsibility and control with the driver.', europe: 'This source describes the April approval status. It establishes neither current EU-wide availability nor approval for driverless Cybercabs.', takeaway: 'Assess Cybercab announcements separately from FSD Supervised. Deployment depends on specific local approval.' },
    },
    {
      id: 'waymo-london', company: 'Waymo', region: 'UK', sourceDate: '',
      source: 'https://waymo.com/waymo-in-uk/', sourceLabel: 'Waymo – London',
      de: { title: 'Waymo bereitet den Londoner Markt vor.', status: 'Anbieterinformation', fact: 'Waymos London-Seite beschreibt den geplanten Dienst und sammelt Interessenten für künftige Fahrten. Die Seite berichtet auch über Tests mit geschulten Spezialisten am Steuer.', europe: 'Großbritannien ist ein europäischer Markt außerhalb der EU. Aus Londoner Aktivitäten lässt sich keine Verfügbarkeit in deutschen Städten ableiten.', takeaway: 'Vor einer Flottenplanung müssen tatsächlicher Betriebsstart, Einsatzgebiet und Partnerschaftsmodell geklärt sein.' },
      en: { title: 'Waymo prepares for the London market.', status: 'Provider information', fact: 'Waymo’s London page describes its planned service and collects interest in future rides. It also reports testing with trained specialists behind the wheel.', europe: 'The UK is a European market outside the EU. London activity does not establish availability in German cities.', takeaway: 'Confirm actual service launch, operating area and partnership arrangements before planning a fleet.' },
    },
  ],
}];
export const videoSuggestions = [
  { id: 'Y2cfkJHB6r4', title: 'Tesla Cybercab: Wie das FSD-Dashboard die Zulassung knacken soll | Drive Talk', channel: 'Fraunhofer IEM',
    de: 'Laut Kanalbeschreibung diskutiert der Beitrag das Fahrzeugkonzept, Energiebedarf, drahtloses Laden und die Abgrenzung von Fahrerassistenz und autonomem Betrieb. Ein Schwerpunkt sind die unterschiedlichen Genehmigungswege in Europa und den USA.',
    en: 'According to the channel description, this discussion covers the vehicle concept, energy use, wireless charging and the distinction between driver assistance and autonomous operation, including European and US approval processes.',
    chapters: [{ seconds: 404, time: '6:44', de: 'Autonomer Betrieb', en: 'Autonomous operation' }, { seconds: 536, time: '8:56', de: 'Europa und USA', en: 'Europe and US' }] },
  { id: 's05BycmfU7E', title: 'Tesla baut das Auto neu — Cybercab Deep Dive', channel: 'Tesla Welt Podcast',
    de: 'Die Kanalbeschreibung stellt Fertigung, Fahrzeugarchitektur, Bremsen und Energieversorgung in den Mittelpunkt. Außerdem wird die US-Selbstzertifizierung diskutiert. Technische Kennzahlen und Wachstumsangaben aus der Beschreibung sind hier noch nicht unabhängig bestätigt.',
    en: 'The channel description focuses on manufacturing, vehicle architecture, braking and power supply, alongside US self-certification. Technical specifications and growth claims in that description have not yet been independently verified here.',
    chapters: [{ seconds: 236, time: '3:56', de: 'Fertigung', en: 'Manufacturing' }, { seconds: 612, time: '10:12', de: 'US-Selbstzertifizierung', en: 'US self-certification' }] },
];
