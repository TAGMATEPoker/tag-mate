import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ADMIN_EMAIL = 'tagmate.info@gmail.com';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // 最終アクセス日時を更新（プロフィールが存在する場合）
      await supabase
        .from('profiles')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', data.user.id);

      // 管理者はデフォルトで /admin へ遷移
      if (data.user.email === ADMIN_EMAIL) {
        return NextResponse.redirect(`${origin}/admin`);
      }

      return NextResponse.redirect(`${origin}${next || '/'}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}