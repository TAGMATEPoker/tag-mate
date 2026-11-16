'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function BottomNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pathname === '/login') {
    return null;
  }

  const stayQuery = searchParams.get('stay') === '1' ? 'stay=1' : '';
  const view = searchParams.get('view') || 'home';

  const buildHomeHref = (targetView: 'home' | 'search' | 'events') => {
    const params = new URLSearchParams();
    if (stayQuery) params.set('stay', '1');
    if (targetView !== 'home') params.set('view', targetView);
    const qs = params.toString();
    return qs ? `/?${qs}` : '/';
  };

  const isHomeActive = pathname === '/' && view === 'home';
  const isSearchActive = pathname === '/' && view === 'search';
  const isEventsActive = pathname === '/' && view === 'events';
  const isProfileActive = pathname === '/profile' || pathname === '/matches';

  const navItems = [
    {
      key: 'home',
      label: 'ホーム',
      icon: '🏠',
      href: buildHomeHref('home'),
      active: isHomeActive,
    },
    {
      key: 'search',
      label: '探す',
      icon: '🔍',
      href: buildHomeHref('search'),
      active: isSearchActive,
    },
    {
      key: 'events',
      label: 'イベント',
      icon: '📅',
      href: buildHomeHref('events'),
      active: isEventsActive,
    },
    {
      key: 'profile',
      label: 'マイページ',
      icon: '👤',
      href: '/profile',
      active: isProfileActive,
    },
  ];

  return (
    <nav
      aria-label="ボトムナビゲーション"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/80 bg-white/95 px-2 py-2 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] backdrop-blur-md"
    >
      <div className="mx-auto grid max-w-2xl grid-cols-4 gap-1">
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            scroll={false}
            className={`flex flex-col items-center justify-center rounded-2xl py-1.5 text-[11px] font-extrabold transition ${
              item.active
                ? 'bg-emerald-50 text-[#00A884]'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span className="mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default function BottomNav() {
  return (
    <Suspense fallback={null}>
      <BottomNavInner />
    </Suspense>
  );
}