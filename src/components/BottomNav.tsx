'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

type HomeViewKey = 'home' | 'search' | 'events';

function BottomNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlViewParam = searchParams.get('view');
  const initialView: HomeViewKey =
    urlViewParam === 'search' || urlViewParam === 'events' ? urlViewParam : 'home';

  const [activeView, setActiveView] = useState<HomeViewKey>(initialView);

  useEffect(() => {
    if (pathname !== '/') return;
    const currentView = searchParams.get('view');
    if (currentView === 'search' || currentView === 'events') {
      setActiveView(currentView);
    } else {
      setActiveView('home');
    }
  }, [pathname, searchParams]);

  if (pathname === '/login') {
    return null;
  }

  const stayQuery = searchParams.get('stay') === '1';

  const buildHomeHref = (targetView: HomeViewKey) => {
    const params = new URLSearchParams();
    if (stayQuery) params.set('stay', '1');
    if (targetView !== 'home') params.set('view', targetView);
    const qs = params.toString();
    return qs ? `/?${qs}` : '/';
  };

  const isHomeActive = pathname === '/' && activeView === 'home';
  const isSearchActive = pathname === '/' && activeView === 'search';
  const isEventsActive = pathname === '/' && activeView === 'events';
  const isProfileActive = pathname === '/profile' || pathname === '/matches';

  const navItems: {
    key: string;
    label: string;
    icon: string;
    href: string;
    active: boolean;
    scroll?: boolean;
    onClick?: () => void;
  }[] = [
    {
      key: 'home',
      label: 'ホーム',
      icon: '🏠',
      href: buildHomeHref('home'),
      active: isHomeActive,
      scroll: false,
      onClick: () => {
        setActiveView('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
    {
      key: 'search',
      label: '探す',
      icon: '🔍',
      href: buildHomeHref('search'),
      active: isSearchActive,
      scroll: false,
      onClick: () => setActiveView('search'),
    },
    {
      key: 'events',
      label: 'イベント',
      icon: '📅',
      href: buildHomeHref('events'),
      active: isEventsActive,
      scroll: false,
      onClick: () => setActiveView('events'),
    },
    {
      key: 'profile',
      label: 'マイページ',
      icon: '👤',
      href: '/profile',
      active: isProfileActive,
      scroll: true,
      onClick: () => {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      },
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
            scroll={item.scroll}
            onClick={item.onClick}
            className={`flex flex-col items-center justify-center rounded-2xl py-2 text-[11px] font-extrabold transition ${
              item.active
                ? 'bg-[#00C49A] text-white shadow-[0_4px_12px_rgba(0,196,154,0.3)]'
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