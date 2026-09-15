import { NextResponse } from 'next/server';
import { getIdentity } from '@/lib/auth';
import { uuid } from '@/lib/validation';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity = await getIdentity();
  if (!identity) return new Response(null, { status: 401 });
  const id = uuid.safeParse((await params).id);
  if (!id.success) return new Response(null, { status: 404 });
  const { data, error } = await identity.db
    .from('documents')
    .select('storage_path,title,archived_at')
    .eq('id', id.data)
    .single();
  if (error || !data || data.archived_at) return new Response(null, { status: 404 });
  const { data: signed, error: signError } = await identity.db.storage
    .from('company-files')
    .createSignedUrl(data.storage_path, 60, { download: true });
  if (signError || !signed) return new Response(null, { status: 404 });
  const response = NextResponse.redirect(signed.signedUrl);
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
