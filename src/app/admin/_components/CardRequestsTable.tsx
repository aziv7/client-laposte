"use client";

import * as React from "react";
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";

import { UpdateStatusDialog } from "@/app/admin/_components/UpdateStatusDialog";
import { useAppToast } from "@/components/toast/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useI18n } from "@/i18n/I18nProvider";
import { getIntlLocale } from "@/i18n/i18n";
import {
  ApiClientError,
  adminListCardRequests,
  type AdminCardRequestItem,
  type AdminCardRequestsListQuery,
  type CardRequestStatus,
} from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

function formatDateTime(iso: string, intlLocale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const key = status as CardRequestStatus;
  const isKnown = [
    "CREATED",
    "IN_PROGRESS",
    "READY",
    "DELIVERED",
    "CANCELLED",
  ].includes(status);
  const label = isKnown ? t(`status.${key}`) : status;

  const variant =
    status === "CANCELLED"
      ? "destructive"
      : status === "READY" || status === "DELIVERED"
      ? "default"
      : "secondary";

  return (
    <Badge
      variant={variant as "default" | "secondary" | "destructive"}
      className="rounded-lg"
    >
      {label}
    </Badge>
  );
}

export function CardRequestsTable() {
  const { t, locale } = useI18n();
  const toast = useAppToast();
  const auth = useAuth();

  const isRtl = locale === "ar";

  const [items, setItems] = React.useState<AdminCardRequestItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<AdminCardRequestItem | null>(
    null
  );
  const [updateOpen, setUpdateOpen] = React.useState(false);

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [sortBy, setSortBy] =
    React.useState<NonNullable<AdminCardRequestsListQuery["sortBy"]>>(
      "createdAt"
    );
  const [sortDir, setSortDir] =
    React.useState<NonNullable<AdminCardRequestsListQuery["sortDir"]>>("desc");

  const [filtersOpen, setFiltersOpen] = React.useState(true);
  const [cin, setCin] = React.useState("");
  const [nom, setNom] = React.useState("");
  const [prenom, setPrenom] = React.useState("");
  const [status, setStatus] = React.useState<string>("ALL");
  const [gouvernorat, setGouvernorat] = React.useState("");

  const [debounced, setDebounced] = React.useState({
    cin: "",
    nom: "",
    prenom: "",
    gouvernorat: "",
    status: "ALL",
  });
  const abortRef = React.useRef<AbortController | null>(null);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  React.useEffect(() => {
    const id = window.setTimeout(() => {
      setDebounced((prev) => {
        const next = { cin, nom, prenom, gouvernorat, status };
        const same =
          prev.cin === next.cin &&
          prev.nom === next.nom &&
          prev.prenom === next.prenom &&
          prev.gouvernorat === next.gouvernorat &&
          prev.status === next.status;
        return same ? prev : next;
      });
    }, 300);
    return () => window.clearTimeout(id);
  }, [cin, nom, prenom, gouvernorat, status]);

  const query = React.useMemo<AdminCardRequestsListQuery>(
    () => ({
      page,
      pageSize,
      sortBy,
      sortDir,
      cin: debounced.cin || undefined,
      nom: debounced.nom || undefined,
      prenom: debounced.prenom || undefined,
      gouvernorat: debounced.gouvernorat || undefined,
      status: debounced.status === "ALL" ? undefined : debounced.status,
    }),
    [page, pageSize, sortBy, sortDir, debounced]
  );

  const refresh = React.useCallback(async () => {
    if (!auth.accessToken) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await adminListCardRequests(query, {
        accessToken: auth.accessToken,
        onAccessTokenRefreshed: auth.setAccessToken,
        signal: controller.signal,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      if (controller.signal.aborted) return;
      if ((e as Error)?.name === "AbortError") return;
      if (e instanceof ApiClientError && e.status === 401) {
        toast.error(t("toast.error"), t("toast.sessionExpired"));
        await auth.logout();
        return;
      }
      toast.apiError(e);
    } finally {
      setLoading(false);
    }
  }, [auth, query, toast, t]);

  React.useEffect(() => {
    void refresh();
    return () => abortRef.current?.abort();
  }, [refresh]);

  function resetFilters() {
    setCin("");
    setNom("");
    setPrenom("");
    setGouvernorat("");
    setStatus("ALL");
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-background/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <AdjustmentsHorizontalIcon className="size-4" />
              {t("admin.dashboard.filters")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={resetFilters}
            >
              <ArrowPathIcon className="size-4" />
              {t("admin.dashboard.resetFilters")}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">
                {t("admin.dashboard.field.sortBy")}
              </Label>
              <Select
                value={sortBy}
                onValueChange={(v) => (
                  setPage(1), setSortBy(v as typeof sortBy)
                )}
              >
                <SelectTrigger className="w-[190px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">
                    {t("admin.dashboard.sort.createdAt")}
                  </SelectItem>
                  <SelectItem value="updatedAt">
                    {t("admin.dashboard.sort.updatedAt")}
                  </SelectItem>
                  <SelectItem value="status">
                    {t("admin.dashboard.sort.status")}
                  </SelectItem>
                  <SelectItem value="gouvernorat">
                    {t("admin.dashboard.sort.gouvernorat")}
                  </SelectItem>
                  <SelectItem value="cin">
                    {t("admin.dashboard.sort.cin")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => (
                setPage(1), setSortDir((d) => (d === "asc" ? "desc" : "asc"))
              )}
              aria-label={t("admin.dashboard.sortDirAria")}
            >
              {sortDir === "asc" ? (
                <ChevronUpIcon className="size-4" />
              ) : (
                <ChevronDownIcon className="size-4" />
              )}
            </Button>

            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">
                {t("admin.dashboard.field.pageSize")}
              </Label>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => (setPage(1), setPageSize(Number(v)))}
              >
                <SelectTrigger className="w-[90px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="rounded-xl"
              onClick={() => void refresh()}
            >
              <MagnifyingGlassIcon className="size-4" />
              {t("common.search")}
            </Button>
          </div>
        </div>

        {filtersOpen ? (
          <>
            <Separator className="my-4" />
            <div className="grid gap-4 md:grid-cols-5">
              <div className="grid gap-2">
                <Label>{t("admin.dashboard.field.cin")}</Label>
                <Input
                  inputMode="numeric"
                  placeholder="CIN"
                  value={cin}
                  onChange={(e) => (setPage(1), setCin(e.target.value))}
                />
              </div>

              <div className="grid gap-2">
                <Label>{t("admin.dashboard.field.nom")}</Label>
                <Input
                  placeholder={t("admin.dashboard.field.nom")}
                  value={nom}
                  onChange={(e) => (setPage(1), setNom(e.target.value))}
                />
              </div>

              <div className="grid gap-2">
                <Label>{t("admin.dashboard.field.prenom")}</Label>
                <Input
                  placeholder={t("admin.dashboard.field.prenom")}
                  value={prenom}
                  onChange={(e) => (setPage(1), setPrenom(e.target.value))}
                />
              </div>

              <div className="grid gap-2">
                <Label>{t("admin.dashboard.field.gouvernorat")}</Label>
                <Input
                  placeholder={t(
                    "admin.dashboard.field.gouvernoratPlaceholder"
                  )}
                  value={gouvernorat}
                  onChange={(e) => (setPage(1), setGouvernorat(e.target.value))}
                />
              </div>

              <div className="grid gap-2">
                <Label>{t("admin.dashboard.field.status")}</Label>
                <Select
                  value={status}
                  onValueChange={(v) => (setPage(1), setStatus(v))}
                >
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">
                      {t("admin.dashboard.statusAll")}
                    </SelectItem>
                    <SelectItem value="CREATED">
                      {t("status.CREATED")}
                    </SelectItem>
                    <SelectItem value="IN_PROGRESS">
                      {t("status.IN_PROGRESS")}
                    </SelectItem>
                    <SelectItem value="READY">{t("status.READY")}</SelectItem>
                    <SelectItem value="DELIVERED">
                      {t("status.DELIVERED")}
                    </SelectItem>
                    <SelectItem value="CANCELLED">
                      {t("status.CANCELLED")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-background/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[90px]">
                {t("admin.dashboard.columns.id")}
              </TableHead>
              <TableHead>{t("admin.dashboard.columns.fullName")}</TableHead>
              <TableHead className="w-[140px]">
                {t("admin.dashboard.columns.cin")}
              </TableHead>
              <TableHead className="w-[160px]">
                {t("admin.dashboard.columns.gouvernorat")}
              </TableHead>
              <TableHead className="w-[150px]">
                {t("admin.dashboard.columns.status")}
              </TableHead>
              <TableHead className="w-[220px]">
                {t("admin.dashboard.columns.updatedAt")}
              </TableHead>
              <TableHead
                className={cn("w-[160px]", isRtl ? "text-left" : "text-right")}
              >
                {t("admin.dashboard.columns.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 8) }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-44" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-44" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {t("admin.dashboard.empty")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((r) => (
                <TableRow
                  key={r.id}
                  className={cn(
                    "hover:bg-accent/30",
                    r.status === "CANCELLED" && "opacity-80"
                  )}
                >
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell className="font-medium">
                    {r.nom} {r.prenom}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.cin}</TableCell>
                  <TableCell>{r.gouvernorat}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(r.updatedAt, getIntlLocale(locale))}
                  </TableCell>
                  <TableCell className={cn(isRtl ? "text-left" : "text-right")}>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => {
                        setSelected(r);
                        setUpdateOpen(true);
                      }}
                    >
                      {t("admin.dashboard.actionUpdate")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("admin.dashboard.page", { page, pages })}
          <span
            className={cn(
              isRtl ? "mr-2" : "ml-2",
              "text-xs text-muted-foreground"
            )}
          >
            ({total} {t("common.total")})
          </span>
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            {t("admin.dashboard.pagination.prev")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages || loading}
          >
            {t("admin.dashboard.pagination.next")}
          </Button>
        </div>
      </div>

      <UpdateStatusDialog
        open={updateOpen}
        onOpenChange={(open) => {
          setUpdateOpen(open);
          if (!open) setSelected(null);
        }}
        item={selected}
        onUpdated={() => void refresh()}
      />
    </div>
  );
}
