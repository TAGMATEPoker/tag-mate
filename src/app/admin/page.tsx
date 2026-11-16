'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const ADMIN_EMAIL = 'tagmate.info@gmail.com';

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

type RecruitmentItem = {
  id: string;
  event_id: string | null;
  user_id: string;
  comment: string | null;
  status: 'open' | 'closed';
  created_at: string;
};

type ProfileItem = {
  id: string;
  name: string;
  x_username: string | null;
  avatar_url: string | null;
  age_group: string | null;
  gender: string | null;
  area: string | null;
  experience: string | null;
  play_type: string | null;
  stance: string | null;
  created_at?: string | null;
  last_active_at?: string | null;
};

type AdminTab = 'events' | 'recruitments' | 'users';

function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '未記録';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '未記録';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('events');

  const [events, setEvents] = useState<EventItem[]>([]);
  const [recruitments, setRecruitments] = useState<RecruitmentItem[]>([]);
  const [users, setUsers] = useState<ProfileItem[]>([]);
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

  const loadAllAdminData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.email !== ADMIN_EMAIL) {
      router.replace('/');
      return;
    }

    setAuthorized(true);

    const [{ data: eventsData }, { data: recsData }, { data: usersData }] = await Promise.all([
      supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true, nullsFirst: false }),
      supabase
        .from('recruitments')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('*')
        .order('last_active_at', { ascending: false, nullsFirst: false }),
    ]);

    setEvents(eventsData || []);
    setRecruitments(recsData || []);
    setUsers(usersData || []);
    setLoading(false);
  };

  useEffect(() => {
    loadAllAdminData();
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

  const handleEditEvent = (ev: EventItem) => {
    setActiveTab('events');
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

  const handleSubmitEvent = async (e: React.FormEvent) => {
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

    setMessage(editingId ? 'イベントを更新しました！' : '公式イベントを新規作成しました！');
    resetForm();
    await loadAllAdminData();
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('このイベントを削除しますか？')) return;
    setMessage('');
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) {
      setMessage(`イベント削除エラー: ${error.message}`);
    } else {
      setMessage('イベントを削除しました。');
      await loadAllAdminData();
    }
  };

  const handleDeleteRecruitment = async (id: string) => {
    if (!confirm('この募集投稿を削除しますか？')) return;
    setMessage('');
    const { error } = await supabase.from('recruitments').delete().eq('id', id);
    if (error) {
      setMessage(`募集削除エラー: ${error.message}`);
    } else {
      setMessage('募集投稿を削除しました。');
      await loadAllAdminData();
    }
  };

  if (loading || !authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4F8FB] text-slate-600">
        読み込み中...
      </main>
    );
  }

  const usersById: Record<string, ProfileItem> = {};
  users.forEach((u) => {
    usersById[u.id] = u;
  });

  const eventsById: Record<string, EventItem> = {};
  events.forEach((ev) => {
    eventsById[ev.id] = ev;
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#E6F7F4] via-[#F4F8FB] to-[#F4F8FB] px-4 py-6 text-slate-800">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* 管理者ヘッダーバー */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white bg-white p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-extrabold text-[#00D69F]">
                ADMIN
              </span>
              <h1 className="text-lg font-black text-slate-900">TAG MATE 管理画面</h1>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              ログイン中：{ADMIN_EMAIL}
            </p>
          </div>

          <Link
            href="/?stay=1"
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-extrabold text-slate-700 transition hover:bg-slate-100"
          >
            一般ユーザー画面を見る &gt;
          </Link>
        </div>

        {/* サマリー統計 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-xs">
            <p className="text-[11px] font-bold text-slate-400">イベント数</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{events.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-xs">
            <p className="text-[11px] font-bold text-slate-400">募集投稿数</p>
            <p className="mt-1 text-2xl font-black text-[#00C49A]">{recruitments.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-xs">
            <p className="text-[11px] font-bold text-slate-400">登録ユーザー</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{users.length}</p>
          </div>
        </div>

        {/* 通知メッセージ */}
        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-extrabold text-emerald-800">
            {message}
          </div>
        )}

        {/* 管理メニュータブ */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`rounded-full px-5 py-2 text-xs font-extrabold transition ${
              activeTab === 'events'
                ? 'bg-[#00C49A] text-white shadow-xs'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            イベント管理（{events.length}）
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('recruitments')}
            className={`rounded-full px-5 py-2 text-xs font-extrabold transition ${
              activeTab === 'recruitments'
                ? 'bg-[#00C49A] text-white shadow-xs'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            募集一覧・削除（{recruitments.length}）
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`rounded-full px-5 py-2 text-xs font-extrabold transition ${
              activeTab === 'users'
                ? 'bg-[#00C49A] text-white shadow-xs'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            登録ユーザー一覧（{users.length}）
          </button>
        </div>

        {/* ① イベント管理タブ */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-base font-extrabold text-slate-900">
                {editingId ? 'イベントを編集' : '公式イベントを新規作成'}
              </h2>

              <form onSubmit={handleSubmitEvent} className="mt-4 space-y-4">
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

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-full bg-[#00C49A] px-6 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-[#00B38B] disabled:opacity-50"
                  >
                    {saving ? '保存中...' : editingId ? '更新する' : '新規作成する'}
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
                イベント一覧（{events.length}件）
              </h2>
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xs"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          ev.is_official
                            ? 'bg-emerald-50 text-[#00A884]'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {ev.is_official ? '公式' : 'ユーザー作成'}
                      </span>
                      <p className="text-sm font-extrabold text-slate-900">{ev.title}</p>
                    </div>
                    <p className="text-slate-500">
                      {ev.event_date || '日程未定'}
                      {ev.start_time ? ` ${ev.start_time}〜` : ''}
                      {ev.registration_end_time ? `（受付終了 ${ev.registration_end_time}）` : ''}
                      {ev.shop_name ? ` / ${ev.shop_name}` : ''}
                      {ev.entry_fee ? ` / ${ev.entry_fee}` : ''}
                    </p>
                    {ev.detail_url && (
                      <a
                        href={ev.detail_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block truncate text-[11px] font-bold text-[#00A884] underline"
                      >
                        {ev.detail_url}
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditEvent(ev)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="rounded-full bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}

        {/* ② 募集一覧・削除タブ */}
        {activeTab === 'recruitments' && (
          <section className="space-y-3">
            <h2 className="text-sm font-extrabold text-slate-700">
              すべての相方募集（{recruitments.length}件）
            </h2>
            {recruitments.length === 0 ? (
              <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center text-xs text-slate-500">
                募集投稿はまだありません。
              </div>
            ) : (
              recruitments.map((rec) => {
                const author = usersById[rec.user_id];
                const ev = rec.event_id ? eventsById[rec.event_id] : null;
                return (
                  <div
                    key={rec.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xs"
                  >
                    <div className="min-w-0 flex-1 space-y-1 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-slate-900">
                          {author?.name || '不明なユーザー'}
                        </span>
                        {author?.x_username && (
                          <span className="text-slate-400">@{author.x_username}</span>
                        )}
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-[#00A884]">
                          {ev?.title || 'イベント未定'}
                        </span>
                      </div>
                      <p className="text-slate-600">{rec.comment || '（コメントなし）'}</p>
                      <p className="text-[11px] text-slate-400">
                        投稿日時: {formatDateTime(rec.created_at)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteRecruitment(rec.id)}
                      className="shrink-0 rounded-full bg-rose-50 px-4 py-2 text-xs font-extrabold text-rose-600 hover:bg-rose-100"
                    >
                      募集を削除
                    </button>
                  </div>
                );
              })
            )}
          </section>
        )}

        {/* ③ 登録ユーザー一覧タブ（最終アクセス日時付き） */}
        {activeTab === 'users' && (
          <section className="space-y-3">
            <h2 className="text-sm font-extrabold text-slate-700">
              登録ユーザー一覧（{users.length}人）
            </h2>
            {users.length === 0 ? (
              <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center text-xs text-slate-500">
                登録ユーザーはまだいません。
              </div>
            ) : (
              users.map((u) => {
                const cleanX = u.x_username?.replace(/^@/, '') || '';
                return (
                  <div
                    key={u.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      {u.avatar_url ? (
                        <img
                          src={u.avatar_url}
                          alt={u.name}
                          className="h-11 w-11 rounded-full border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-xs font-extrabold text-[#00A884]">
                          {(u.name || 'P').slice(0, 1)}
                        </div>
                      )}

                      <div className="space-y-0.5 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-extrabold text-slate-900">{u.name}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {u.age_group || '非公開'}・{u.gender || '非公開'}
                          </span>
                          {u.area && (
                            <span className="text-[11px] text-slate-500">{u.area}</span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px]">
                          {cleanX ? (
                            <a
                              href={`https://x.com/${cleanX}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-[#00A884] underline"
                            >
                              @{cleanX}
                            </a>
                          ) : (
                            <span className="text-slate-400">X ID未登録</span>
                          )}
                          {u.experience && (
                            <span className="text-slate-500">歴: {u.experience}</span>
                          )}
                          {u.stance && <span className="text-slate-500">{u.stance}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-[11px]">
                      <p className="font-bold text-slate-700">
                        最終アクセス: {formatDateTime(u.last_active_at)}
                      </p>
                      {u.created_at && (
                        <p className="text-slate-400">
                          登録日時: {formatDateTime(u.created_at)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </section>
        )}
      </div>
    </main>
  );
}