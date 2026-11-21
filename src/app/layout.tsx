import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '波音 787-10 飞行模拟器',
  description: '基于 Web 的波音 787-10 飞行模拟器',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body>{children}</body>
    </html>
  );
}
