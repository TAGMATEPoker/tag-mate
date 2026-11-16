'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const AGE_GROUPS = ['10代', '20代', '30代', '40代', '50代', '60代', '非公開'];
const GENDERS = ['男性', '女性', '非公開'];
const EXPERIENCES = ['1年未満', '1〜3年', '3〜5年', '5年以上'];
const TARGET_TYPES = ['誰でも歓迎', '初心者OK', 'ガチ勢求む', '飲みポしましょ'];

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
  const [experience, setExperience] = useState('1〜3年');
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
        setExperience(profile.experience || '1〜3年');
        setTargetType(
          TARGET_TYPES.includes(profile.target_type) ? profile.target_type : '誰でも歓迎'
        );
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
      experience,
      target_type: targetType,
      bio: bio.trim(),
      last_active_at: new Date().toISOString(),
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
      <main className="flex min-h-screen items-center justify-center bg-transparent text-slate-600">
        読み込み中...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent px-4 py-6 text-slate-800">
      <div className="mx-auto max-w-xl space-y-5">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/95 text-slate-700 shadow-2xs transition hover:bg-white"
            aria-label="戻る"
          >
            &lt;
          </Link>
          <span className="text-xs font-extrabold text-slate-600">マイページ設定</span>
          <div className="w-9" />
        </div>

        <div className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xs">
          <div>
            <h1 className="text-xl font-black text-slate-900">プロフィール編集</h1>
            <p className="mt-1 text-xs text-slate-500">
              ※XのIDはマッチ成立後に相手へ共有されます（募集時は非公開）
            </p>
          </div>

          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="アイコン"
                  className="h-16 w-16 rounded-full border-2 border-white object-cover shadow-2xs"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#00D09C] to-[#00A884] text-xs font-extrabold text-white shadow-2xs">
                  未設定
                </div>
              )}
              <div className="flex-1 space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">
                  プロフィールアイコン
                </label>
                <label className="inline-block cursor-pointer rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-xs font-bold text-[#00A884] shadow-2xs transition hover:bg-emerald-50">
                  {uploadingAvatar ? 'アップロード中...' : '画像を選択して変更'}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingAvatar}
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400">PNG / JPG / WEBP（5MB以下）</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600">プレイヤーネーム *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：タッグ太郎"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-[#00C49A] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600">
                X (Twitter) ユーザー名 *
              </label>
              <input
                type="text"
                value={xUsername}
                onChange={(e) => setXUsername(e.target.value)}
                placeholder="例：poker_tag_taro（@なしでも可）"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-[#00C49A] focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-600">年齢</label>
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-[#00C49A] focus:bg-white"
                >
                  {AGE_GROUPS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600">性別</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-[#00C49A] focus:bg-white"
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
                <label className="block text-xs font-bold text-slate-600">ポーカー歴</label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-[#00C49A] focus:bg-white"
                >
                  {EXPERIENCES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600">求める相手</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-[#00C49A] focus:bg-white"
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
              <label className="block text-xs font-bold text-slate-600">一言コメント</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="例：楽しく真剣にタッグ戦を打ちたいです！エントリー代折半など相談しましょう。"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-[#00C49A] focus:bg-white"
              />
            </div>

            {message && (
              <p className="rounded-2xl bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || uploadingAvatar}
              className="w-full rounded-full bg-gradient-to-r from-[#00D69F] to-[#00B88D] px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_6px_18px_rgba(0,196,154,0.35)] transition hover:opacity-95 disabled:opacity-50"
            >
              {saving ? '保存中...' : 'プロフィールを保存'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}