'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Shield } from 'lucide-react';

import { useAppToast } from '@/components/toast/toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/lib/auth/auth-context';

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useAppToast();
  const auth = useAuth();

  React.useEffect(() => {
    if (auth.status === 'unauthenticated') {
      router.replace('/admin/login');
    }
  }, [auth.status, router]);

  async function onLogout() {
    await auth.logout();
    toast.success(t('toast.success'), 'Déconnexion effectuée.');
    router.replace('/admin/login');
  }

  if (auth.status === 'loading') {
    return (
      <div className="min-h-dvh bg-linear-to-b from-background via-background to-muted/40">
        <main className="mx-auto w-full max-w-6xl px-4 py-10">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
          <div className="mt-6 grid gap-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (auth.status !== 'authenticated') return null;

  return (
    <div className="min-h-dvh bg-linear-to-b from-background via-background to-muted/40">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-border/60 bg-card/70">
              <Shield className="size-4" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">{t('admin.title')}</p>
              <p className="text-xs text-muted-foreground">{auth.admin?.username ?? '—'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="rounded-xl">
              <Link href="/">{t('nav.public')}</Link>
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={onLogout}>
              <LogOut className="size-4" />
              {t('nav.logout')}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <Card className="border-border/60 bg-card/80 p-4 backdrop-blur sm:p-6">{children}</Card>
      </main>
    </div>
  );
}


