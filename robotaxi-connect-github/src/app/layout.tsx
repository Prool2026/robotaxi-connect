import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { brand } from '@/config/brand';
import { RouteScroll } from '@/components/route-scroll';
import './globals.css';
export const metadata: Metadata = {
  title: { default: brand.name, template: `%s | ${brand.name}` },
  description: brand.claim.de,
  icons: { icon: brand.logo },
};
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (await headers()).get('x-robotaxi-locale') || 'de';
  return (
    <html lang={locale}>
      <body><RouteScroll />{children}</body>
    </html>
  );
}
