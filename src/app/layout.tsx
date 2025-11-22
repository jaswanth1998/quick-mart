import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { AntdThemeProvider } from '@/providers/antd-theme-provider';
import { QueryProvider } from '@/providers/query-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quick Gas and Convenience Store',
  description: 'Gas station and convenience store management system',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <AntdThemeProvider>
            <QueryProvider>{children}</QueryProvider>
          </AntdThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
