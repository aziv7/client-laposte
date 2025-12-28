'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Lock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAppToast } from '@/components/toast/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/lib/auth/auth-context';

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Veuillez saisir votre identifiant.').max(100),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.').max(200),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useAppToast();
  const auth = useAuth();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
    mode: 'onBlur',
  });

  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (auth.status === 'authenticated') {
      router.replace('/admin');
    }
  }, [auth.status, router]);

  async function onSubmit(values: LoginValues) {
    setSubmitting(true);
    try {
      await auth.login(values.username, values.password);
      toast.success(t('toast.success'), 'Connexion réussie.');
      router.replace('/admin');
    } catch (e) {
      toast.apiError(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-linear-to-b from-background via-background to-muted/40">
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16">
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">{t('admin.login.title')}</CardTitle>
            <CardDescription>{t('admin.title')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.login.username')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                          <Input className="pl-9" autoComplete="username" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.login.password')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                          <Input className="pl-9" type="password" autoComplete="current-password" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="mt-1 rounded-xl" disabled={submitting}>
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  {t('admin.login.submit')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}


