'use client';

import * as React from 'react';
import { toast, type ToastOptions } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nProvider';
import { ApiClientError } from '@/lib/api/client';
import { cn } from '@/lib/utils';

function ToastContent({
  title,
  description,
  details,
}: {
  title: string;
  description?: string;
  details?: React.ReactNode;
}) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex w-full items-start gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-semibold leading-5">{title}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}

        {details ? (
          <div className="mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-lg px-2"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((v) => !v);
              }}
            >
              {open ? t('common.hide') : t('common.details')}
            </Button>
            {open ? <div className="mt-2">{details}</div> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CodePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] leading-4 text-muted-foreground">
      {children}
    </span>
  );
}

function RequestIdAction({
  requestId,
  labelCopy,
  labelCopied,
}: {
  requestId: string;
  labelCopy: string;
  labelCopied: string;
}) {
  const [copied, setCopied] = React.useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn('h-8 px-2 font-medium', copied && 'text-emerald-600')}
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(requestId);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        } catch {
          // If clipboard fails, we simply do nothing; requestId is still visible.
        }
      }}
    >
      {copied ? labelCopied : labelCopy}
    </Button>
  );
}

function getFriendlyMessageFromCode(
  t: (k: string, vars?: Record<string, string | number>) => string,
  code: string,
  fallback: string,
) {
  const key = `apiError.${code}`;
  const translated = t(key);
  return translated === key ? fallback : translated;
}

export function useAppToast() {
  const { t } = useI18n();

  const showSuccess = React.useCallback(
    (title: string, description?: string, opts?: ToastOptions) => {
      toast(<ToastContent title={title} description={description} />, {
        type: 'success',
        autoClose: 2500,
        ...opts,
      });
    },
    [],
  );

  const showError = React.useCallback(
    (title: string, description?: string, opts?: ToastOptions) => {
      toast(<ToastContent title={title} description={description} />, {
        type: 'error',
        autoClose: 4000,
        ...opts,
      });
    },
    [],
  );

  const showApiError = React.useCallback(
    (error: unknown, opts?: { title?: string }) => {
      if (error instanceof ApiClientError) {
        // 429 UX
        if (error.status === 429) {
          const seconds = error.retryAfterSeconds ?? 30;
          toast(
            <ToastContent
              title={t('toast.rateLimitedTitle')}
              description={t('toast.rateLimitedDesc', { seconds })}
              details={
                <div className="flex flex-wrap items-center gap-2">
                  <CodePill>HTTP 429</CodePill>
                  {error.requestId ? <CodePill>{t('toast.requestId')}: {error.requestId}</CodePill> : null}
                  {error.requestId ? (
                    <RequestIdAction
                      requestId={error.requestId}
                      labelCopy={t('common.copy')}
                      labelCopied={t('common.copied')}
                    />
                  ) : null}
                </div>
              }
            />,
            { type: 'warning', autoClose: 4500, toastId: 'api:HTTP_429' },
          );
          return;
        }

        const title =
          opts?.title ??
          (error.code === 'NOT_FOUND' ? t('public.result.notFoundTitle') : t('toast.error'));
        const description = getFriendlyMessageFromCode(t, error.code, error.message);

        toast(
          <ToastContent
            title={title}
            description={description}
            details={
              <div className="flex flex-wrap items-center gap-2">
                <CodePill>{error.code}</CodePill>
                {error.requestId ? <CodePill>{t('toast.requestId')}: {error.requestId}</CodePill> : null}
                {error.requestId ? (
                  <RequestIdAction
                    requestId={error.requestId}
                    labelCopy={t('common.copy')}
                    labelCopied={t('common.copied')}
                  />
                ) : null}
              </div>
            }
          />,
          { type: 'error', autoClose: 4000, toastId: `api:${error.code}` },
        );
        return;
      }

      toast(
        <ToastContent title={opts?.title ?? t('toast.error')} description={t('apiError.INTERNAL_ERROR')} />,
        {
          type: 'error',
          autoClose: 4000,
          toastId: 'api:INTERNAL_ERROR',
        },
      );
    },
    [t],
  );

  return React.useMemo(
    () => ({
      success: showSuccess,
      error: showError,
      apiError: showApiError,
    }),
    [showSuccess, showError, showApiError],
  );
}


