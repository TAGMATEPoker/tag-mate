'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Profile = {
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

  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [filterEventId, setFilterEventId] = useState<string | null>(null);
  const [expandedProfileIds, setExpandedProfileIds] = useState<Record<string, boolean>>({});

  const [showRecruitmentForm, setShowRecruitmentForm] = useState(false);

  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventShop, setNewEventShop] = useState('');
  const [newEventFee, setNewEventFee] = useState('');
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

    if (
      !eventIdToUse &&
      (newEventTitle.trim() || newEventFee.trim() || newEventShop.trim() || newEventDate)
    ) {
      const { data: createdEvent, error: eventError } = await supabase
        .from('events')
        .insert({
          title: newEventTitle.trim() || 'イベント未定',
          event_date: newEventDate || null,
          shop_name: newEventShop.trim() || null,
          entry_fee: newEventFee.trim() || null,
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
    setNewEventFee('');
    setComment('');
    setSelectedEventId('');
    setShowRecruitmentForm(false);
    setNotice('相方募集を投稿しました！');
    await loadData();
  };

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

  const handleOpenFormForEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setShowRecruitmentForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleEventRecruitments = (eventId: string) => {
    setExpandedEventId((prev) => (prev === eventId ? null : eventId));
  };

  const toggleProfileDetail = (recruitmentId: string) => {
    setExpandedProfileIds((prev) => ({
      ...prev,
      [recruitmentId]: !prev[recruitmentId],
    }));
  };

  const formatShortPlayType = (playType: string | null) => {
    if (!playType) return null;
    // 「TAG（タイトアグレッシブ）」→「TAG」のように短縮表示
    const match = playType.match(/^([A-Z]+)/);
    return match ? match[1] : playType;
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

  const officialEvents = events.filter((ev) => ev.is_official);

  const matchedApplications = applications.filter((app) => {
    if (app.status !== 'matched') return false;
    const rec = recruitments.find((r) => r.id === app.recruitment_id);
    return app.applicant_id === userId || rec?.user_id === userId;
  });

  const visibleRecruitments = filterEventId
    ? recruitments.filter((r) => r.event_id === filterEventId)
    : recruitments;

  const renderRecruitmentCard = (rec: RecruitmentItem) => {
    const author = profilesMap[rec.user_id];
    const ev = rec.event_id ? eventsById[rec.event_id] : null;
    const isMine = rec.user_id === userId;
    const isProfileOpen = Boolean(expandedProfileIds[rec.id]);

    const myApp = applications.find(
      (a) => a.recruitment_id === rec.id && a.applicant_id === userId
    );
    const incomingApps = isMine
      ? applications.filter((a) => a.recruitment_id === rec.id)
      : [];

    const ageLabel = author?.age_group || '非公開';
    const genderLabel = author?.gender || '非公開';

    return (
      <article
        key={rec.id}
        className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
      >
        {/* イベントバッジ */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-block rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-emerald-300">
            {ev?.is_official ? '公式 / ' : ''}
            {ev ? ev.title : 'イベント未定'}
            {ev?.event_date ? ` / ${ev.event_date}` : ''}
            {ev?.shop_name ? ` / ${ev.shop_name}` : ''}
          </span>
          {ev?.entry_fee && (
            <span className="inline-block rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-amber-300">
              参加費: {ev.entry_fee}
            </span>
          )}
        </div>

        {/* 投稿者ヘッダー（アイコン + 名前 + 年齢・性別ピル + 詳細開閉） */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {author?.avatar_url ? (
              <img
                src={author.avatar_url}
                alt={author.name}
                className="h-11 w-11 shrink-0 rounded-full border border-zinc-700 object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-bold text-zinc-300">
                {(author?.name || 'P').slice(0, 1)}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-bold text-white">
                  {author?.name || 'プレイヤー'}
                </h3>
                <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
                  {ageLabel}・{genderLabel}
                </span>
                {isMine && (
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                    自分
                  </span>
                )}
              </div>

              {/* スタイリッシュな1行ステータスバー（歴・タイプ・スタイル・求める相手） */}
              {author && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                  {author.experience && (
                    <span className="rounded-md bg-zinc-800/90 px-2 py-0.5 text-zinc-200">
                      歴 {author.experience}
                    </span>
                  )}
                  {author.play_type && (
                    <span className="rounded-md bg-zinc-800/90 px-2 py-0.5 text-emerald-300">
                      {formatShortPlayType(author.play_type)}
                    </span>
                  )}
                  {author.stance && (
                    <span className="rounded-md bg-zinc-800/90 px-2 py-0.5 text-zinc-200">
                      {author.stance}
                    </span>
                  )}
                  {author.target_type && (
                    <span className="rounded-md border border-emerald-500/30 bg-emerald-950/40 px-2 py-0.5 text-emerald-200">
                      希望: {author.target_type}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {author && (
            <button
              type="button"
              onClick={() => toggleProfileDetail(rec.id)}
              className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800"
            >
              {isProfileOpen ? '閉じる ▲' : '詳細 ▾'}
            </button>
          )}
        </div>

        {/* 詳細プロフィール（クリック時のみ展開） */}
        {author && isProfileOpen && (
          <div className="mt-3 space-y-2 rounded-xl border border-zinc-800 bg-zinc-950/90 p-3.5 text-xs text-zinc-300">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div>
                <span className="text-[10px] text-zinc-500">年齢 / 性別</span>
                <p className="font-medium text-zinc-200">
                  {ageLabel} / {genderLabel}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500">ポーカー歴</span>
                <p className="font-medium text-zinc-200">{author.experience || '未設定'}</p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500">タイプ</span>
                <p className="font-medium text-zinc-200">{author.play_type || '未設定'}</p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500">スタイル</span>
                <p className="font-medium text-zinc-200">{author.stance || '未設定'}</p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500">求める相手</span>
                <p className="font-medium text-zinc-200">{author.target_type || '未設定'}</p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500">活動地域</span>
                <p className="font-medium text-zinc-200">{author.area || '未設定'}</p>
              </div>
            </div>
            {author.home_shop && (
              <p className="border-t border-zinc-800/80 pt-2 text-[11px] text-zinc-400">
                よくいく店舗: <span className="text-zinc-200">{author.home_shop}</span>
              </p>
            )}
            {author.bio && (
              <p className="border-t border-zinc-800/80 pt-2 text-[11px] leading-relaxed text-zinc-300">
                {author.bio}
              </p>
            )}
          </div>
        )}

        {/* 募集コメント */}
        {rec.comment && (
          <p className="mt-3 rounded-xl bg-zinc-950 p-3 text-sm text-zinc-200">
            {rec.comment}
          </p>
        )}

        {/* アクションバー */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800/90 bg-zinc-950/90 px-4 py-3">
          <span className="text-xs text-zinc-400">
            {isMine
              ? 'あなたの募集投稿です'
              : myApp
              ? '応募ステータス'
              : '相方候補なら「気になる」を送れます'}
          </span>

          {!isMine && (
            <div>
              {myApp ? (
                <span
                  className={`inline-block rounded-xl px-4 py-2 text-xs font-bold ${
                    myApp.status === 'matched'
                      ? 'bg-emerald-500 text-zinc-950'
                      : myApp.status === 'rejected'
                      ? 'bg-zinc-800 text-zinc-400'
                      : 'border border-amber-400/50 bg-amber-400/15 text-amber-300'
                  }`}
                >
                  {myApp.status === 'matched'
                    ? '✓ マッチ成立'
                    : myApp.status === 'rejected'
                    ? '見送り'
                    : '★ 気になる送信済み'}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleApply(rec.id)}
                  className="rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-extrabold tracking-wide text-zinc-950 shadow-sm hover:bg-amber-300"
                >
                  ★ 気になるを送る
                </button>
              )}
            </div>
          )}
        </div>

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
                        ({applicant?.age_group || '非公開'}・{applicant?.gender || '非公開'} /{' '}
                        {applicant?.experience} / {formatShortPlayType(applicant?.play_type || null)})
                      </span>
                    </div>
                    {app.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleMatchStatus(app.id, 'matched')}
                          className="rounded bg-emerald-500 px-2.5 py-1 font-semibold text-zinc-950 hover:bg-emerald-400"
                        >
                          マッチ成立
                        </button>
                        <button
                          type="button"
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
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* ユーザー＆募集アクションバー */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4">
          <div className="flex items-center gap-3">
            {myProfile?.avatar_url && (
              <img
                src={myProfile.avatar_url}
                alt={myProfile.name}
                className="h-9 w-9 rounded-full border border-zinc-700 object-cover"
              />
            )}
            <span className="text-xs font-semibold text-zinc-200">
              {myProfile ? `${myProfile.name} さん` : 'プロフィール未設定'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowRecruitmentForm((prev) => !prev)}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400"
          >
            {showRecruitmentForm ? '募集フォームを閉じる' : '相方を募集する'}
          </button>
        </div>

        {notice && (
          <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/60 px-4 py-3 text-xs text-emerald-300">
            {notice}
          </div>
        )}

        {!myProfile && (
          <div className="rounded-xl border border-amber-700/50 bg-amber-950/50 p-4 text-xs text-amber-200">
            募集の投稿や「気になる」送信を行う前に、上部メニューの「プロフィール編集」からプロフィールを保存してください。
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

        {/* 新規相方募集フォーム */}
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
                      {ev.is_official ? '【公式】' : ''}
                      {ev.title}
                      {ev.event_date ? ` (${ev.event_date})` : ''}
                      {ev.entry_fee ? ` / 参加費: ${ev.entry_fee}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedEventId && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-zinc-300">イベント名（未定なら空欄可）</label>
                    <input
                      type="text"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder="イベント名"
                      className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-300">開催日（カレンダーから選択）</label>
                    <input
                      type="date"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-300">開催店舗・場所（任意）</label>
                    <input
                      type="text"
                      value={newEventShop}
                      onChange={(e) => setNewEventShop(e.target.value)}
                      placeholder="店舗名・エリア"
                      className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-300">参加費（任意）</label>
                    <input
                      type="text"
                      value={newEventFee}
                      onChange={(e) => setNewEventFee(e.target.value)}
                      placeholder="例：5,000円 / 1ペア 8,000円"
                      className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                    />
                  </div>
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

        {/* イベント一覧 */}
        <section className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-white">
              イベント一覧（{officialEvents.length}件）
            </h2>
            <span className="text-[11px] text-zinc-400">公式イベント</span>
          </div>

          {officialEvents.length === 0 ? (
            <p className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-400">
              登録済みの公式イベントはまだありません。
            </p>
          ) : (
            <div className="space-y-3">
              {officialEvents.map((ev) => {
                const relatedRecruitments = recruitments.filter((r) => r.event_id === ev.id);
                const isExpanded = expandedEventId === ev.id;

                return (
                  <div
                    key={ev.id}
                    className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-emerald-950 px-2 py-0.5 text-[11px] text-emerald-300">
                            公式
                          </span>
                          <span className="text-sm font-bold text-white">{ev.title}</span>
                          {ev.entry_fee && (
                            <span className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] text-amber-300">
                              参加費: {ev.entry_fee}
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-400">
                          {ev.event_date || '日程未定'}
                          {ev.shop_name ? ` / ${ev.shop_name}` : ''}
                          {ev.location ? ` / ${ev.location}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleEventRecruitments(ev.id)}
                          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
                        >
                          {isExpanded ? '閉じる' : `募集を見る（${relatedRecruitments.length}）`}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenFormForEvent(ev.id)}
                          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400"
                        >
                          募集する
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="space-y-3 border-t border-zinc-800 pt-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-emerald-300">
                            「{ev.title}」の募集一覧（{relatedRecruitments.length}件）
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setFilterEventId(ev.id);
                              document
                                .getElementById('recruitment-list-section')
                                ?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="text-[11px] text-amber-300 underline hover:text-amber-200"
                          >
                            下の募集一覧でも絞り込む
                          </button>
                        </div>

                        {relatedRecruitments.length === 0 ? (
                          <p className="rounded-lg bg-zinc-900 p-3 text-xs text-zinc-400">
                            このイベントの募集はまだありません。
                          </p>
                        ) : (
                          relatedRecruitments.map((rec) => renderRecruitmentCard(rec))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 募集一覧 */}
        <section id="recruitment-list-section" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-white">
                相方募集一覧（{visibleRecruitments.length}件）
              </h2>
              {filterEventId && (
                <button
                  type="button"
                  onClick={() => setFilterEventId(null)}
                  className="rounded-lg border border-amber-400/50 bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-400/25"
                >
                  絞り込み解除（{eventsById[filterEventId]?.title || 'イベント'}）×
                </button>
              )}
            </div>
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

          {visibleRecruitments.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center text-xs text-zinc-400">
              {filterEventId
                ? '選択したイベントの募集はまだありません。'
                : 'まだ募集がありません。「相方を募集する」ボタンから最初の募集を投稿してみましょう。'}
            </div>
          ) : (
            visibleRecruitments.map((rec) => renderRecruitmentCard(rec))
          )}
        </section>
      </div>
    </main>
  );
}