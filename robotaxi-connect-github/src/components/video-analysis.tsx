import { ArrowUpRight, Play } from 'lucide-react';
import type { Locale } from '@/lib/domain';
import { videoSuggestions } from '@/config/developments';

const analysis = {
  de: [
    {
      heading: 'Sicherheit entscheidet über den Weg nach Europa.',
      basis: 'Grundlage: bereitgestellte Inhaltszusammenfassung; kein vollständiges Transkript.',
      summary: 'Der Drive Talk stellt die Frage, wie autonome Mobilität verantwortbar eingeführt werden kann. Im Mittelpunkt stehen belastbare Sicherheitsnachweise, aufmerksame Fahrer bei Assistenzsystemen und verständliche Einweisungen. Die Forderung nach einheitlichen, herstellerneutralen Regeln in Europa ist eine Position der Diskussion – kein bereits erreichter Rechtsstand.',
      points: ['Sicherheitsdaten müssen zusammen mit Einsatzbedingungen und Fahreraufsicht bewertet werden.', 'Die Zusammenfassung kritisiert kurze Einweisungen: Fahrer müssen Verantwortung und Systemgrenzen verstehen.', 'Harmonisierte Regeln sollen grenzüberschreitenden Betrieb erleichtern. Sicherheit hat dabei Vorrang vor Einführungstempo.'],
      check: 'Tesla selbst bezeichnet FSD Supervised als Fahrerassistenz, die aktive Überwachung erfordert und das Fahrzeug nicht autonom macht. Der Produktname ist daher kein Nachweis für fahrerlosen Betrieb. Forderungen nach besseren Einweisungen und einheitlichen Sanktionen sind von geltenden Vorgaben zu unterscheiden.',
      takeaway: 'Vor dem Einsatz klären: Welche Aufgaben bleiben beim Fahrer? Welche Schulung ist nötig? Für welchen Betrieb und welches Gebiet liegt eine Genehmigung vor?',
      sources: [{ label: 'Tesla: FSD Supervised · undatierte Supportseite', url: 'https://www.tesla.com/en_ca/support/fsd' }],
    },
    {
      heading: 'Cybercab: Der Flottenbetrieb prägt das Fahrzeugkonzept.',
      basis: 'Grundlage: bereitgestelltes Transkript mit Zeitmarken.',
      summary: 'Der Tesla Welt Podcast beschreibt das Cybercab als konsequent auf Fahrgäste und Flotteneinsatz ausgerichtetes Fahrzeug. Statt Beschleunigung stehen im Beitrag Wartungsaufwand, Energiebedarf, Ladeplanung und Verfügbarkeit im Vordergrund. Er diskutiert modulare Fertigung („Unboxed“) und neue Komponenten. Die Einschätzung, Tesla wolle durch Selbstzertifizierung eine Regeländerung erzwingen, ist die Interpretation des Moderators.',
      points: ['Fertigung: Der Beitrag beschreibt parallel hergestellte Module, die spät zum Fahrzeug zusammengefügt werden.', 'Betrieb: Laden soll zur Nachfrage passen; wartungsfreundliche Komponenten sollen Standzeiten reduzieren. Das sind vorgestellte Konzepte, keine hier nachgewiesenen Kostenvorteile.', 'Technik: Angaben zu elektrischen Bremsen, 48 Volt, 4680-Zellen, Lebensdauer und Klimatisierung sind im Transkript enthalten, hier aber nicht durch technische Originalunterlagen bestätigt.'],
      check: 'Teslas FAQ bestätigt zwei Sitzplätze und ein Fahrzeug ohne Lenkrad; sie nennt begrenzte Bereiche in Austin für Cybercab-Fahrten. Das belegt keine Deutschland-Verfügbarkeit. Die NHTSA kündigte am 25. Juni 2026 ein Verfahren zur Änderung der Bremspedalvorgaben an; Bremsleistungsanforderungen sollen erhalten bleiben. Diese Mitteilung ist keine individuelle Cybercab-Freigabe.',
      correction: 'Zahlen richtig lesen: Aus 380.000 auf 1.000.000 kumulierte Meilen in sechs Wochen ergeben sich rechnerisch rund 17,5 % pro Woche. Das ist weder ein Nachweis für Flottenwachstum noch für wöchentliche Fahrleistung oder Sicherheit; die Ausgangszahlen sind hier nicht unabhängig bestätigt. 500.000 Meilen entsprechen zudem rund 805.000 km, nicht 750.000 km.',
      takeaway: 'Entscheidend sind belegbare Gesamtkosten je Einsatzkilometer, Wartung, Ladeinfrastruktur und reale Einsatzfreigaben. Ein aerodynamischer Kennwert allein liefert noch keinen Verbrauchsnachweis.',
      sources: [{ label: 'Tesla: Cybercab FAQ · undatierte Herstellerseite', url: 'https://www.tesla.com/support/robotaxi/cybercab' }, { label: 'NHTSA: Bremspedal-Regelverfahren · 25.06.2026', url: 'https://www.nhtsa.gov/press-releases/fmvss-updates-brake-pedal-requirements' }],
    },
  ],
  en: [
    {
      heading: 'Safety shapes the path to Europe.',
      basis: 'Based on a supplied content summary, not a full transcript.',
      summary: 'This Drive Talk discusses responsible deployment of autonomous mobility. The supplied summary focuses on meaningful safety evidence, attentive drivers using assistance systems and clear training. Harmonised, manufacturer-neutral European rules are an argument made in the discussion, rather than an already achieved legal position.',
      points: ['Safety data needs context about operating conditions and driver supervision.', 'The supplied summary criticises brief introductions: drivers need to understand their responsibilities and system limits.', 'Harmonised rules should support cross-border operations, with safety taking priority over rollout speed.'],
      check: 'Tesla describes FSD Supervised as driver assistance requiring active supervision; it does not make the vehicle autonomous. The product name is not evidence of driverless capability. Proposals for better training and uniform sanctions must be distinguished from existing requirements.',
      takeaway: 'Before deployment, establish the driver’s remaining duties, necessary training and the specific operating approval and area.',
      sources: [{ label: 'Tesla: FSD Supervised · undated support page', url: 'https://www.tesla.com/en_ca/support/fsd' }],
    },
    {
      heading: 'Cybercab: designed around fleet operations.',
      basis: 'Based on the supplied timestamped transcript.',
      summary: 'The Tesla Welt Podcast presents Cybercab as a passenger-focused fleet vehicle. It prioritises maintenance, energy use, charging schedules and availability over acceleration. The discussion covers modular “Unboxed” manufacturing and redesigned components. The suggestion that Tesla intends to force regulatory changes through self-certification is the presenter’s interpretation.',
      points: ['Manufacturing: the presenter describes modules built in parallel and assembled late in production.', 'Operations: demand-aware charging and serviceable components are proposed to reduce downtime; cost savings are not demonstrated here.', 'Technical claims about electric brakes, 48 volts, 4680 cells, service life and thermal management appear in the transcript but have not been confirmed here against original technical documentation.'],
      check: 'Tesla’s FAQ confirms two seats and no steering wheel, and lists limited areas of Austin for Cybercab rides. This does not establish availability in Germany. On June 25, 2026, NHTSA announced rulemaking on brake-pedal requirements while retaining braking-performance requirements. That announcement is not an individual Cybercab approval.',
      correction: 'Reading the numbers: growth from 380,000 to 1,000,000 cumulative miles over six weeks equates to about 17.5% weekly. This does not establish fleet growth, weekly mileage or safety; the underlying figures have not been independently confirmed here. Also, 500,000 miles equals roughly 805,000 km, not 750,000 km.',
      takeaway: 'Assess demonstrated total cost per operating kilometre, maintenance, charging infrastructure and actual operating approvals. A drag coefficient alone does not establish energy consumption.',
      sources: [{ label: 'Tesla: Cybercab FAQ · undated manufacturer page', url: 'https://www.tesla.com/support/robotaxi/cybercab' }, { label: 'NHTSA: brake-pedal rulemaking · June 25, 2026', url: 'https://www.nhtsa.gov/press-releases/fmvss-updates-brake-pedal-requirements' }],
    },
  ],
};

