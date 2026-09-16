import Image from 'next/image';

export function Imprint({ locale }: { locale: 'de' | 'en' }) {
  const en = locale === 'en';
  return (
    <main id="main" className="container imprint-page">
      <header className="imprint-heading">
        <p className="eyebrow">Robotaxi Connect · {en ? 'People & responsibility' : 'Person & Verantwortung'}</p>
        <h1>{en ? 'Legal notice' : 'Impressum'}</h1>
        <p>{en ? 'A personal introduction. A direct point of contact.' : 'Persönlich vorgestellt. Direkt erreichbar.'}</p>
      </header>
      <section className="founder-card" aria-labelledby="founder-name">
        <div className="founder-portrait">
          <div className="founder-photo-frame">
          <Image src="/sebastian-neumeier.png" alt="Sebastian Neumeier" width={1328} height={1328} sizes="(max-width: 760px) 90vw, 440px" />
          </div>
          <span>Robotaxi Connect</span>
        </div>
        <div className="founder-intro">
          <p className="eyebrow">{en ? 'The person behind the platform' : 'Der Mensch hinter der Plattform'}</p>
          <h2 id="founder-name">Sebastian Neumeier</h2>
          <p className="founder-role">{en ? 'Entrepreneur · Business network development' : 'Unternehmer · Aufbau geschäftlicher Netzwerke'}</p>
          <p>{en
            ? 'My focus is on bringing people and businesses together. I have built networks across different industries, connecting contacts, expertise and business opportunities.'
            : 'Mein Schwerpunkt liegt darauf, Menschen und Unternehmen miteinander zu verbinden. In unterschiedlichen Branchen habe ich Netzwerke aufgebaut und dabei Kontakte, Kompetenzen und unternehmerische Möglichkeiten zusammengebracht.'}</p>
          <p>{en
            ? 'With Robotaxi Connect, I bring this experience to the world of autonomous mobility. My aim is to connect taxi and fleet businesses with technology providers and create a foundation for new partnerships.'
            : 'Mit Robotaxi Connect bringe ich diese Erfahrung in die Welt der autonomen Mobilität ein. Mein Ziel ist es, Taxi- und Flottenunternehmen mit Technologieanbietern zu vernetzen und eine Grundlage für neue Partnerschaften zu schaffen.'}</p>
          <a className="founder-contact" href="mailto:info@robotaxi-connect.de">{en ? 'Get in touch' : 'Persönlich Kontakt aufnehmen'} <span aria-hidden="true">↗</span></a>
        </div>
      </section>
      <section className="operator-details" aria-labelledby="operator-title">
        <div>
          <p className="eyebrow">{en ? 'Provider information' : 'Anbieterkennzeichnung'}</p>
          <h2 id="operator-title">{en ? 'Operator & contact' : 'Betreiber & Kontakt'}</h2>
          <p>{en ? 'Information pursuant to Section 5 of the German Digital Services Act (DDG).' : 'Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG).'}</p>
        </div>
        <div className="operator-address">
          <h3>Sebastian Neumeier</h3>
          <p>{en ? 'Sole proprietor' : 'Einzelunternehmer'}</p>
          <address>Leinenbrunnen 12<br />71082 Herrenberg<br />{en ? 'Germany' : 'Deutschland'}</address>
          <dl>
            <div><dt>{en ? 'Phone' : 'Telefon'}</dt><dd><a href="tel:+491778333142">+49 177 8333142</a></dd></div>
            <div><dt>{en ? 'Email' : 'E-Mail'}</dt><dd><a href="mailto:info@robotaxi-connect.de">info@robotaxi-connect.de</a></dd></div>
            <div><dt>Website</dt><dd><a href="https://www.robotaxi-connect.de">www.robotaxi-connect.de</a></dd></div>
            <div><dt>{en ? 'VAT ID' : 'USt-IdNr.'}</dt><dd>DE342698664</dd></div>
          </dl>
        </div>
      </section>
      <aside className="imprint-purpose">
        <h2>{en ? 'What Robotaxi Connect does' : 'Was Robotaxi Connect macht'}</h2>
        <p>{en ? 'Robotaxi Connect is a B2B platform that connects taxi and fleet businesses with providers of autonomous mobility technology. We facilitate business contacts. We do not sell vehicles or operate robotaxis.' : 'Robotaxi Connect ist eine B2B-Plattform, die Taxi- und Flottenunternehmen mit Anbietern autonomer Mobilitätstechnologien zusammenbringt. Wir vermitteln geschäftliche Kontakte. Wir verkaufen keine Fahrzeuge und betreiben keine Robotaxis.'}</p>
      </aside>
    </main>
  );
}
