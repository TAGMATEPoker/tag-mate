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
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/" className="group flex items-center gap-2.5">
          {/* ミントグリーンの重なる2枚カードロゴ */}
          <svg
            width="34"
            height="34"
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

          <span className="text-xl font-black tracking-tight text-slate-900">
            TAG <span className="text-[#00C49A]">MATE</span>
          </span>
        </Link>

        {/* 右上丸型3本線メニュー */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="メニューを開く"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            {menuOpen ? (
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            )}
          </button>

          {menuOpen && (
            <nav className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl">
              <Link
                href="/?tab=all"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-[#00B38B]"
              >
                <span>TOP</span>
              </Link>
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-[#00B38B]"
              >
                <span>プロフィール編集</span>
              </Link>
              <Link
                href="/?tab=mine"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-[#00B38B]"
              >
                <span>自分の募集</span>
              </Link>
              <Link
                href="/?tab=applied"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-[#00B38B]"
              >
                <span>応募一覧</span>
              </Link>
              <Link
                href="/matches"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-[#00B38B]"
              >
                <span>成立したマッチング</span>
              </Link>

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-bold text-rose-500 transition hover:bg-rose-50 disabled:opacity-50"
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