import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '🖼️ 图片背景去除',
  description: '一键去除图片背景，下载透明背景图',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
