import { enMessages } from './messages/en';
import { frMessages } from './messages/fr';

export type Locale = 'fr' | 'en';
export const DEFAULT_LOCALE: Locale = 'fr';

export type Messages = typeof frMessages;

const messagesByLocale: Record<Locale, Messages> = {
  fr: frMessages,
  en: enMessages,
};

export function getMessages(locale: Locale): Messages {
  return messagesByLocale[locale] ?? messagesByLocale[DEFAULT_LOCALE];
}


