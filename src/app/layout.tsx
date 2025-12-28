import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Sans_Arabic } from "next/font/google";
import { cookies } from "next/headers";

import { I18nProvider } from "@/i18n/I18nProvider";
import {
  DEFAULT_LOCALE,
  getLocaleDir,
  getMessages,
  isLocale,
  LOCALE_COOKIE_NAME,
  type Locale,
} from "@/i18n/i18n";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { AuthProvider } from "@/lib/auth/auth-context";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
});

export const dynamic = "force-dynamic";

async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  if (value && isLocale(value)) return value;
  return DEFAULT_LOCALE;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  return {
    title: messages.app.name,
    description: messages.app.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const dir = getLocaleDir(locale);
  const messages = getMessages(locale);

  return (
    <html lang={locale} dir={dir}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoArabic.variable} antialiased`}
      >
        <I18nProvider locale={locale} messages={messages}>
          <AuthProvider>{children}</AuthProvider>
          <ToastProvider />
        </I18nProvider>
      </body>
    </html>
  );
}
