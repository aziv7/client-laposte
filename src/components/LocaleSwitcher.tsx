"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LanguagesIcon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/i18n/I18nProvider";
import { LOCALE_COOKIE_NAME, type Locale } from "@/i18n/i18n";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();

  const isRtl = locale === "ar";

  function setLocale(nextLocale: Locale) {
    const maxAge = 60 * 60 * 24 * 365; // 1 year
    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    router.refresh();
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LanguagesIcon
        className="size-4 text-muted-foreground"
        aria-hidden="true"
      />
      <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
        <SelectTrigger className="h-9 min-w-38 rounded-xl">
          <SelectValue placeholder={t("i18n.language")} />
        </SelectTrigger>
        <SelectContent align={isRtl ? "start" : "end"}>
          <SelectItem value="fr">{t("i18n.fr")}</SelectItem>
          <SelectItem value="ar">{t("i18n.ar")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
