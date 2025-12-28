import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { I18nProvider } from '@/i18n/I18nProvider';
import { DEFAULT_LOCALE, getMessages } from '@/i18n/i18n';
import { ToastProvider } from '@/components/toast/ToastProvider';
import { AuthProvider } from '@/lib/auth/auth-context';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const locale = DEFAULT_LOCALE;
const messages = getMessages(locale);

export const metadata: Metadata = {
  title: messages.app.name,
  description: messages.app.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider locale={locale} messages={messages}>
          <AuthProvider>{children}</AuthProvider>
          <ToastProvider />
        </I18nProvider>
      </body>
    </html>
  );
}
