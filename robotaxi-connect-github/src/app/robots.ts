import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/config/knowledge';
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/admin', '/*/admin', '/*/portal', '/*/demo', '/*/auth/', '/*/login', '/*/register', '/*/reset-password', '/*/forgot-password'] }, sitemap: `${siteOrigin}/sitemap.xml` };
}