export function VideoAnalysis({ locale }: { locale: Locale }) {
  const de = locale === 'de';
  return <section id="videos" className="news-section">
    <p className="eyebrow">VIDEO-FOKUS</p>
    <h2>{de ? 'Cybercab verstehen. Europa mitdenken.' : 'Understanding Cybercab in a European context.'}</h2>
    <p className="news-intro">{de ? 'Zwei Perspektiven auf Sicherheit, Technik und Flottenbetrieb. Wir fassen die bereitgestellten Inhalte zusammen und trennen belegte Angaben von Einschätzungen. Redaktionell ergänzt am 16. September 2026.' : 'Two perspectives on safety, technology and fleet operations. We summarise the supplied material and distinguish sourced facts from interpretation. Updated September 16, 2026.'}</p>
    <div className="news-grid">{videoSuggestions.map((video, index) => {
      const copy = analysis[locale][index];
      return <article className="news-card news-video" id={`video-${video.id}`} key={video.id}>
        <div className="news-video-art"><Play size={40} /><span>CYBERCAB / TESLA</span></div>
        <p className="eyebrow">{video.channel}</p><h3>{copy.heading}</h3><p>{copy.summary}</p>
        <h4>{de ? 'Die Kernaussagen' : 'Key points'}</h4>
        <ul style={{ paddingLeft: 20 }}>{copy.points.map(point => <li key={point} style={{ marginBottom: 12 }}>{point}</li>)}</ul>
        <div className="news-context"><h4>{de ? 'Mit Originalquellen abgeglichen' : 'Checked against original sources'}</h4><p>{copy.check}</p>
          {'correction' in copy && <><h4>{de ? 'Zahlencheck' : 'Checking the numbers'}</h4><p>{copy.correction}</p></>}
          <h4>{de ? 'Für Ihre Flotte · unsere Einschätzung' : 'For your fleet · our assessment'}</h4><p>{copy.takeaway}</p>
        </div>
        <div className="news-source"><strong>{de ? 'Quellen & Lesestand' : 'Sources & review status'}</strong>
          <p className="news-video-note">{copy.basis} {de ? 'Prüfstand: 16.09.2026. Kapitelmarken laut Kanalbeschreibung.' : 'Reviewed September 16, 2026. Chapter markers from the channel description.'}</p>
          {copy.sources.map(source => <p key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a></p>)}
          <div className="news-chapters">{video.chapters.map(chapter => <a key={chapter.seconds} target="_blank" rel="noopener noreferrer" href={`https://www.youtube.com/watch?v=${video.id}&t=${chapter.seconds}s`}>{chapter.time} · {chapter[locale]} ↗</a>)}</div>
          <a className="text-link" target="_blank" rel="noopener noreferrer" href={`https://www.youtube.com/watch?v=${video.id}`}>{video.title} <ArrowUpRight size={16} /></a>
        </div>
      </article>;
    })}</div>
  </section>;
}
