'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, PencilLine } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAppToast } from '@/components/toast/toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/i18n/I18nProvider';
import {
  ApiClientError,
  adminUpdateCardRequest,
  type AdminCardRequestItem,
  type AdminCardRequestUpdateBody,
  type CardRequestStatus,
} from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';

const optionalTrimmed = z.preprocess((v) => {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'string') return String(v);
  const trimmed = v.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}, z.string().max(255).optional());

const statusValues = ['UNCHANGED', 'CREATED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED'] as const;

const updateSchema = z
  .object({
    status: z.enum(statusValues),
    pickupEstablishment: optionalTrimmed,
    pickupAddress: optionalTrimmed,
  })
  .refine((v) => v.status !== 'UNCHANGED' || v.pickupEstablishment || v.pickupAddress, {
    message: 'Veuillez modifier au moins un champ.',
    path: ['status'],
  });

type UpdateValues = z.infer<typeof updateSchema>;

export function UpdateStatusDialog({
  open,
  onOpenChange,
  item,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: AdminCardRequestItem | null;
  onUpdated: () => void;
}) {
  const { t } = useI18n();
  const toast = useAppToast();
  const auth = useAuth();

  const form = useForm<UpdateValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      status: 'UNCHANGED',
      pickupEstablishment: undefined,
      pickupAddress: undefined,
    },
    mode: 'onBlur',
  });

  React.useEffect(() => {
    if (!open) {
      form.reset({
        status: 'UNCHANGED',
        pickupEstablishment: undefined,
        pickupAddress: undefined,
      });
    }
  }, [open, form]);

  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit(values: UpdateValues) {
    if (!item || !auth.accessToken) return;

    const body: AdminCardRequestUpdateBody = {};
    if (values.status !== 'UNCHANGED') body.status = values.status as CardRequestStatus;
    if (values.pickupEstablishment) body.pickupEstablishment = values.pickupEstablishment;
    if (values.pickupAddress) body.pickupAddress = values.pickupAddress;

    setSubmitting(true);
    try {
      await adminUpdateCardRequest(item.id, body, {
        accessToken: auth.accessToken,
        onAccessTokenRefreshed: auth.setAccessToken,
      });
      toast.success(t('toast.success'), 'Mise à jour effectuée.');
      onOpenChange(false);
      onUpdated();
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 401) {
        toast.error(t('toast.error'), t('toast.sessionExpired'));
        await auth.logout();
        return;
      }
      toast.apiError(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PencilLine className="size-4" />
            Mettre à jour le statut
          </DialogTitle>
          <DialogDescription>
            {item ? (
              <span>
                {item.nom} {item.prenom} — CIN <span className="font-mono">{item.cin}</span>
              </span>
            ) : (
              'Sélectionnez une ligne.'
            )}
          </DialogDescription>
        </DialogHeader>

        {item ? (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Statut actuel</span>
              <span className="font-medium">{t(`status.${item.status as CardRequestStatus}`)}</span>
            </div>
            <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
              <div>Établissement: {item.pickupEstablishment ?? '—'}</div>
              <div>Adresse: {item.pickupAddress ?? '—'}</div>
            </div>
          </div>
        ) : null}

        <Form {...form}>
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nouveau statut</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNCHANGED">Ne pas modifier</SelectItem>
                        <SelectItem value="CREATED">{t('status.CREATED')}</SelectItem>
                        <SelectItem value="IN_PROGRESS">{t('status.IN_PROGRESS')}</SelectItem>
                        <SelectItem value="READY">{t('status.READY')}</SelectItem>
                        <SelectItem value="DELIVERED">{t('status.DELIVERED')}</SelectItem>
                        <SelectItem value="CANCELLED">{t('status.CANCELLED')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="pickupEstablishment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouvel établissement</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-[72px] rounded-xl"
                        placeholder="Ex: Bureau de poste Tunis Centre"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pickupAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouvelle adresse</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-[72px] rounded-xl"
                        placeholder="Ex: 12 Avenue Habib Bourguiba, Tunis"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" className="rounded-xl" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" className="rounded-xl" disabled={submitting || !item}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                {t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


