import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '阿東 Line Bot 管理後台',
  description: 'AI-powered Line bot management dashboard'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="antialiased">{children}</body>
    </html>
  );
}
