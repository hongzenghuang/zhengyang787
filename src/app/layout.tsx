import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '787-10 Night Deck · Flight Simulator',
  description: 'Browser-based Boeing 787-10 flight simulator with interactive cockpit controls.',
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
