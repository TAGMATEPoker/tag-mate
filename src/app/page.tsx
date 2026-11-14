'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Profile = {
  id: string;
  name: string;
  x_username: string | null;
  avatar_url: string | null;
  area: string | null;
  experience: string | null;
  play_type: string | null;
  stance: string | null;
  home_shop: string | null;
  target_type: string | null;
  bio: string | null;
};

type EventItem = {
  id: string;
  title: string;
  event_date: string | null;
  location: string | null;
  shop_name: string | null;
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

type ApplicationItem = {
  id: string;
  recruitment_id: string;
  applicant_id: string;
  status: 'pending' | 'matched' | 'rejected';
  created_at: string;
};

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [recruitments, setRecruitments] = useState<RecruitmentItem[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, Profile>>({});
  const [applications, setApplications] = useState<ApplicationItem[]>([]);

  // 募集フォームの開閉状態
  const [showRecruitmentForm, setShowRecruitmentForm] = useState(false);

  // 新規募集フォーム
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventShop, setNewEventShop] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    setUserId(user.id);

    const [
      { data: profileData },
      { data: eventsData },
      { data: recruitmentsData },
      { data: allProfiles },
      { data: appsData },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('events').select('*').order('event_date', { ascending: true, nullsFirst: false }),
      supabase.from('recruitments').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*'),
      supabase.from('applications').select('*').order('created_at', { ascending: false }),
    ]);

    setMyProfile(profileData || null);
    setEvents(eventsData || []);
    setRecruitments(recruitmentsData || []);
    setApplications(appsData || []);

    const map: Record<string, Profile> = {};
    (allProfiles || []).forEach((p: Profile) => {
      map[p.id] = p;
    });
    setProfilesMap(map);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 新規募集の投稿
  const handleCreateRecruitment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!myProfile) {
      setNotice('先にプロフィールを保存してください。');
      return;
    }

    setSubmitting(true);
    setNotice('');

    let eventIdToUse: string | null = selectedEventId || null;

    if (!eventIdToUse && newEventTitle.trim()) {
      const { data: createdEvent, error: eventError } = await supabase
        .from('events')
        .insert({
          title: newEventTitle.trim(),
          event_date: newEventDate || null,
          shop_name: newEventShop.trim() || null,
          is_official: false,
          created_by: userId,
        })
        .select()
        .single();

      if (eventError) {
        setNotice(`イベント作成エラー: ${eventError.message}`);
        setSubmitting(false);
        return;
      }
      eventIdToUse = createdEvent.id;
    }

    const { error: recError } = await supabase.from('recruitments').insert({
      event_id: eventIdToUse,
      user_id: userId,
      comment: comment.trim() || 'タッグ戦の相方を募集しています！',
      status: 'open',
    });

    setSubmitting(false);

    if (recError) {
      setNotice(`投稿エラー: ${recError.message}`);
      return;
    }

    setNewEventTitle('');
    setNewEventDate('');
    setNewEventShop('');
    setComment('');
    setSelectedEventId('');
    setShowRecruitmentForm(false);
    setNotice('相方募集を投稿しました！');
    await loadData();
  };

  // 「気になる」送信
  const handleApply = async (recruitmentId: string) => {
    if (!userId) return;
    setNotice('');

    const { error } = await supabase.from('applications').insert({
      recruitment_id: recruitmentId,
      applicant_id: userId,
      status: 'pending',
    });

    if (error) {
      setNotice(`送信エラー: ${error.message}`);
    } else {
      setNotice('「気になる」を送信しました！');
      await loadData();
    }
  };

  // マッチ承認（募集主が応募を承認）
  const handleMatchStatus = async (applicationId: string, status: 'matched' | 'rejected') => {
    setNotice('');
    const { error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', applicationId);

    if (error) {
      setNotice(`更新エラー: ${error.message}`);
    } else {
      setNotice(status === 'matched' ? 'マッチング成立！X IDが共有されました。' : '辞退しました。');
      await loadData();
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        読み込み中...
      </main>
    );
  }

  const eventsById: Record<string, EventItem> = {};
  events.forEach((ev) => {
    eventsById[ev.id] = ev;
  });

  // 自分が関わっているマッチ成立一覧
  const matchedApplications = applications.filter((app) => {
    if (app.status !== 'matched') return false;
    const rec = recruitments.find((r) => r.id === app.recruitment_id);
    return app.applicant_id === userId || rec?.user_id === userId;
  });

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* ヘッダー */}
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div>
            <h1 className="text-xl font-bold text-emerald-400">TAG MATE</h1>
            <p className="text-xs text-zinc-400">
              ポーカータッグ戦の相方探し専用（出会い目的禁止）
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-zinc-300">
              {myProfile ? `${myProfile.name} さん` : 'プロフィール未設定'}
            </span>
            <button
              type="button"
              onClick={() => setShowRecruitmentForm((prev) => !prev)}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400"
            >
              {showRecruitmentForm ? '募集フォームを閉じる' : '相方を募集する'}
            </button>
            <Link
              href="/profile"
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold hover:bg-zinc-700"
            >
              プロフィール編集
            </Link>
          </div>
        </header>

        {notice && (
          <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/60 px-4 py-3 text-xs text-emerald-300">
            {notice}
          </div>
        )}

        {!myProfile && (
          <div className="rounded-xl border border-amber-700/50 bg-amber-950/50 p-4 text-xs text-amber-200">
            募集の投稿や「気になる」送信を行う前に、「プロフィール編集」からプロフィールを保存してください。
          </div>
        )}

        {/* マッチ成立（X ID共有）エリア */}
        {matchedApplications.length > 0 && (
          <section className="rounded-2xl border border-emerald-700/50 bg-zinc-900 p-5">
            <h2 className="text-sm font-bold text-emerald-400">マッチング成立（連絡先共有）</h2>
            <div className="mt-3 space-y-3">
              {matchedApplications.map((app) => {
                const rec = recruitments.find((r) => r.id === app.recruitment_id);
                const partnerId =
                  app.applicant_id === userId ? rec?.user_id : app.applicant_id;
                const partner = partnerId ? profilesMap[partnerId] : null;
                const ev = rec?.event_id ? eventsById[rec.event_id] : null;

                return (
                  <div
                    key={app.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-white">
                        相手：{partner?.name || 'ユーザー'}
                      </p>
                      <p className="text-zinc-400">
                        対象イベント：{ev?.title || 'イベント未定'}
                      </p>
                    </div>
                    {partner?.x_username ? (
                      <a
                        href={`https://x.com/${partner.x_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-emerald-500 px-3 py-2 font-semibold text-zinc-950 hover:bg-emerald-400"
                      >
                        X (@{partner.x_username}) で連絡する
                      </a>
                    ) : (
                      <span className="text-zinc-500">X ID未登録</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 新規相方募集フォーム（ボタンを押したときだけ表示） */}
        {showRecruitmentForm && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-white">相方募集を投稿する</h2>
              <button
                type="button"
                onClick={() => setShowRecruitmentForm(false)}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
              >
                閉じる
              </button>
            </div>
            <form onSubmit={handleCreateRecruitment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs text-zinc-300">既存イベントから選択（任意）</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                >
                  <option value="">イベント未定 / 下で新しく入力</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} {ev.event_date ? `(${ev.event_date})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedEventId && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="イベント名（未定なら空欄可）"
                    className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  />
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={newEventShop}
                    onChange={(e) => setNewEventShop(e.target.value)}
                    placeholder="開催店舗・場所（任意）"
                    className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-zinc-300">募集コメント</label>
                <textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="例：日曜のタッグ戦に出られる相方を探しています！"
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {submitting ? '投稿中...' : '募集を投稿'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecruitmentForm(false)}
                  className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </section>
        )}

        {/* 募集一覧 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-white">
              相方募集一覧（{recruitments.length}件）
            </h2>
            {!showRecruitmentForm && (
              <button
                type="button"
                onClick={() => setShowRecruitmentForm(true)}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400"
              >
                相方を募集する
              </button>
            )}
          </div>

          {recruitments.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center text-xs text-zinc-400">
              まだ募集がありません。「相方を募集する」ボタンから最初の募集を投稿してみましょう。
            </div>
          ) : (
            recruitments.map((rec) => {
              const author = profilesMap[rec.user_id];
              const ev = rec.event_id ? eventsById[rec.event_id] : null;
              const isMine = rec.user_id === userId;

              const myApp = applications.find(
                (a) => a.recruitment_id === rec.id && a.applicant_id === userId
              );
              const incomingApps = isMine
                ? applications.filter((a) => a.recruitment_id === rec.id)
                : [];

              return (
                <article
                  key={rec.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="inline-block rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-emerald-300">
                        {ev ? ev.title : 'イベント未定'}
                        {ev?.event_date ? ` / ${ev.event_date}` : ''}
                        {ev?.shop_name ? ` / ${ev.shop_name}` : ''}
                      </span>
                      <h3 className="mt-2 text-base font-bold text-white">
                        {author?.name || 'プレイヤー'}
                        {isMine && (
                          <span className="ml-2 rounded bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
                            自分の募集
                          </span>
                        )}
                      </h3>
                    </div>

                    {!isMine && (
                      <div>
                        {myApp ? (
                          <span className="rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-300">
                            {myApp.status === 'matched'
                              ? 'マッチ成立'
                              : myApp.status === 'rejected'
                              ? '見送り'
                              : '気になる送信済み'}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApply(rec.id)}
                            className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-zinc-200"
                          >
                            気になる
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {author && (
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-300">
                      {author.area && (
                        <span className="rounded bg-zinc-950 px-2 py-1">地域: {author.area}</span>
                      )}
                      {author.experience && (
                        <span className="rounded bg-zinc-950 px-2 py-1">歴: {author.experience}</span>
                      )}
                      {author.play_type && (
                        <span className="rounded bg-zinc-950 px-2 py-1">
                          タイプ: {author.play_type}
                        </span>
                      )}
                      {author.stance && (
                        <span className="rounded bg-zinc-950 px-2 py-1">
                          スタイル: {author.stance}
                        </span>
                      )}
                      {author.home_shop && (
                        <span className="rounded bg-zinc-950 px-2 py-1">
                          店舗: {author.home_shop}
                        </span>
                      )}
                    </div>
                  )}

                  {rec.comment && (
                    <p className="mt-3 rounded-xl bg-zinc-950 p-3 text-sm text-zinc-200">
                      {rec.comment}
                    </p>
                  )}

                  {author?.bio && (
                    <p className="mt-2 text-xs text-zinc-400">自己紹介: {author.bio}</p>
                  )}

                  {/* 自分の募集に届いた「気になる」一覧 */}
                  {isMine && incomingApps.length > 0 && (
                    <div className="mt-4 border-t border-zinc-800 pt-3">
                      <p className="text-xs font-semibold text-zinc-300">
                        届いた「気になる」（{incomingApps.length}件）
                      </p>
                      <div className="mt-2 space-y-2">
                        {incomingApps.map((app) => {
                          const applicant = profilesMap[app.applicant_id];
                          return (
                            <div
                              key={app.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-zinc-950 px-3 py-2 text-xs"
                            >
                              <div>
                                <span className="font-semibold text-white">
                                  {applicant?.name || 'ユーザー'}
                                </span>
                                <span className="ml-2 text-zinc-400">
                                  ({applicant?.area} / {applicant?.experience} / {applicant?.play_type})
                                </span>
                              </div>
                              {app.status === 'pending' ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleMatchStatus(app.id, 'matched')}
                                    className="rounded bg-emerald-500 px-2.5 py-1 font-semibold text-zinc-950 hover:bg-emerald-400"
                                  >
                                    マッチ成立
                                  </button>
                                  <button
                                    onClick={() => handleMatchStatus(app.id, 'rejected')}
                                    className="rounded bg-zinc-800 px-2.5 py-1 text-zinc-300 hover:bg-zinc-700"
                                  >
                                    見送り
                                  </button>
                                </div>
                              ) : (
                                <span className="text-zinc-400">
                                  {app.status === 'matched' ? 'マッチ成立済み' : '見送り済み'}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}