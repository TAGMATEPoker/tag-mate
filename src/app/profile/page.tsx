'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const AGE_GROUPS = ['10代', '20代', '30代', '40代', '50代', '60代', '非公開'];
const GENDERS = ['男性', '女性', '非公開'];
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState('');

  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [xUsername, setXUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [ageGroup, setAgeGroup] = useState('非公開');
  const [gender, setGender] = useState('非公開');
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
        setAgeGroup(profile.age_group || '非公開');
        setGender(profile.gender || '非公開');
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (!file.type.startsWith('image/')) {
      setMessage('画像ファイル（PNG / JPG / WEBP など）を選択してください。');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('画像サイズは5MB以下にしてください。');
      return;
    }

    setUploadingAvatar(true);
    setMessage('');

    const fileExt = file.name.split('.').pop() || 'png';
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setUploadingAvatar(false);
      setMessage(`画像アップロードエラー: ${uploadError.message}`);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    setAvatarUrl(publicUrlData.publicUrl);
    setUploadingAvatar(false);
    setMessage('アイコン画像をアップロードしました。「プロフィールを保存」を押して確定してください。');
  };

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
      age_group: ageGroup,
      gender,
      area,
      experience,
      play_type: playType,
      stance,
      home_shop: homeShop.trim(),
      target_type: targetType,
      bio: bio.trim(),
    });

    if (error) {
      setSaving(false);
      setMessage(`保存エラー: ${error.message}`);
      return;
    }

    window.location.href = '/';
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
        <div>
          <h1 className="text-xl font-bold text-emerald-400">プロフィール設定</h1>
          <p className="mt-1 text-xs text-zinc-400">
            ※XのIDはマッチ成立後に相手へ共有されます（募集時は非公開）
          </p>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          {/* アイコン画像アップロード */}
          <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="アイコン"
                className="h-16 w-16 rounded-full border border-zinc-700 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs text-zinc-400">
                未設定
              </div>
            )}
            <div className="flex-1 space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-200">
                プロフィールアイコン（画像アップロード）
              </label>
              <label className="inline-block cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700">
                {uploadingAvatar ? 'アップロード中...' : '画像を選択して変更'}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingAvatar}
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-zinc-400">PNG / JPG / WEBP（5MB以下）</p>
            </div>
          </div>

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

          {/* 年齢・性別 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-zinc-300">年齢</label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              >
                {AGE_GROUPS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-300">性別</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              >
                {GENDERS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
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
            disabled={saving || uploadingAvatar}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {saving ? '保存中...' : 'プロフィールを保存'}
          </button>
        </form>
      </div>
    </main>
  );
}