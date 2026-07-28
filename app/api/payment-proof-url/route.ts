import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { proofUrl } = await req.json();

  const bucketName = 'payment-proofs';
  const marker = `/${bucketName}/`;
  const idx = proofUrl.indexOf(marker);

  if (idx === -1) {
    return NextResponse.json({ signedUrl: proofUrl });
  }

  const filePath = proofUrl.substring(idx + marker.length);

  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .createSignedUrl(filePath, 60 * 60);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ signedUrl: proofUrl });
  }

  return NextResponse.json({ signedUrl: data.signedUrl });
}
