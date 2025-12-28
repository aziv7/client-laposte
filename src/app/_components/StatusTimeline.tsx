"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

type StepKey = "CREATED" | "IN_PROGRESS" | "READY" | "DELIVERED" | "CANCELLED";

const steps: Array<{
  key: StepKey;
  tone: "default" | "success" | "warning" | "destructive";
}> = [
  { key: "CREATED", tone: "default" },
  { key: "IN_PROGRESS", tone: "warning" },
  { key: "READY", tone: "success" },
  { key: "DELIVERED", tone: "success" },
  { key: "CANCELLED", tone: "destructive" },
];

function toStepKey(status: string): StepKey | null {
  return (
    (steps.find((s) => s.key === status)?.key as StepKey | undefined) ?? null
  );
}

function getStepState(current: StepKey | null, step: StepKey) {
  if (!current) return { active: false, done: false, cancelled: false };
  if (current === "CANCELLED") {
    return {
      active: step === "CANCELLED",
      done: false,
      cancelled: step !== "CANCELLED",
    };
  }
  const currentIndex = steps.findIndex((s) => s.key === current);
  const stepIndex = steps.findIndex((s) => s.key === step);
  return {
    active: step === current,
    done: stepIndex <= currentIndex,
    cancelled: false,
  };
}

export function StatusTimeline({ status }: { status: string }) {
  const { t, locale } = useI18n();
  const current = toStepKey(status);
  const isRtl = locale === "ar";

  return (
    <div className="rounded-xl border border-border/60 bg-background/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">{t("public.result.title")}</p>
        <Badge variant="secondary" className="rounded-lg">
          {current ? t(`status.${current}`) : status}
        </Badge>
      </div>

      <div className="mt-4">
        <ol
          className={cn(
            "relative border-border/60",
            isRtl ? "mr-1 border-r" : "ml-1 border-l"
          )}
        >
          {steps.map((s, idx) => {
            const { active, done, cancelled } = getStepState(current, s.key);
            const isLast = idx === steps.length - 1;
            return (
              <li
                key={s.key}
                className={cn(
                  isRtl ? "mr-4 pb-6" : "ml-4 pb-6",
                  isLast && "pb-0"
                )}
              >
                <span
                  className={cn(
                    "absolute mt-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border",
                    isRtl ? "-right-[7px]" : "-left-[7px]",
                    done &&
                      !cancelled &&
                      "border-foreground/40 bg-foreground/15",
                    active && "border-foreground bg-foreground",
                    cancelled && "border-border/60 bg-muted",
                    !done &&
                      !active &&
                      !cancelled &&
                      "border-border/60 bg-background"
                  )}
                />
                <div className="flex items-center justify-between gap-3">
                  <p
                    className={cn(
                      "text-sm",
                      cancelled && "text-muted-foreground"
                    )}
                  >
                    {t(`status.${s.key}`)}
                  </p>
                  {active ? (
                    <Badge
                      className="rounded-lg"
                      variant={
                        s.tone === "destructive" ? "destructive" : "secondary"
                      }
                    >
                      {t("public.timeline.active")}
                    </Badge>
                  ) : done && !cancelled ? (
                    <Badge className="rounded-lg" variant="secondary">
                      {t("public.timeline.done")}
                    </Badge>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
