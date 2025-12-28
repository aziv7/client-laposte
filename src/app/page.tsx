"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CardStatusForm } from "@/app/_components/CardStatusForm";
import { useI18n } from "@/i18n/I18nProvider";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="min-h-dvh bg-linear-to-b from-secondary/20 via-background to-muted/40">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12">
        <div className="flex items-center justify-end">
          <LocaleSwitcher />
        </div>
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">
              {t("public.title")}
            </CardTitle>
            <CardDescription>{t("public.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <CardStatusForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
