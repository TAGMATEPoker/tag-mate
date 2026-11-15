'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  if (pathname === '/login') {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-emerald-400">
            TAG MATE
          </span>
          <span className="hidden text-[11px] text-zinc-400 sm:inline">
            ポーカータッグ戦の相方探し専用
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              pathname === '/'
                ? 'bg-emerald-500 text-zinc-950'
                : 'border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            TOP
          </Link>
          <Link
            href="/profile"
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              pathname === '/profile'
                ? 'bg-emerald-500 text-zinc-950'
                : 'border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            プロフィール編集
          </Link>
        </nav>
      </div>
    </header>
  );
}