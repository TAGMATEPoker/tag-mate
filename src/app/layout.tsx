import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import AppBackground from '@/components/AppBackground';

export const metadata: Metadata = {
  title: 'TAG MATE | ポーカーの相方を見つけよう！',
  description: 'イベントで一緒に楽しめるパートナーが見つかるマッチングサービス',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="relative min-h-screen bg-transparent pb-20 text-slate-800 antialiased">
        <AppBackground />
        <Header />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}