'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, RotateCcw, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { StatusTimeline } from '@/app/_components/StatusTimeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppToast } from '@/components/toast/toast';
import { useI18n } from '@/i18n/I18nProvider';
import { ApiClientError, publicGetCardStatus, type CardStatusResponse } from '@/lib/api/client';
import { cn } from '@/lib/utils';

const cardStatusSchema = z.object({
  nom: z.string().trim().min(1, 'Veuillez saisir votre nom.').max(100, 'Nom trop long.'),
  prenom: z.string().trim().min(1, 'Veuillez saisir votre prénom.').max(100, 'Prénom trop long.'),
  cin: z.string().trim().regex(/^[0-9]{8}$/, 'Le CIN doit contenir 8 chiffres.'),
  codePostal: z.string().trim().regex(/^[0-9]{4}$/, 'Le code postal doit contenir 4 chiffres.'),
  gouvernorat: z
    .string()
    .trim()
    .min(1, 'Veuillez saisir votre gouvernorat.')
    .max(100, 'Gouvernorat trop long.'),
});

type CardStatusFormValues = z.infer<typeof cardStatusSchema>;

function formatDateFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

export function CardStatusForm() {
  const { t } = useI18n();
  const toast = useAppToast();

  const [result, setResult] = React.useState<CardStatusResponse | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [cooldownSeconds, setCooldownSeconds] = React.useState(0);

  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const id = window.setTimeout(() => setCooldownSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [cooldownSeconds]);

  const form = useForm<CardStatusFormValues>({
    resolver: zodResolver(cardStatusSchema),
    defaultValues: {
      nom: '',
      prenom: '',
      cin: '',
      codePostal: '',
      gouvernorat: '',
    },
    mode: 'onBlur',
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
      const res = await publicGetCardStatus(values, { signal: controller.signal });
      setResult(res);
      toast.success(t('toast.success'), t('toast.statusFetched'));
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;

      if (e instanceof ApiClientError) {
        if (e.status === 404) setNotFound(true);
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
                    <FormLabel>{t('public.form.nom')}</FormLabel>
                    <FormControl>
                      <Input autoComplete="family-name" placeholder="Ex: Jerbi" {...field} />
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
                    <FormLabel>{t('public.form.prenom')}</FormLabel>
                    <FormControl>
                      <Input autoComplete="given-name" placeholder="Ex: Ali" {...field} />
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
                    <FormLabel>{t('public.form.cin')}</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        maxLength={8}
                        placeholder="8 chiffres"
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
                    <FormLabel>{t('public.form.codePostal')}</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="4 chiffres"
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
                  <FormLabel>{t('public.form.gouvernorat')}</FormLabel>
                  <FormControl>
                    <Input autoComplete="address-level1" placeholder="Ex: Tunis" {...field} />
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
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
                {t('public.form.submit')}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                onClick={onReset}
                disabled={loading}
              >
                <RotateCcw className="size-4" />
                {t('public.form.reset')}
              </Button>

              {cooldownSeconds > 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('toast.rateLimitedDesc', { seconds: cooldownSeconds })}
                </p>
              ) : null}
            </div>

            <p className="text-xs text-muted-foreground">{t('public.hint')}</p>
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
                <CardTitle className="text-base">{t('public.result.pickup')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t('public.result.updatedAt')}</span>
                  <span className="font-medium">{formatDateFr(result.updatedAt)}</span>
                </div>

                <div className="grid gap-2 pt-2">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">{t('public.result.pickupEstablishment')}</span>
                    <span className={cn('text-right font-medium', !result.pickupEstablishment && 'text-muted-foreground')}>
                      {result.pickupEstablishment ?? '—'}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">{t('public.result.pickupAddress')}</span>
                    <span className={cn('text-right font-medium', !result.pickupAddress && 'text-muted-foreground')}>
                      {result.pickupAddress ?? '—'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : notFound ? (
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">{t('public.result.notFoundTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t('public.result.notFoundDesc')}</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">{t('public.result.placeholderTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t('public.result.placeholderDesc')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


