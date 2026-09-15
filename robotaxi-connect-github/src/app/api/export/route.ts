import { getIdentity } from '@/lib/auth';
import { isAdmin } from '@/lib/domain';
import { loadPortal } from '@/lib/data';
export async function GET() {
  const identity = await getIdentity();
  if (!identity || isAdmin(identity.profile.role)) return new Response(null, { status: 401 });
  const { data: member } = await identity.db
    .from('company_members')
    .select('company_id')
    .eq('user_id', identity.user.id)
    .single();
  if (!member) return new Response(null, { status: 403 });
  const data = await loadPortal(identity.db, member.company_id, identity.profile);
  const { error } = await identity.db.rpc('request_privacy', { request_kind: 'EXPORT' });
  if (error) return new Response(null, { status: 429 });
  return Response.json(
    { exported_at: new Date().toISOString(), ...data },
    {
      headers: {
        'Content-Disposition': 'attachment; filename="company-export.json"',
        'Cache-Control': 'private, no-store',
      },
    },
  );
}
