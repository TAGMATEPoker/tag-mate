'use client';

import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-white">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-emerald-400">TAG MATE</h1>
        <p className="mt-2 text-sm text-zinc-400">
          ポーカータッグ戦の相方探し専用サービス
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          ※出会い目的での利用は禁止しています
        </p>

        <button
          onClick={handleGoogleLogin}
          className="mt-6 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
        >
          Googleアカウントでログイン
        </button>
      </div>
    </main>
  );
}