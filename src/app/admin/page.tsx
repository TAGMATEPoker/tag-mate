'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type EventItem = {
  id: string;
  title: string;
  event_date: string | null;
  location: string | null;
  shop_name: string | null;
  entry_fee: string | null;
  is_official: boolean;
  created_at?: string;
};

export default function AdminEventsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);

  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [shopName, setShopName] = useState('');
  const [location, setLocation] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [isOfficial, setIsOfficial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  const loadEvents = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true, nullsFirst: false });

    if (error) {
      setNotice(`読み込みエラー: ${error.message}`);
    } else {
      setEvents(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !title.trim()) return;

    setSubmitting(true);
    setNotice('');

    const { error } = await supabase.from('events').insert({
      title: title.trim(),
      event_date: eventDate || null,
      shop_name: shopName.trim() || null,
      location: location.trim() || null,
      entry_fee: entryFee.trim() || null,
      is_official: isOfficial,
      created_by: userId,
    });

    setSubmitting(false);

    if (error) {
      setNotice(`登録エラー: ${error.message}`);
      return;
    }

    setTitle('');
    setEventDate('');
    setShopName('');
    setLocation('');
    setEntryFee('');
    setIsOfficial(true);
    setNotice('イベントを登録しました！');
    await loadEvents();
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        読み込み中...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div>
            <h1 className="text-lg font-bold text-emerald-400">イベント管理</h1>
            <p className="text-xs text-zinc-400">TAG MATE イベント登録画面</p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold hover:bg-zinc-700"
          >
            トップへ戻る
          </Link>
        </header>

        {notice && (
          <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/60 px-4 py-3 text-xs text-emerald-300">
            {notice}
          </div>
        )}

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-sm font-bold text-white">新規イベント登録</h2>
          <form onSubmit={handleCreateEvent} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs text-zinc-300">イベント名 *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：渋谷タッグリーグ 第1節"
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-zinc-300">開催日（カレンダーから選択）</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-300">参加費</label>
                <input
                  type="text"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  placeholder="例：5,000円 / 1ペア 8,000円"
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-zinc-300">店舗名</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="例：POKER ROOM 〇〇"
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-300">エリア・場所（任意）</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="例：東京・渋谷"
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={isOfficial}
                onChange={(e) => setIsOfficial(e.target.checked)}
              />
              公式イベントとして登録する
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {submitting ? '登録中...' : 'イベントを登録'}
            </button>
          </form>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-white">登録済みイベント（{events.length}件）</h2>
          {events.map((ev) => (
            <div
              key={ev.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-xs"
            >
              <div className="flex flex-wrap items-center gap-2">
                {ev.is_official && (
                  <span className="rounded bg-emerald-950 px-2 py-0.5 text-[11px] text-emerald-300">
                    公式
                  </span>
                )}
                <span className="text-sm font-bold text-white">{ev.title}</span>
                {ev.entry_fee && (
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] text-amber-300">
                    参加費: {ev.entry_fee}
                  </span>
                )}
              </div>
              <p className="mt-1 text-zinc-400">
                {ev.event_date || '日程未定'}
                {ev.shop_name ? ` / ${ev.shop_name}` : ''}
                {ev.location ? ` / ${ev.location}` : ''}
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}