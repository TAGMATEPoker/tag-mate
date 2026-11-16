'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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

type ApplicationItem = {
  id: string;
  recruitment_id: string;
  applicant_id: string;
  status: 'pending' | 'matched' | 'rejected';
  created_at: string;
};

type NoticeState = {
  text: string;
  href?: string;
} | null;

type ListTab = 'all' | 'mine' | 'applied';

function formatJapaneseDateHeader(dateStr: string | null): string {
  if (!dateStr) return '日程未定';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const d = new Date(year, month - 1, day);
  if (Number.isNaN(d.getTime())) return dateStr;
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${month}/${day} (${weekdays[d.getDay()]})`;
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [recruitments, setRecruitments] = useState<RecruitmentItem[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, Profile>>({});
  const [applications, setApplications] = useState<ApplicationItem[]>([]);

  const [activeTab, setActiveTab] = useState<ListTab>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [filterEventId, setFilterEventId] = useState<string | null>(null);
  const [expandedProfileIds, setExpandedProfileIds] = useState<Record<string, boolean>>({});

  const [showRecruitmentForm, setShowRecruitmentForm] = useState(false);

  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventStartTime, setNewEventStartTime] = useState('');
  const [newEventRegEndTime, setNewEventRegEndTime] = useState('');
  const [newEventDetailUrl, setNewEventDetailUrl] = useState('');
  const [newEventShop, setNewEventShop] = useState('');
  const [newEventFee, setNewEventFee] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'mine' || tabParam === 'applied' || tabParam === 'all') {
      setActiveTab(tabParam);
      setFilterEventId(null);
      if (tabParam === 'mine' || tabParam === 'applied') {
        setTimeout(() => {
          document
            .getElementById('recruitment-list-section')
            ?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [searchParams]);

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    setUserId(user.id);

    // 最終アクセス日時を自動記録
    await supabase
      .from('profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.id);

    // 管理者アカウントはデフォルトで管理画面へ遷移（?stay=1 の場合は一般画面を表示）
    if (user.email === 'tagmate.info@gmail.com' && searchParams.get('stay') !== '1') {
      router.replace('/admin');
      return;
    }

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
      setNotice({ text: '先にプロフィールを保存してください。' });
      return;
    }

    setSubmitting(true);
    setNotice(null);

    let eventIdToUse: string | null = selectedEventId || null;

    if (
      !eventIdToUse &&
      (newEventTitle.trim() ||
        newEventFee.trim() ||
        newEventShop.trim() ||
        newEventDate ||
        newEventStartTime ||
        newEventRegEndTime ||
        newEventDetailUrl.trim())
    ) {
      const { data: createdEvent, error: eventError } = await supabase
        .from('events')
        .insert({
          title: newEventTitle.trim() || 'イベント未定',
          event_date: newEventDate || null,
          start_time: newEventStartTime || null,
          registration_end_time: newEventRegEndTime || null,
          detail_url: newEventDetailUrl.trim() || null,
          shop_name: newEventShop.trim() || null,
          entry_fee: newEventFee.trim() || null,
          is_official: false,
          created_by: userId,
        })
        .select()
        .single();

      if (eventError) {
        setNotice({ text: `イベント作成エラー: ${eventError.message}` });
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
      setNotice({ text: `投稿エラー: ${recError.message}` });
      return;
    }

    setNewEventTitle('');
    setNewEventDate('');
    setNewEventStartTime('');
    setNewEventRegEndTime('');
    setNewEventDetailUrl('');
    setNewEventShop('');
    setNewEventFee('');
    setComment('');
    setSelectedEventId('');
    setShowRecruitmentForm(false);
    setNotice({ text: '相方募集を投稿しました！' });
    await loadData();
  };

  const handleApply = async (recruitmentId: string) => {
    if (!userId) return;
    setNotice(null);

    const { error } = await supabase.from('applications').insert({
      recruitment_id: recruitmentId,
      applicant_id: userId,
      status: 'pending',
    });

    if (error) {
      setNotice({ text: `送信エラー: ${error.message}` });
    } else {
      setNotice({ text: '「気になる」を送信しました！' });
      await loadData();
    }
  };

  const handleMatchStatus = async (applicationId: string, status: 'matched' | 'rejected') => {
    setNotice(null);
    const { error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', applicationId);

    if (error) {
      setNotice({ text: `更新エラー: ${error.message}` });
    } else if (status === 'matched') {
      setNotice({
        text: 'マッチングが成立！XのIDが共有されました。（タップして成立ページへ）',
        href: '/matches',
      });
      await loadData();
    } else {
      setNotice({ text: '辞退しました。' });
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
    const match = playType.match(/^([A-Z]+)/);
    return match ? match[1] : playType;
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4F8FB] text-slate-600">
        読み込み中...
      </main>
    );
  }

  const eventsById: Record<string, EventItem> = {};
  events.forEach((ev) => {
    eventsById[ev.id] = ev;
  });

  const keyword = searchKeyword.trim().toLowerCase();

  // 公式イベント検索＆日付ごとグループ化
  const officialEvents = events.filter((ev) => {
    if (!ev.is_official) return false;
    if (!keyword) return true;
    return (
      ev.title.toLowerCase().includes(keyword) ||
      (ev.shop_name || '').toLowerCase().includes(keyword) ||
      (ev.location || '').toLowerCase().includes(keyword)
    );
  });

  const groupedEventsByDate: { dateKey: string; label: string; items: EventItem[] }[] = [];
  officialEvents.forEach((ev) => {
    const key = ev.event_date || 'unscheduled';
    const existing = groupedEventsByDate.find((g) => g.dateKey === key);
    if (existing) {
      existing.items.push(ev);
    } else {
      groupedEventsByDate.push({
        dateKey: key,
        label: formatJapaneseDateHeader(ev.event_date),
        items: [ev],
      });
    }
  });

  const matchedApplications = applications.filter((app) => {
    if (app.status !== 'matched') return false;
    const rec = recruitments.find((r) => r.id === app.recruitment_id);
    return app.applicant_id === userId || rec?.user_id === userId;
  });

  const myRecruitments = recruitments.filter((r) => r.user_id === userId);
  const myAppliedRecruitmentIds = new Set(
    applications.filter((a) => a.applicant_id === userId).map((a) => a.recruitment_id)
  );
  const appliedRecruitments = recruitments.filter((r) => myAppliedRecruitmentIds.has(r.id));

  const tabFilteredRecruitments =
    activeTab === 'mine'
      ? myRecruitments
      : activeTab === 'applied'
      ? appliedRecruitments
      : recruitments;

  const visibleRecruitments = tabFilteredRecruitments.filter((r) => {
    if (filterEventId && r.event_id !== filterEventId) return false;
    if (!keyword) return true;
    const author = profilesMap[r.user_id];
    const ev = r.event_id ? eventsById[r.event_id] : null;
    return (
      (author?.name || '').toLowerCase().includes(keyword) ||
      (author?.area || '').toLowerCase().includes(keyword) ||
      (ev?.title || '').toLowerCase().includes(keyword) ||
      (r.comment || '').toLowerCase().includes(keyword)
    );
  });

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
        className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.05)]"
      >
        {/* 対象イベントピル */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-[#00A884]">
            <span>📅</span>
            <span>
              {ev ? ev.title : 'イベント未定'}
              {ev?.event_date ? ` (${formatJapaneseDateHeader(ev.event_date)})` : ''}
              {ev?.start_time ? ` ${ev.start_time}〜` : ''}
            </span>
          </span>
          {ev?.entry_fee && (
            <span className="inline-block rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
              参加費: {ev.entry_fee}
            </span>
          )}
        </div>

        {/* 投稿者ヘッダー */}
        <div className="mt-3.5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {author?.avatar_url ? (
              <img
                src={author.avatar_url}
                alt={author.name}
                className="h-12 w-12 shrink-0 rounded-full border-2 border-emerald-100 object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#00D09C] to-[#00A884] text-sm font-black text-white shadow-sm">
                {(author?.name || 'P').slice(0, 1)}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-extrabold text-slate-900">
                  {author?.name || 'プレイヤー'}
                </h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                  {ageLabel}・{genderLabel}
                </span>
                {isMine && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    自分
                  </span>
                )}
              </div>

              {/* ハッシュタグ風ステータスバッジ（添付3枚目風） */}
              {author && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                  {author.experience && (
                    <span className="rounded-full bg-indigo-50/80 px-2.5 py-0.5 text-indigo-600">
                      #歴{author.experience}
                    </span>
                  )}
                  {author.play_type && (
                    <span className="rounded-full bg-indigo-50/80 px-2.5 py-0.5 text-indigo-600">
                      #{formatShortPlayType(author.play_type)}
                    </span>
                  )}
                  {author.stance && (
                    <span className="rounded-full bg-indigo-50/80 px-2.5 py-0.5 text-indigo-600">
                      #{author.stance}
                    </span>
                  )}
                  {author.target_type && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[#00A884]">
                      #{author.target_type}
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
              className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-100"
            >
              {isProfileOpen ? '閉じる ▲' : '詳細 ▾'}
            </button>
          )}
        </div>

        {/* 開閉式詳細プロフィール（添付3枚目の情報カード風） */}
        {author && isProfileOpen && (
          <div className="mt-3.5 space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50/90 p-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
              <span className="font-bold text-slate-500">♠ プレイスタイル</span>
              <span className="font-extrabold text-slate-800">
                {author.play_type || '未設定'} / {author.stance || '未設定'}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
              <span className="font-bold text-slate-500">📍 活動エリア</span>
              <span className="font-extrabold text-slate-800">
                {author.area || '未設定'}
                {author.home_shop ? `（${author.home_shop}）` : ''}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-500">🤝 求める相手</span>
              <span className="font-extrabold text-[#00A884]">
                {author.target_type || '未設定'}
              </span>
            </div>
            {author.bio && (
              <p className="mt-2 rounded-xl bg-white p-3 text-[11px] leading-relaxed text-slate-600">
                {author.bio}
              </p>
            )}
          </div>
        )}

        {/* 募集コメント */}
        {rec.comment && (
          <p className="mt-3.5 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
            {rec.comment}
          </p>
        )}

        {/* アクションバー */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-1">
          <span className="text-xs font-medium text-slate-400">
            {isMine
              ? `届いた「気になる」: ${incomingApps.length}件`
              : myApp
              ? '応募ステータス'
              : '一緒に参加したい相手なら送信'}
          </span>

          {!isMine && (
            <div>
              {myApp ? (
                <span
                  className={`inline-block rounded-full px-4 py-2 text-xs font-extrabold ${
                    myApp.status === 'matched'
                      ? 'bg-[#00C49A] text-white shadow-sm'
                      : myApp.status === 'rejected'
                      ? 'bg-slate-100 text-slate-400'
                      : 'border border-amber-300 bg-amber-50 text-amber-700'
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
                  className="rounded-full bg-gradient-to-r from-[#00D69F] to-[#00B88D] px-6 py-2.5 text-xs font-extrabold text-white shadow-[0_4px_14px_rgba(0,196,154,0.35)] transition hover:opacity-95 active:scale-[0.99]"
                >
                  気になるを送る &gt;
                </button>
              )}
            </div>
          )}
        </div>

        {/* 自分の募集に届いた「気になる」一覧 */}
        {isMine && incomingApps.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="text-xs font-bold text-slate-600">
              届いた「気になる」（{incomingApps.length}件）
            </p>
            <div className="mt-2 space-y-2">
              {incomingApps.map((app) => {
                const applicant = profilesMap[app.applicant_id];
                return (
                  <div
                    key={app.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">
                        {applicant?.name || 'ユーザー'}
                      </span>
                      <span className="ml-2 text-slate-500">
                        ({applicant?.age_group || '非公開'}・{applicant?.gender || '非公開'} /{' '}
                        {applicant?.experience} / {formatShortPlayType(applicant?.play_type || null)})
                      </span>
                    </div>
                    {app.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleMatchStatus(app.id, 'matched')}
                          className="rounded-full bg-[#00C49A] px-3.5 py-1.5 font-bold text-white shadow-sm hover:bg-[#00B38B]"
                        >
                          マッチ成立
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMatchStatus(app.id, 'rejected')}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          見送り
                        </button>
                      </div>
                    ) : (
                      <span className="font-bold text-[#00A884]">
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
    <main className="min-h-screen bg-gradient-to-b from-[#E6F7F4] via-[#F4F8FB] to-[#F4F8FB] px-4 py-6 text-slate-800">
      <div className="mx-auto max-w-2xl space-y-7">
        {/* ヒーローセクション（添付1枚目風） */}
        <section className="relative overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-br from-[#EAFBF6] via-white to-[#EEF5FF] p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-600 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-[#00C49A]" />
              {myProfile ? `${myProfile.name} さんログイン中` : 'プロフィール未設定'}
            </span>
            <Link
              href="/matches"
              className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-[#00A884] shadow-xs hover:bg-white"
            >
              マッチ一覧 ({matchedApplications.length}) &gt;
            </Link>
          </div>

          <div className="mt-4">
            <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-3xl">
              ポーカーの
              <br />
              <span className="text-[#00C49A]">相方</span>を見つけよう！
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              イベントで一緒に楽しめるパートナーが見つかるマッチングサービス
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="#event-list-section"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#00D69F] to-[#00B88D] px-5 py-3 text-sm font-extrabold text-white shadow-[0_6px_18px_rgba(0,196,154,0.35)] transition hover:opacity-95"
            >
              <span>🔍 イベントを探す</span>
            </a>
            <button
              type="button"
              onClick={() => setShowRecruitmentForm((prev) => !prev)}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-extrabold text-[#00A884] shadow-sm transition hover:bg-emerald-50"
            >
              <span>＋ 相方を募集</span>
            </button>
          </div>
        </section>

        {/* 検索バー（添付2枚目風） */}
        <div className="relative">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="イベント・店舗・エリアで検索..."
            className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 shadow-xs outline-none placeholder:text-slate-400 focus:border-[#00C49A]"
          />
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
        </div>

        {/* 通知バナー */}
        {notice &&
          (notice.href ? (
            <Link
              href={notice.href}
              className="block rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-extrabold text-emerald-800 shadow-sm transition hover:bg-emerald-100"
            >
              {notice.text}
            </Link>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
              {notice.text}
            </div>
          ))}

        {!myProfile && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
            募集の投稿や「気になる」送信を行う前に、右上メニューの「プロフィール編集」からプロフィールを保存してください。
          </div>
        )}

        {/* 新規相方募集フォーム */}
        {showRecruitmentForm && (
          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-md">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-slate-900">相方募集を投稿する</h2>
              <button
                type="button"
                onClick={() => setShowRecruitmentForm(false)}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                閉じる
              </button>
            </div>
            <form onSubmit={handleCreateRecruitment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600">
                  既存イベントから選択（任意）
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800"
                >
                  <option value="">イベント未定 / 下で新しく入力</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.is_official ? '【公式】' : ''}
                      {ev.title}
                      {ev.event_date ? ` (${ev.event_date})` : ''}
                      {ev.start_time ? ` ${ev.start_time}〜` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedEventId && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600">
                      イベント名（未定なら空欄可）
                    </label>
                    <input
                      type="text"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder="イベント名"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600">開催日</label>
                    <input
                      type="date"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600">開始時刻</label>
                    <input
                      type="time"
                      value={newEventStartTime}
                      onChange={(e) => setNewEventStartTime(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600">受付終了時刻</label>
                    <input
                      type="time"
                      value={newEventRegEndTime}
                      onChange={(e) => setNewEventRegEndTime(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600">参加費（任意）</label>
                    <input
                      type="text"
                      value={newEventFee}
                      onChange={(e) => setNewEventFee(e.target.value)}
                      placeholder="例：5,000円"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600">開催店舗・場所</label>
                    <input
                      type="text"
                      value={newEventShop}
                      onChange={(e) => setNewEventShop(e.target.value)}
                      placeholder="店舗名・エリア"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600">
                      詳細ページURL（任意）
                    </label>
                    <input
                      type="url"
                      value={newEventDetailUrl}
                      onChange={(e) => setNewEventDetailUrl(e.target.value)}
                      placeholder="https://..."
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600">募集コメント</label>
                <textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="例：日曜のタッグ戦に出られる相方を探しています！"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-[#00C49A] px-6 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-[#00B38B] disabled:opacity-50"
                >
                  {submitting ? '投稿中...' : '募集を投稿'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecruitmentForm(false)}
                  className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </section>
        )}

        {/* 開催予定のイベント一覧（日付ごとに線で区切り＋開催日時・受付終了・詳細URL） */}
        <section id="event-list-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
              <span>📅</span>
              <span>開催予定のイベント（{officialEvents.length}件）</span>
            </h2>
          </div>

          {groupedEventsByDate.length === 0 ? (
            <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center text-xs text-slate-500 shadow-xs">
              該当する公式イベントはありません。
            </div>
          ) : (
            <div className="space-y-6">
              {groupedEventsByDate.map((group) => (
                <div key={group.dateKey} className="space-y-3">
                  {/* 日付ごとの区切りヘッダー＆水平線 */}
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 rounded-full bg-slate-800 px-3.5 py-1 text-xs font-extrabold text-white">
                      {group.label}
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  {/* その日付のイベントカード群 */}
                  <div className="divide-y divide-slate-100 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_6px_24px_rgba(15,23,42,0.05)]">
                    {group.items.map((ev) => {
                      const relatedRecruitments = recruitments.filter(
                        (r) => r.event_id === ev.id
                      );
                      const isExpanded = expandedEventId === ev.id;

                      return (
                        <div key={ev.id} className="p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1.5">
                              {/* 日時・受付終了時刻 */}
                              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[#00A884]">
                                  📅 {formatJapaneseDateHeader(ev.event_date)}
                                  {ev.start_time ? ` ${ev.start_time}〜` : ''}
                                </span>
                                {ev.registration_end_time && (
                                  <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-600">
                                    受付終了 {ev.registration_end_time}
                                  </span>
                                )}
                                {ev.entry_fee && (
                                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                                    {ev.entry_fee}
                                  </span>
                                )}
                              </div>

                              {/* イベントタイトル */}
                              <h3 className="text-base font-extrabold text-slate-900">
                                {ev.title}
                              </h3>

                              {/* 店舗・エリア */}
                              {(ev.shop_name || ev.location) && (
                                <p className="text-xs text-slate-500">
                                  📍 {ev.shop_name || ''}
                                  {ev.shop_name && ev.location ? ' / ' : ''}
                                  {ev.location || ''}
                                </p>
                              )}
                            </div>

                            {/* 募集ステータスバッジ */}
                            <span className="rounded-full bg-[#00C49A] px-3 py-1 text-[11px] font-extrabold text-white">
                              募集中 ({relatedRecruitments.length})
                            </span>
                          </div>

                          {/* アクションボタン行（詳細URL・募集を見る・募集する） */}
                          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                            {ev.detail_url && (
                              <a
                                href={ev.detail_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                              >
                                詳細を見る ↗
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleToggleEventRecruitments(ev.id)}
                              className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                            >
                              {isExpanded
                                ? '閉じる'
                                : `募集を見る（${relatedRecruitments.length}）`}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenFormForEvent(ev.id)}
                              className="rounded-full bg-gradient-to-r from-[#00D69F] to-[#00B88D] px-4 py-1.5 text-xs font-extrabold text-white shadow-xs transition hover:opacity-95"
                            >
                              募集する &gt;
                            </button>
                          </div>

                          {/* そのイベントの募集一覧アコーディオン */}
                          {isExpanded && (
                            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-extrabold text-[#00A884]">
                                  「{ev.title}」の募集（{relatedRecruitments.length}件）
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveTab('all');
                                    setFilterEventId(ev.id);
                                    document
                                      .getElementById('recruitment-list-section')
                                      ?.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  className="text-[11px] font-bold text-slate-500 underline hover:text-slate-700"
                                >
                                  下の募集一覧で絞り込む
                                </button>
                              </div>

                              {relatedRecruitments.length === 0 ? (
                                <p className="rounded-2xl bg-slate-50 p-4 text-center text-xs text-slate-500">
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
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 相方募集一覧 */}
        <section id="recruitment-list-section" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="flex items-center gap-1.5 text-base font-extrabold text-slate-900">
                <span>👑</span>
                <span>
                  {activeTab === 'mine'
                    ? `自分の募集（${visibleRecruitments.length}件）`
                    : activeTab === 'applied'
                    ? `応募一覧（${visibleRecruitments.length}件）`
                    : `相方募集一覧（${visibleRecruitments.length}件）`}
                </span>
              </h2>
              {filterEventId && (
                <button
                  type="button"
                  onClick={() => setFilterEventId(null)}
                  className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-200"
                >
                  絞り込み解除（{eventsById[filterEventId]?.title || 'イベント'}）×
                </button>
              )}
            </div>
          </div>

          {/* 切り替えピルタブ（添付2枚目風） */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('all');
                setFilterEventId(null);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-extrabold transition ${
                activeTab === 'all'
                  ? 'bg-[#00C49A] text-white shadow-xs'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              すべて（{recruitments.length}）
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('mine');
                setFilterEventId(null);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-extrabold transition ${
                activeTab === 'mine'
                  ? 'bg-[#00C49A] text-white shadow-xs'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              自分の募集（{myRecruitments.length}）
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('applied');
                setFilterEventId(null);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-extrabold transition ${
                activeTab === 'applied'
                  ? 'bg-[#00C49A] text-white shadow-xs'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              応募一覧（{appliedRecruitments.length}）
            </button>
          </div>

          {visibleRecruitments.length === 0 ? (
            <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center text-xs text-slate-500 shadow-xs">
              {activeTab === 'mine'
                ? 'まだ自分の募集投稿はありません。'
                : activeTab === 'applied'
                ? 'まだ「気になる」を送った募集はありません。'
                : filterEventId
                ? '選択したイベントの募集はまだありません。'
                : 'まだ募集がありません。「＋ 相方を募集」ボタンから最初の募集を投稿してみましょう。'}
            </div>
          ) : (
            visibleRecruitments.map((rec) => renderRecruitmentCard(rec))
          )}
        </section>
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F4F8FB] text-slate-600">
          読み込み中...
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}