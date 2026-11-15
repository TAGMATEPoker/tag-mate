'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const supabase = createClient();
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'x' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleOAuthLogin = async (provider: 'google' | 'x') => {
    setLoadingProvider(provider);
    setErrorMsg('');

    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://tag-mate-lime.vercel.app';

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMsg(`ログインエラー: ${error.message}`);
      setLoadingProvider(null);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-8 text-white">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-wider text-white">
            TAG <span className="text-emerald-400">MATE</span>
          </h1>
          <p className="mt-1.5 text-xs text-zinc-400">
            勝つための出会いを、ここから。
          </p>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-red-700/50 bg-red-950/60 px-4 py-3 text-xs text-red-200">
            {errorMsg}
          </div>
        )}

        <div className="mt-6 space-y-3">
          {/* Googleログイン */}
          <button
            type="button"
            disabled={loadingProvider !== null}
            onClick={() => handleOAuthLogin('google')}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-white px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
          >
            <span>{loadingProvider === 'google' ? '接続中...' : 'Googleでログイン'}</span>
          </button>

          {/* Xログイン */}
          <button
            type="button"
            disabled={loadingProvider !== null}
            onClick={() => handleOAuthLogin('x')}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>{loadingProvider === 'x' ? '接続中...' : 'Xでログイン'}</span>
          </button>
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-zinc-500">
          ログインすることで、ポーカーのタッグ戦・チーム戦の相方募集およびマッチング機能を利用できます。
        </p>
      </div>
    </main>
  );
}