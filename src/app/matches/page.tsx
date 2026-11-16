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
  age_group: string | null;
  gender: string | null;
  area: string | null;
  experience: string | null;
  play_type: string | null;
  stance: string | null;
};

type EventItem = {
  id: string;
  title: string;
  event_date: string | null;
  start_time: string | null;
  shop_name: string | null;
  is_official: boolean;
};

type RecruitmentItem = {
  id: string;
  event_id: string | null;
  user_id: string;
  comment: string | null;
};

type ApplicationItem = {
  id: string;
  recruitment_id: string;
  applicant_id: string;
  status: 'pending' | 'matched' | 'rejected';
  created_at: string;
  updated_at?: string | null;
};

const STORAGE_KEY = 'tag_mate_contacted_matches';

function formatMatchedDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '日時不明';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '日時不明';

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');

  return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}

export default function MatchesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [recruitments, setRecruitments] = useState<RecruitmentItem[]>([]);
  const [eventsById, setEventsById] = useState<Record<string, EventItem>>({});
  const [profilesMap, setProfilesMap] = useState<Record<string, Profile>>({});
  const [matchedApps, setMatchedApps] = useState<ApplicationItem[]>([]);
  const [contactedMap, setContactedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setContactedMap(JSON.parse(saved));
      }
    } catch {
      // ストレージ読み込み失敗時は無視
    }
  }, []);

  useEffect(() => {
    const loadMatches = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      const [
        { data: eventsData },
        { data: recruitmentsData },
        { data: profilesData },
        { data: appsData },
      ] = await Promise.all([
        supabase.from('events').select('*'),
        supabase.from('recruitments').select('*'),
        supabase.from('profiles').select('*'),
        supabase
          .from('applications')
          .select('*')
          .eq('status', 'matched')
          .order('created_at', { ascending: false }),
      ]);

      const evMap: Record<string, EventItem> = {};
      (eventsData || []).forEach((ev: EventItem) => {
        evMap[ev.id] = ev;
      });
      setEventsById(evMap);

      const pMap: Record<string, Profile> = {};
      (profilesData || []).forEach((p: Profile) => {
        pMap[p.id] = p;
      });
      setProfilesMap(pMap);

      const recs = recruitmentsData || [];
      setRecruitments(recs);

      const relevant = (appsData || []).filter((app: ApplicationItem) => {
        const rec = recs.find((r: RecruitmentItem) => r.id === app.recruitment_id);
        return app.applicant_id === user.id || rec?.user_id === user.id;
      });
      setMatchedApps(relevant);

      setLoading(false);
    };

    loadMatches();
  }, [router, supabase]);

  const handleToggleContacted = (appId: string) => {
    setContactedMap((prev) => {
      const next = {
        ...prev,
        [appId]: !prev[appId],
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ストレージ書き込み失敗時は無視
      }
      return next;
    });
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-transparent text-slate-600">
        読み込み中...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent px-4 py-6 text-slate-800">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900">成立したマッチング</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              マッチング成立相手のXアカウントへここから連絡できます
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/80 bg-white/95 px-4 py-2 text-xs font-extrabold text-slate-700 shadow-2xs transition hover:bg-white"
          >
            TOPへ戻る
          </Link>
        </div>

        {matchedApps.length === 0 ? (
          <div className="rounded-3xl border border-white/80 bg-white/95 p-6 text-center text-xs text-slate-500 shadow-2xs backdrop-blur-xs">
            まだ成立したマッチングはありません。
          </div>
        ) : (
          <div className="space-y-4">
            {matchedApps.map((app) => {
              const rec = recruitments.find((r) => r.id === app.recruitment_id);
              const partnerId =
                app.applicant_id === userId ? rec?.user_id : app.applicant_id;
              const partner = partnerId ? profilesMap[partnerId] : null;
              const ev = rec?.event_id ? eventsById[rec.event_id] : null;
              const cleanX = partner?.x_username?.replace(/^@/, '') || '';
              const isContacted = Boolean(contactedMap[app.id]);
              const matchedAtLabel = formatMatchedDateTime(app.updated_at || app.created_at);

              return (
                <section
                  key={app.id}
                  className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-[0_6px_24px_rgba(15,23,42,0.05)] backdrop-blur-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <span className="text-[11px] font-medium text-slate-500">
                      成立日時:{' '}
                      <span className="font-extrabold text-slate-700">{matchedAtLabel}</span>
                    </span>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={isContacted}
                      onClick={() => handleToggleContacted(app.id)}
                      className={`inline-flex items-center gap-2.5 rounded-full border px-3 py-1 text-xs font-extrabold transition ${
                        isContacted
                          ? 'border-emerald-200 bg-emerald-50 text-[#00A884]'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                    >
                      <span
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                          isContacted ? 'bg-[#00C49A]' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-2xs transition-transform ${
                            isContacted ? 'translate-x-4.5' : 'translate-x-1'
                          }`}
                        />
                      </span>
                      <span>{isContacted ? '連絡済み' : '未連絡'}</span>
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {partner?.avatar_url ? (
                        <img
                          src={partner.avatar_url}
                          alt={partner.name}
                          className="h-14 w-14 rounded-full border-2 border-emerald-100 object-cover shadow-2xs"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#00D09C] to-[#00A884] text-base font-black text-white shadow-2xs">
                          {(partner?.name || 'P').slice(0, 1)}
                        </div>
                      )}

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-extrabold text-slate-900">
                            {partner?.name || 'プレイヤー'}
                          </p>
                          {(partner?.age_group || partner?.gender) && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                              {partner?.age_group || '非公開'}・{partner?.gender || '非公開'}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs font-bold text-[#00A884]">
                          📅 {ev?.title || 'イベント未定'}
                          {ev?.event_date ? `（${ev.event_date}）` : ''}
                          {ev?.start_time ? ` ${ev.start_time}〜` : ''}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-bold">
                          {partner?.area && (
                            <span className="rounded-full bg-indigo-50/80 px-2.5 py-0.5 text-indigo-600">
                              #{partner.area}
                            </span>
                          )}
                          {partner?.experience && (
                            <span className="rounded-full bg-indigo-50/80 px-2.5 py-0.5 text-indigo-600">
                              #歴{partner.experience}
                            </span>
                          )}
                          {partner?.stance && (
                            <span className="rounded-full bg-indigo-50/80 px-2.5 py-0.5 text-indigo-600">
                              #{partner.stance}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      {cleanX ? (
                        <a
                          href={`https://x.com/${cleanX}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00D69F] to-[#00B88D] px-5 py-2.5 text-xs font-extrabold text-white shadow-[0_4px_14px_rgba(0,196,154,0.35)] transition hover:opacity-95"
                        >
                          <span>X (@{cleanX}) を開く &gt;</span>
                        </a>
                      ) : (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-400">
                          X ID未登録
                        </span>
                      )}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}