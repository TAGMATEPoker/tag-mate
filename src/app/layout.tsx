import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'TAG MATE | ポーカータッグ戦の相方探し専用',
  description: 'ポーカーのタッグトーナメント・チーム戦の相方募集プラットフォーム',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-zinc-950 text-white antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}