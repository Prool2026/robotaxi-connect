import { notFound } from 'next/navigation';
import { isDemo } from '@/lib/env';
import { localeOf } from '@/lib/domain';
import { PortalScreen, portalSections } from '@/components/portal-screen';
import { AdminScreen, adminSections } from '@/components/admin-screen';
export default async function Demo({
  params,
}: {
  params: Promise<{ locale: string; area: string; segments?: string[] }>;
}) {
  if (!isDemo()) notFound();
  const p = await params;
  const locale = localeOf(p.locale);
  const segments = p.segments || [];
  const { demoAdmin, demoPortal } = await import('@/lib/demo');
  if (p.area === 'portal' && portalSections.includes(segments.join('/')))
    return <PortalScreen locale={locale} section={segments.join('/')} data={demoPortal()} demo />;
  if (p.area === 'admin' && adminSections.includes(segments[0] || '') && segments.length <= 2)
    return <AdminScreen locale={locale} segments={segments} data={demoAdmin()} demo />;
  notFound();
}
