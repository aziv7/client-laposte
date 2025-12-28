'use client';

import * as React from 'react';

import type { Locale, Messages } from './i18n';

export type TFunction = (key: string, vars?: Record<string, string | number>) => string;

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
  t: TFunction;
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return Object.entries(vars).reduce((acc, [k, v]) => {
    return acc.replaceAll(`{${k}}`, String(v));
  }, template);
}

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  const t = React.useCallback<TFunction>(
    (key, vars) => {
      const value = getByPath(messages, key);
      if (typeof value !== 'string') return key;
      return interpolate(value, vars);
    },
    [messages],
  );

  const ctx = React.useMemo<I18nContextValue>(() => ({ locale, messages, t }), [locale, messages, t]);

  return <I18nContext.Provider value={ctx}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}


