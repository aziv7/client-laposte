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
  meta,
  action,
}: {
  title: string;
  description?: string;
  meta?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex w-full items-start gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold leading-5">{title}</p>
          {meta}
        </div>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
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
      toast(<ToastContent title={title} description={description} />, { type: 'success', ...opts });
    },
    [],
  );

  const showError = React.useCallback(
    (title: string, description?: string, opts?: ToastOptions) => {
      toast(<ToastContent title={title} description={description} />, { type: 'error', ...opts });
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
              meta={<CodePill>HTTP 429</CodePill>}
            />,
            { type: 'warning' },
          );
          return;
        }

        const title = opts?.title ?? t('toast.error');
        const description = getFriendlyMessageFromCode(t, error.code, error.message);

        toast(
          <ToastContent
            title={title}
            description={description}
            meta={
              <span className="inline-flex flex-wrap items-center gap-2">
                <CodePill>{error.code}</CodePill>
                {error.requestId ? (
                  <CodePill>
                    {t('toast.requestId')}: {error.requestId}
                  </CodePill>
                ) : null}
              </span>
            }
            action={
              error.requestId ? (
                <RequestIdAction
                  requestId={error.requestId}
                  labelCopy={t('common.copy')}
                  labelCopied={t('common.copied')}
                />
              ) : null
            }
          />,
          { type: 'error' },
        );
        return;
      }

      toast(
        <ToastContent title={opts?.title ?? t('toast.error')} description={t('apiError.INTERNAL_ERROR')} />,
        {
          type: 'error',
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


