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
};

type EventItem = {
  id: string;
  title: string;
  event_date: string | null;
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
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        読み込み中...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-emerald-400">成立したマッチング</h1>
            <p className="mt-0.5 text-xs text-zinc-400">
              マッチング成立相手のXアカウントへここから連絡できます
            </p>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
          >
            TOPへ戻る
          </Link>
        </div>

        {matchedApps.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center text-xs text-zinc-400">
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
                  className="rounded-2xl border border-emerald-700/50 bg-zinc-900 p-5"
                >
                  {/* 上部：成立日時 ＋ 連絡済み/未連絡トグル */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/90 pb-3">
                    <span className="text-[11px] text-zinc-400">
                      成立日時: <span className="font-medium text-zinc-200">{matchedAtLabel}</span>
                    </span>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={isContacted}
                      onClick={() => handleToggleContacted(app.id)}
                      className={`inline-flex items-center gap-2.5 rounded-full border px-3 py-1 text-xs font-bold transition ${
                        isContacted
                          ? 'border-emerald-500/50 bg-emerald-950/70 text-emerald-300'
                          : 'border-amber-400/50 bg-amber-400/10 text-amber-300'
                      }`}
                    >
                      <span
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                          isContacted ? 'bg-emerald-500' : 'bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            isContacted ? 'translate-x-4.5' : 'translate-x-1'
                          }`}
                        />
                      </span>
                      <span>{isContacted ? '連絡済み' : '未連絡'}</span>
                    </button>
                  </div>

                  {/* 下部：相手情報 ＋ Xリンク */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {partner?.avatar_url ? (
                        <img
                          src={partner.avatar_url}
                          alt={partner.name}
                          className="h-12 w-12 rounded-full border border-zinc-700 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-sm font-bold text-zinc-300">
                          {(partner?.name || 'P').slice(0, 1)}
                        </div>
                      )}

                      <div>
                        <p className="text-base font-bold text-white">
                          {partner?.name || 'プレイヤー'}
                        </p>
                        <p className="text-xs text-zinc-400">
                          イベント：{ev?.title || 'イベント未定'}
                          {ev?.event_date ? `（${ev.event_date}）` : ''}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-zinc-300">
                          {partner?.area && (
                            <span className="rounded bg-zinc-950 px-2 py-0.5">
                              {partner.area}
                            </span>
                          )}
                          {partner?.experience && (
                            <span className="rounded bg-zinc-950 px-2 py-0.5">
                              歴 {partner.experience}
                            </span>
                          )}
                          {partner?.play_type && (
                            <span className="rounded bg-zinc-950 px-2 py-0.5 text-emerald-300">
                              {partner.play_type}
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
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-extrabold text-zinc-950 transition hover:bg-emerald-400"
                        >
                          <span>X (@{cleanX}) を開く</span>
                        </a>
                      ) : (
                        <span className="rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-400">
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