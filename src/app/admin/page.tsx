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

type EditFormState = {
  title: string;
  event_date: string;
  shop_name: string;
  location: string;
  entry_fee: string;
  is_official: boolean;
};

export default function AdminEventsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);

  // 新規登録フォーム
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [shopName, setShopName] = useState('');
  const [location, setLocation] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [isOfficial, setIsOfficial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 編集中のイベントIDとフォーム値
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    title: '',
    event_date: '',
    shop_name: '',
    location: '',
    entry_fee: '',
    is_official: true,
  });
  const [updating, setUpdating] = useState(false);

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

  // 新規イベント登録
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

  // 編集モード開始
  const startEditing = (ev: EventItem) => {
    setNotice('');
    setEditingId(ev.id);
    setEditForm({
      title: ev.title || '',
      event_date: ev.event_date || '',
      shop_name: ev.shop_name || '',
      location: ev.location || '',
      entry_fee: ev.entry_fee || '',
      is_official: Boolean(ev.is_official),
    });
  };

  // 編集キャンセル
  const cancelEditing = () => {
    setEditingId(null);
  };

  // 登録済みイベントの更新（管理画面からのみ実行）
  const handleUpdateEvent = async (e: React.FormEvent, eventId: string) => {
    e.preventDefault();
    if (!editForm.title.trim()) return;

    setUpdating(true);
    setNotice('');

    const { error } = await supabase
      .from('events')
      .update({
        title: editForm.title.trim(),
        event_date: editForm.event_date || null,
        shop_name: editForm.shop_name.trim() || null,
        location: editForm.location.trim() || null,
        entry_fee: editForm.entry_fee.trim() || null,
        is_official: editForm.is_official,
      })
      .eq('id', eventId);

    setUpdating(false);

    if (error) {
      setNotice(`更新エラー: ${error.message}`);
      return;
    }

    setEditingId(null);
    setNotice('イベント内容を更新しました！');
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
            <p className="text-xs text-zinc-400">TAG MATE イベント登録・編集画面</p>
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

        {/* 新規イベント登録 */}
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

        {/* 登録済みイベント一覧（編集機能は管理画面のみ） */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-white">登録済みイベント（{events.length}件）</h2>
          {events.map((ev) => {
            const isEditing = editingId === ev.id;

            return (
              <div
                key={ev.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-xs"
              >
                {isEditing ? (
                  <form
                    onSubmit={(e) => handleUpdateEvent(e, ev.id)}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-xs text-zinc-300">イベント名 *</label>
                      <input
                        type="text"
                        required
                        value={editForm.title}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, title: e.target.value }))
                        }
                        className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs text-zinc-300">
                          開催日（カレンダーから選択）
                        </label>
                        <input
                          type="date"
                          value={editForm.event_date}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, event_date: e.target.value }))
                          }
                          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm [color-scheme:dark]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-300">参加費</label>
                        <input
                          type="text"
                          value={editForm.entry_fee}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, entry_fee: e.target.value }))
                          }
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
                          value={editForm.shop_name}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, shop_name: e.target.value }))
                          }
                          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-300">エリア・場所（任意）</label>
                        <input
                          type="text"
                          value={editForm.location}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, location: e.target.value }))
                          }
                          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-zinc-300">
                      <input
                        type="checkbox"
                        checked={editForm.is_official}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, is_official: e.target.checked }))
                        }
                      />
                      公式イベントとして登録する
                    </label>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={updating}
                        className="rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
                      >
                        {updating ? '保存中...' : '変更を保存'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs text-zinc-300 hover:bg-zinc-700"
                      >
                        キャンセル
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
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

                    <button
                      type="button"
                      onClick={() => startEditing(ev)}
                      className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
                    >
                      編集
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}