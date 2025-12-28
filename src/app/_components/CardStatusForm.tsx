"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowPathIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";

import { StatusTimeline } from "@/app/_components/StatusTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppToast } from "@/components/toast/toast";
import { useI18n, type TFunction } from "@/i18n/I18nProvider";
import { getIntlLocale } from "@/i18n/i18n";
import {
  ApiClientError,
  publicGetCardStatus,
  type CardStatusResponse,
} from "@/lib/api/client";
import { cn } from "@/lib/utils";

function makeCardStatusSchema(t: TFunction) {
  return z.object({
    nom: z
      .string()
      .trim()
      .min(1, t("public.form.validation.nomRequired"))
      .max(100, t("public.form.validation.nomTooLong")),
    prenom: z
      .string()
      .trim()
      .min(1, t("public.form.validation.prenomRequired"))
      .max(100, t("public.form.validation.prenomTooLong")),
    cin: z
      .string()
      .trim()
      .regex(/^[0-9]{8}$/, t("public.form.validation.cinInvalid")),
    codePostal: z
      .string()
      .trim()
      .regex(/^[0-9]{4}$/, t("public.form.validation.codePostalInvalid")),
    gouvernorat: z
      .string()
      .trim()
      .min(1, t("public.form.validation.gouvernoratRequired"))
      .max(100, t("public.form.validation.gouvernoratTooLong")),
  });
}

type CardStatusFormValues = z.infer<ReturnType<typeof makeCardStatusSchema>>;

function formatDateTime(iso: string, intlLocale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function CardStatusForm() {
  const { t, locale } = useI18n();
  const toast = useAppToast();

  const isRtl = locale === "ar";
  const cardStatusSchema = React.useMemo(() => makeCardStatusSchema(t), [t]);

  const [result, setResult] = React.useState<CardStatusResponse | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [cooldownSeconds, setCooldownSeconds] = React.useState(0);

  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const id = window.setTimeout(
      () => setCooldownSeconds((s) => Math.max(0, s - 1)),
      1000
    );
    return () => window.clearTimeout(id);
  }, [cooldownSeconds]);

  const form = useForm<CardStatusFormValues>({
    resolver: zodResolver(cardStatusSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      cin: "",
      codePostal: "",
      gouvernorat: "",
    },
    mode: "onBlur",
  });

  async function onSubmit(values: CardStatusFormValues) {
    if (cooldownSeconds > 0) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setNotFound(false);
    setResult(null);

    try {
      const res = await publicGetCardStatus(values, {
        signal: controller.signal,
      });
      setResult(res);
      toast.success(t("toast.success"), t("toast.statusFetched"));
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;

      if (e instanceof ApiClientError) {
        const isNotFound = e.status === 404 || e.code === "NOT_FOUND";
        if (isNotFound) {
          setNotFound(true);
          toast.error(
            t("public.result.notFoundTitle"),
            t("public.result.notFoundDesc"),
            { toastId: `public:notfound:${locale}` }
          );
          return;
        }
        if (e.status === 429) setCooldownSeconds(e.retryAfterSeconds ?? 30);
      }

      toast.apiError(e);
    } finally {
      setLoading(false);
    }
  }

  function onReset() {
    abortRef.current?.abort();
    setResult(null);
    setNotFound(false);
    setCooldownSeconds(0);
    form.reset();
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <Form {...form}>
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("public.form.nom")}</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="family-name"
                        placeholder={t("public.form.placeholder.nom")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prenom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("public.form.prenom")}</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="given-name"
                        placeholder={t("public.form.placeholder.prenom")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="cin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("public.form.cin")}</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        maxLength={8}
                        placeholder={t("public.form.placeholder.cin")}
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="codePostal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("public.form.codePostal")}</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        maxLength={4}
                        placeholder={t("public.form.placeholder.codePostal")}
                        autoComplete="postal-code"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="gouvernorat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("public.form.gouvernorat")}</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="address-level1"
                      placeholder={t("public.form.placeholder.gouvernorat")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
              <Button
                type="submit"
                className="rounded-xl"
                disabled={loading || cooldownSeconds > 0}
              >
                {loading ? (
                  <ArrowPathIcon className="size-4 animate-spin" />
                ) : (
                  <MagnifyingGlassIcon className="size-4" />
                )}
                {t("public.form.submit")}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                onClick={onReset}
                disabled={loading}
              >
                <ArrowPathIcon className="size-4" />
                {t("public.form.reset")}
              </Button>

              {cooldownSeconds > 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("toast.rateLimitedDesc", { seconds: cooldownSeconds })}
                </p>
              ) : null}
            </div>

            <p className="text-xs text-muted-foreground">{t("public.hint")}</p>
          </form>
        </Form>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="rounded-xl border border-border/60 bg-background/60 p-4">
            <div className="space-y-3">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
        ) : result ? (
          <div className="space-y-4">
            <StatusTimeline status={result.status} />

            <Card className="border-border/60 bg-card/80 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {t("public.result.pickup")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {t("public.result.updatedAt")}
                  </span>
                  <span className="font-medium">
                    {formatDateTime(result.updatedAt, getIntlLocale(locale))}
                  </span>
                </div>

                <div className="grid gap-2 pt-2">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">
                      {t("public.result.pickupEstablishment")}
                    </span>
                    <span
                      className={cn(
                        "font-medium",
                        isRtl ? "text-left" : "text-right",
                        !result.pickupEstablishment && "text-muted-foreground"
                      )}
                    >
                      {result.pickupEstablishment ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">
                      {t("public.result.pickupAddress")}
                    </span>
                    <span
                      className={cn(
                        "font-medium",
                        isRtl ? "text-left" : "text-right",
                        !result.pickupAddress && "text-muted-foreground"
                      )}
                    >
                      {result.pickupAddress ?? "—"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : notFound ? (
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">
                {t("public.result.notFoundTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("public.result.notFoundDesc")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">
                {t("public.result.placeholderTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("public.result.placeholderDesc")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
