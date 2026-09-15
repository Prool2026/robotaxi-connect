import { notFound } from 'next/navigation';
import { requireCompany } from '@/lib/auth';
import { loadPortal } from '@/lib/data';
import { localeOf } from '@/lib/domain';
import { PortalScreen, portalSections } from '@/components/portal-screen';
export default async function Portal({
  params,
}: {
  params: Promise<{ locale: string; section?: string[] }>;
}) {
  const p = await params;
  const locale = localeOf(p.locale);
  const section = p.section?.join('/') || '';
  if (!portalSections.includes(section)) notFound();
  const identity = await requireCompany(locale);
  const data = await loadPortal(identity.db, identity.companyId, identity.profile);
  return <PortalScreen locale={locale} section={section} data={data} />;
}
