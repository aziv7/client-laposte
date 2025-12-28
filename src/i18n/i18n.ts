import { arMessages } from "./messages/ar";
import { frMessages } from "./messages/fr";

export type Locale = "fr" | "ar";
export const LOCALES = ["fr", "ar"] as const satisfies readonly Locale[];
export const DEFAULT_LOCALE: Locale = "fr";

export type Messages = typeof frMessages;

const messagesByLocale: Record<Locale, Messages> = {
  fr: frMessages,
  ar: arMessages,
};

export const LOCALE_COOKIE_NAME = "locale";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function getLocaleDir(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function getIntlLocale(locale: Locale): string {
  return locale === "ar" ? "ar-TN" : "fr-FR";
}

export function getMessages(locale: Locale): Messages {
  return messagesByLocale[locale] ?? messagesByLocale[DEFAULT_LOCALE];
}
