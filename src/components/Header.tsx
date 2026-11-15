'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Header() {
  const pathname = usePathname();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  if (pathname === '/login') {
    return null;
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="group flex items-center gap-2.5">
          {/* TAG MATE ロゴマーク（重なる2枚のカード＋スペード） */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0 transition-transform group-hover:scale-105"
          >
            <rect
              x="4"
              y="7"
              width="17"
              height="23"
              rx="3.5"
              transform="rotate(-10 4 7)"
              className="fill-zinc-800 stroke-emerald-500/60"
              strokeWidth="1.5"
            />
            <rect
              x="13"
              y="5"
              width="18"
              height="24"
              rx="3.5"
              transform="rotate(6 13 5)"
              className="fill-zinc-900 stroke-emerald-400"
              strokeWidth="1.75"
            />
            <path
              d="M21.2 12.5C21.2 12.5 17.5 16 17.5 18.2C17.5 19.5 18.5 20.3 19.7 20.3C20.3 20.3 20.8 20 21.1 19.6L20.4 21.8H22.2L21.5 19.6C21.8 20 22.3 20.3 22.9 20.3C24.1 20.3 25.1 19.5 25.1 18.2C25.1 16 21.2 12.5 21.2 12.5Z"
              className="fill-emerald-400"
            />
          </svg>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-lg font-black tracking-wider text-white">
                TAG <span className="text-emerald-400">MATE</span>
              </span>
            </div>
            <span className="mt-0.5 text-[10px] tracking-wide text-zinc-400">
              POKER TAG PARTNER
            </span>
          </div>
        </Link>

        {/* 右上3本線メニューボタン＆プルダウン */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="メニューを開く"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800"
          >
            {menuOpen ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            )}
          </button>

          {menuOpen && (
            <nav className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 py-1.5 shadow-2xl">
              <Link
                href="/?tab=all"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800 hover:text-emerald-400"
              >
                <span>TOP</span>
              </Link>
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800 hover:text-emerald-400"
              >
                <span>プロフィール編集</span>
              </Link>
              <Link
                href="/?tab=mine"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800 hover:text-emerald-400"
              >
                <span>自分の募集</span>
              </Link>
              <Link
                href="/?tab=applied"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800 hover:text-emerald-400"
              >
                <span>応募一覧</span>
              </Link>

              <div className="my-1 border-t border-zinc-800" />

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-semibold text-red-300 transition hover:bg-red-950/50 disabled:opacity-50"
              >
                <span>{loggingOut ? 'ログアウト中...' : 'ログアウト'}</span>
              </button>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}