'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type EventItem = {
  id: string;
  title: string;
  event_date: string | null;
  start_time: string | null;
  registration_end_time: string | null;
  detail_url: string | null;
  location: string | null;
  shop_name: string | null;
  entry_fee: string | null;
  is_official: boolean;
};

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [registrationEndTime, setRegistrationEndTime] = useState('');
  const [detailUrl, setDetailUrl] = useState('');
  const [shopName, setShopName] = useState('');
  const [location, setLocation] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadEvents = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('is_official', true)
      .order('event_date', { ascending: true, nullsFirst: false });

    setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setEventDate('');
    setStartTime('');
    setRegistrationEndTime('');
    setDetailUrl('');
    setShopName('');
    setLocation('');
    setEntryFee('');
  };

  const handleEdit = (ev: EventItem) => {
    setEditingId(ev.id);
    setTitle(ev.title);
    setEventDate(ev.event_date || '');
    setStartTime(ev.start_time || '');
    setRegistrationEndTime(ev.registration_end_time || '');
    setDetailUrl(ev.detail_url || '');
    setShopName(ev.shop_name || '');
    setLocation(ev.location || '');
    setEntryFee(ev.entry_fee || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setMessage('イベント名を入力してください。');
      return;
    }

    setSaving(true);
    setMessage('');

    const payload = {
      title: title.trim(),
      event_date: eventDate || null,
      start_time: startTime || null,
      registration_end_time: registrationEndTime || null,
      detail_url: detailUrl.trim() || null,
      shop_name: shopName.trim() || null,
      location: location.trim() || null,
      entry_fee: entryFee.trim() || null,
      is_official: true,
    };

    const { error } = editingId
      ? await supabase.from('events').update(payload).eq('id', editingId)
      : await supabase.from('events').insert(payload);

    setSaving(false);

    if (error) {
      setMessage(`保存エラー: ${error.message}`);
      return;
    }

    setMessage(editingId ? 'イベントを更新しました！' : '公式イベントを登録しました！');
    resetForm();
    await loadEvents();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この公式イベントを削除しますか？')) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) {
      setMessage(`削除エラー: ${error.message}`);
    } else {
      setMessage('削除しました。');
      await loadEvents();
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4F8FB] text-slate-600">
        読み込み中...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F8FB] px-4 py-6 text-slate-800">
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-extrabold text-slate-900">
            {editingId ? '公式イベントを編集' : '公式イベントを登録'}
          </h1>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600">イベント名 *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：JOPT タッグチーム戦"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-600">開催日</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600">開始時刻</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600">受付終了時刻</label>
                <input
                  type="time"
                  value={registrationEndTime}
                  onChange={(e) => setRegistrationEndTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-600">店舗名</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="例：新宿ポーカーハウス"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600">エリア</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="例：東京都 新宿区"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600">参加費</label>
                <input
                  type="text"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  placeholder="例：1ペア 8,000円"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600">
                詳細ページURL（外部サイト）
              </label>
              <input
                type="url"
                value={detailUrl}
                onChange={(e) => setDetailUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              />
            </div>

            {message && (
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                {message}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#00C49A] px-6 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-[#00B38B] disabled:opacity-50"
              >
                {saving ? '保存中...' : editingId ? '更新する' : '登録する'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600"
                >
                  キャンセル
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-extrabold text-slate-700">
            登録済み公式イベント（{events.length}件）
          </h2>
          {events.map((ev) => (
            <div
              key={ev.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xs"
            >
              <div className="space-y-1 text-xs">
                <p className="text-sm font-extrabold text-slate-900">{ev.title}</p>
                <p className="text-slate-500">
                  {ev.event_date || '日程未定'}
                  {ev.start_time ? ` ${ev.start_time}〜` : ''}
                  {ev.registration_end_time ? `（受付終了 ${ev.registration_end_time}）` : ''}
                  {ev.shop_name ? ` / ${ev.shop_name}` : ''}
                </p>
                {ev.detail_url && (
                  <p className="truncate text-[11px] text-[#00A884]">{ev.detail_url}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(ev)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(ev.id)}
                  className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}