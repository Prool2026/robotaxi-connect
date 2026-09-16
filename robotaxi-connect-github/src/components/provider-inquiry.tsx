'use client';
import { useState, type FormEvent } from 'react';
import type { Locale } from '@/lib/domain';
export function ProviderInquiry({ locale }: { locale: Locale }) {
  const de = locale === 'de'; const [prepared, setPrepared] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = `${de ? 'Registrierungsanfrage als Technologieunternehmen' : 'Technology company registration enquiry'}\n\n${['company','name','email','website','solution','markets'].map(key => `${key}: ${data.get(key) || ''}`).join('\n\n')}`;
    window.location.href = `mailto:info@robotaxi-connect.de?subject=${encodeURIComponent('Robotaxi Connect – Technologieunternehmen')}&body=${encodeURIComponent(body)}`;
    setPrepared(true);
  }
  return <form onSubmit={submit} className="provider-inquiry">
    <h2>{de ? 'Ihr Unternehmen vorstellen' : 'Introduce your company'}</h2>
    <p>{de ? 'Wir bearbeiten Ihre Anfrage persönlich per E-Mail. Sie erhalten kein Plattformkonto und keinen Einblick in andere Unternehmen.' : 'We handle your enquiry personally by email. This does not create a platform account or provide access to other companies.'}</p>
    {[['company',de ? 'Unternehmen' : 'Company','text'],['name',de ? 'Ansprechperson' : 'Contact name','text'],['email',de ? 'Geschäftliche E-Mail' : 'Business email','email'],['website','Website','url']].map(([key,label,type]) => <label key={key} htmlFor={`provider-${key}`}>{label}{key !== 'website' ? ' *' : ''}<input id={`provider-${key}`} name={key} type={type} required={key !== 'website'} maxLength={200} /></label>)}
    <label htmlFor="provider-solution">{de ? 'Ihre Technologie / Lösung *' : 'Your technology / solution *'}<textarea id="provider-solution" name="solution" required maxLength={1500} rows={4} /></label>
    <label htmlFor="provider-markets">{de ? 'Zielmärkte und aktueller Entwicklungsstand *' : 'Target markets and current development stage *'}<textarea id="provider-markets" name="markets" required maxLength={1000} rows={3} /></label>
    <p className="news-video-note">{de ? 'Der Button öffnet einen E-Mail-Entwurf. Erst wenn Sie diesen in Ihrem E-Mail-Programm senden, erreicht uns Ihre Anfrage.' : 'The button opens an email draft. We only receive your enquiry when you send it from your email application.'} <a className="text-link" href={`/${locale}/legal/privacy`}>{de ? 'Datenschutz' : 'Privacy'}</a></p>
    <button className="button primary" type="submit">{de ? 'Registrierungsanfrage per E-Mail vorbereiten' : 'Prepare registration enquiry by email'}</button>
    {prepared && <p role="status">{de ? 'Bitte senden Sie den Entwurf in Ihrem E-Mail-Programm. Falls sich kein Programm öffnet, schreiben Sie Ihre Angaben direkt an info@robotaxi-connect.de. Die Anfrage wurde hier noch nicht versendet.' : 'Please send the draft in your email application. If none opens, send your details directly to info@robotaxi-connect.de. Nothing has been sent from this page.'}</p>}
  </form>;
}
