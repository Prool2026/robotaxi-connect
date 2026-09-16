import type { MetadataRoute } from 'next';
import { guides, siteOrigin, guideUrl } from '@/config/knowledge';
import { editions } from '@/config/developments';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['de', 'en'].flatMap(locale => [
    { url: `${siteOrigin}/${locale}` },
    { url: `${siteOrigin}/${locale}/taxiunternehmen` },
    { url: `${siteOrigin}/${locale}/technologieunternehmen` },
    { url: `${siteOrigin}/${locale}/developments`, lastModified: [...editions].sort((a,b) => b.date.localeCompare(a.date))[0].date },
    { url: guideUrl(locale), lastModified: [...guides].sort((a,b) => b.reviewed.localeCompare(a.reviewed))[0].reviewed },
    ...guides.map(g => ({ url: guideUrl(locale, g.slug), lastModified: g.reviewed, alternates: { languages: { de: guideUrl('de', g.slug), en: guideUrl('en', g.slug) } } })),
  ]);
}
