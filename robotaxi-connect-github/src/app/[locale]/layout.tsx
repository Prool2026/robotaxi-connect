import { notFound } from 'next/navigation';
import { brand } from '@/config/brand';
import { localeOf } from '@/lib/domain';
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return { description: brand.claim[localeOf((await params).locale)] };
}
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  if (!['de', 'en'].includes((await params).locale)) notFound();
  return children;
}
