"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowPathIcon, PencilSquareIcon } from "@heroicons/react/24/solid";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAppToast } from "@/components/toast/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n, type TFunction } from "@/i18n/I18nProvider";
import {
  ApiClientError,
  adminUpdateCardRequest,
  type AdminCardRequestItem,
  type AdminCardRequestUpdateBody,
  type CardRequestStatus,
} from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";

const statusValues = [
  "UNCHANGED",
  "CREATED",
  "IN_PROGRESS",
  "READY",
  "DELIVERED",
  "CANCELLED",
] as const;

function makeUpdateSchema(t: TFunction) {
  return z
    .object({
      status: z.enum(statusValues),
      pickupEstablishment: z.string().trim().max(255).optional(),
      pickupAddress: z.string().trim().max(255).optional(),
    })
    .refine(
      (v) =>
        v.status !== "UNCHANGED" || v.pickupEstablishment || v.pickupAddress,
      {
        message: t("admin.updateStatus.validation.atLeastOneField"),
        path: ["status"],
      }
    );
}

type UpdateValues = z.infer<ReturnType<typeof makeUpdateSchema>>;

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

  const updateSchema = React.useMemo(() => makeUpdateSchema(t), [t]);
  const form = useForm<UpdateValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      status: "UNCHANGED",
      pickupEstablishment: undefined,
      pickupAddress: undefined,
    },
    mode: "onBlur",
  });

  React.useEffect(() => {
    if (!open) {
      form.reset({
        status: "UNCHANGED",
        pickupEstablishment: undefined,
        pickupAddress: undefined,
      });
    }
  }, [open, form]);

  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit(values: UpdateValues) {
    if (!item || !auth.accessToken) return;

    const body: AdminCardRequestUpdateBody = {};
    if (values.status !== "UNCHANGED")
      body.status = values.status as CardRequestStatus;
    if (values.pickupEstablishment)
      body.pickupEstablishment = values.pickupEstablishment;
    if (values.pickupAddress) body.pickupAddress = values.pickupAddress;

    setSubmitting(true);
    try {
      await adminUpdateCardRequest(item.id, body, {
        accessToken: auth.accessToken,
        onAccessTokenRefreshed: auth.setAccessToken,
      });
      toast.success(t("toast.success"), t("admin.updateStatus.successToast"));
      onOpenChange(false);
      onUpdated();
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 401) {
        toast.error(t("toast.error"), t("toast.sessionExpired"));
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
            <PencilSquareIcon className="size-4" />
            {t("admin.updateStatus.title")}
          </DialogTitle>
          <DialogDescription>
            {item ? (
              <span>
                {item.nom} {item.prenom} — CIN{" "}
                <span className="font-mono">{item.cin}</span>
              </span>
            ) : (
              t("admin.updateStatus.selectRow")
            )}
          </DialogDescription>
        </DialogHeader>

        {item ? (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">
                {t("admin.updateStatus.currentStatus")}
              </span>
              <span className="font-medium">
                {t(`status.${item.status as CardRequestStatus}`)}
              </span>
            </div>
            <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
              <div>
                {t("admin.updateStatus.establishment")}:{" "}
                {item.pickupEstablishment ?? "—"}
              </div>
              <div>
                {t("admin.updateStatus.address")}: {item.pickupAddress ?? "—"}
              </div>
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
                  <FormLabel>{t("admin.updateStatus.newStatus")}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNCHANGED">
                          {t("admin.updateStatus.unchanged")}
                        </SelectItem>
                        <SelectItem value="CREATED">
                          {t("status.CREATED")}
                        </SelectItem>
                        <SelectItem value="IN_PROGRESS">
                          {t("status.IN_PROGRESS")}
                        </SelectItem>
                        <SelectItem value="READY">
                          {t("status.READY")}
                        </SelectItem>
                        <SelectItem value="DELIVERED">
                          {t("status.DELIVERED")}
                        </SelectItem>
                        <SelectItem value="CANCELLED">
                          {t("status.CANCELLED")}
                        </SelectItem>
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
                    <FormLabel>
                      {t("admin.updateStatus.newEstablishment")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-[72px] rounded-xl"
                        placeholder={t(
                          "admin.updateStatus.placeholderEstablishment"
                        )}
                        {...field}
                        value={field.value ?? ""}
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
                    <FormLabel>{t("admin.updateStatus.newAddress")}</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-[72px] rounded-xl"
                        placeholder={t("admin.updateStatus.placeholderAddress")}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                onClick={() => onOpenChange(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                className="rounded-xl"
                disabled={submitting || !item}
              >
                {submitting ? (
                  <ArrowPathIcon className="size-4 animate-spin" />
                ) : null}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
