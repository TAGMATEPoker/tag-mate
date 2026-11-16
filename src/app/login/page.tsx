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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#E6F7F4] via-[#F4F8FB] to-[#EEF5FF] px-4 py-8 text-slate-800">
      <div className="w-full max-w-md rounded-3xl border border-white bg-white/95 p-8 shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col items-center text-center">
          {/* ミントグリーンカードロゴ */}
          <svg
            width="52"
            height="52"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="4"
              y="7"
              width="17"
              height="23"
              rx="4"
              transform="rotate(-10 4 7)"
              fill="#E6FBF5"
              stroke="#00C49A"
              strokeWidth="2"
            />
            <rect
              x="13"
              y="5"
              width="18"
              height="24"
              rx="4"
              transform="rotate(6 13 5)"
              fill="#FFFFFF"
              stroke="#00C49A"
              strokeWidth="2.2"
            />
            <path
              d="M21.2 12.2C21.2 12.2 17.4 15.8 17.4 18.1C17.4 19.4 18.4 20.3 19.6 20.3C20.2 20.3 20.8 20 21.1 19.5L20.4 21.8H22.2L21.5 19.5C21.8 20 22.3 20.3 23.0 20.3C24.2 20.3 25.2 19.4 25.2 18.1C25.2 15.8 21.2 12.2 21.2 12.2Z"
              fill="#1E293B"
            />
          </svg>

          <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
            TAG <span className="text-[#00C49A]">MATE</span>
          </h1>
          <p className="mt-1.5 text-xs font-bold text-slate-500">
            ポーカーの相方を見つけよう！
          </p>
        </div>

        {errorMsg && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600">
            {errorMsg}
          </div>
        )}

        <div className="mt-7 space-y-3">
          {/* Googleログイン */}
          <button
            type="button"
            disabled={loadingProvider !== null}
            onClick={() => handleOAuthLogin('google')}
            className="flex w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#00D69F] to-[#00B88D] px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_6px_18px_rgba(0,196,154,0.35)] transition hover:opacity-95 disabled:opacity-50"
          >
            <span>{loadingProvider === 'google' ? '接続中...' : 'Googleでログイン'}</span>
          </button>

          {/* Xログイン */}
          <button
            type="button"
            disabled={loadingProvider !== null}
            onClick={() => handleOAuthLogin('x')}
            className="flex w-full items-center justify-center gap-2.5 rounded-full border border-slate-200 bg-slate-900 px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
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

        <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-400">
          イベントで一緒に楽しめるパートナーが見つかるマッチングサービス（出会い目的禁止）
        </p>
      </div>
    </main>
  );
}