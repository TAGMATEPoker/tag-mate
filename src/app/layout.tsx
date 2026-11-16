import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

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
      <body className="min-h-screen bg-[#F4F8FB] pb-20 text-slate-800 antialiased">
        <Header />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}