import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { loadAdmin } from '@/lib/data';
import { localeOf, companyStatuses } from '@/lib/domain';
import { uuid } from '@/lib/validation';
import { AdminScreen, adminSections } from '@/components/admin-screen';
export default async function Admin({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; segments?: string[] }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await params;
  const q = await searchParams;
  const locale = localeOf(p.locale);
  const segments = p.segments || [];
  if (!adminSections.includes(segments[0] || '') || segments.length > 2) notFound();
  if (segments[1] && segments[1] !== 'new' && !uuid.safeParse(segments[1]).success) notFound();
  const identity = await requireAdmin(locale);
  const page = Math.max(0, Math.min(100000, Number.parseInt(q.page || '0', 10) || 0));
  const status = companyStatuses.includes(q.status as (typeof companyStatuses)[number])
    ? q.status
    : '';
  const search = q.q?.slice(0, 100) || '';
  const data = await loadAdmin(identity.db, identity.profile, {
    search: segments[0] === 'companies' ? search : '',
    status: segments[0] === 'companies' ? status : '',
    page,
    section: segments[0] || '',
    recordId: segments[1],
    companyId:
      segments[0] === 'companies' && segments[1] && segments[1] !== 'new'
        ? segments[1]
        : uuid.safeParse(q.company).success
          ? q.company
          : undefined,
  });
  return (
    <AdminScreen
      locale={locale}
      segments={segments}
      data={data}
      search={search}
      status={status}
      page={page}
      created={q.created === '1'}
    />
  );
}
