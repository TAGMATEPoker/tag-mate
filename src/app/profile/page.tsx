'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const AREAS = ['東京都', '神奈川県', '埼玉県', '千葉県', '大阪府', '愛知県', '福岡県', 'その他'];
const EXPERIENCES = ['1年未満', '1〜3年', '3〜5年', '5年以上'];
const PLAY_TYPES = ['TAG（タイトアグレッシブ）', 'LAG（ルースアグレッシブ）', 'タイトパッシブ', 'ルースパッシブ', 'バランス型'];
const STANCES = ['ガチ勢', 'エンジョイ勢', '勉強中'];
const TARGET_TYPES = ['ガチ勢', 'エンジョイ勢', '初心者OK', '誰でも歓迎'];

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [xUsername, setXUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [area, setArea] = useState('東京都');
  const [experience, setExperience] = useState('1〜3年');
  const [playType, setPlayType] = useState('TAG（タイトアグレッシブ）');
  const [stance, setStance] = useState('エンジョイ勢');
  const [homeShop, setHomeShop] = useState('');
  const [targetType, setTargetType] = useState('誰でも歓迎');
  const [bio, setBio] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setName(profile.name || '');
        setXUsername(profile.x_username || '');
        setAvatarUrl(profile.avatar_url || user.user_metadata?.avatar_url || '');
        setArea(profile.area || '東京都');
        setExperience(profile.experience || '1〜3年');
        setPlayType(profile.play_type || 'TAG（タイトアグレッシブ）');
        setStance(profile.stance || 'エンジョイ勢');
        setHomeShop(profile.home_shop || '');
        setTargetType(profile.target_type || '誰でも歓迎');
        setBio(profile.bio || '');
      } else {
        setName(user.user_metadata?.full_name || '');
        setAvatarUrl(user.user_metadata?.avatar_url || '');
      }

      setLoading(false);
    };

    loadProfile();
  }, [router, supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!name.trim() || !xUsername.trim()) {
      setMessage('プレイヤーネームとXのIDは必須です。');
      return;
    }

    setSaving(true);
    setMessage('');

    const cleanX = xUsername.trim().replace(/^@/, '');

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      name: name.trim(),
      x_username: cleanX,
      avatar_url: avatarUrl.trim() || null,
      area,
      experience,
      play_type: playType,
      stance,
      home_shop: homeShop.trim(),
      target_type: targetType,
      bio: bio.trim(),
    });

    setSaving(false);

    if (error) {
      setMessage(`保存エラー: ${error.message}`);
    } else {
      setMessage('プロフィールを保存しました！');
    }
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
      <div className="mx-auto max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-emerald-400">プロフィール設定</h1>
            <p className="mt-1 text-xs text-zinc-400">
              ※XのIDはマッチ成立後に相手へ共有されます（募集時は非公開）
            </p>
          </div>
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt="アイコン"
              className="h-12 w-12 rounded-full border border-zinc-700 object-cover"
            />
          )}
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs text-zinc-300">プレイヤーネーム *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：タッグ太郎"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-300">X (Twitter) ユーザー名 *</label>
            <input
              type="text"
              value={xUsername}
              onChange={(e) => setXUsername(e.target.value)}
              placeholder="例：poker_tag_taro（@なしでも可）"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-300">アイコン画像URL（任意）</label>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Googleアカウントの画像が自動セットされます"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-zinc-300">活動地域</label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              >
                {AREAS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-300">ポーカー歴</label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              >
                {EXPERIENCES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-zinc-300">プレイタイプ</label>
              <select
                value={playType}
                onChange={(e) => setPlayType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              >
                {PLAY_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-300">スタイル</label>
              <select
                value={stance}
                onChange={(e) => setStance(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              >
                {STANCES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-zinc-300">よくいく店舗</label>
              <input
                type="text"
                value={homeShop}
                onChange={(e) => setHomeShop(e.target.value)}
                placeholder="例：〇〇ポーカーギルド"
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-300">求める相手</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              >
                {TARGET_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-300">一言コメント</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="例：楽しく真剣にタッグ戦を打ちたいです！エントリー代折半など相談しましょう。"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
          </div>

          {message && (
            <p className="rounded-lg bg-zinc-800 px-3 py-2 text-xs text-emerald-300">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {saving ? '保存中...' : 'プロフィールを保存'}
          </button>
        </form>
      </div>
    </main>
  );
}