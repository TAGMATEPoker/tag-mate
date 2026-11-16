'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/login') {
    return null;
  }

  const isHome = pathname === '/';
  const isMatches = pathname === '/matches';
  const isProfile = pathname === '/profile';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/95 pb-safe backdrop-blur-md">
      <div className="mx-auto grid max-w-2xl grid-cols-4 px-2 py-2">
        <Link
          href="/?tab=all"
          className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[11px] font-bold transition ${
            isHome ? 'text-[#00C49A]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={isHome ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z" />
          </svg>
          <span>ホーム</span>
        </Link>

        <Link
          href="/#recruitment-list-section"
          className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[11px] font-bold text-slate-400 transition hover:text-[#00C49A]"
        >
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
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>探す</span>
        </Link>

        <Link
          href="/#event-list-section"
          className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[11px] font-bold text-slate-400 transition hover:text-[#00C49A]"
        >
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
            <rect x="3" y="4" width="18" height="18" rx="3" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>イベント</span>
        </Link>

        <Link
          href={isMatches ? '/profile' : '/matches'}
          className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[11px] font-bold transition ${
            isMatches || isProfile
              ? 'text-[#00C49A]'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
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
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>マイページ</span>
        </Link>
      </div>
    </nav>
  );
}