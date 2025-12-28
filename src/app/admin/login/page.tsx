"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  UserCircleIcon,
} from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { useAppToast } from "@/components/toast/toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useI18n, type TFunction } from "@/i18n/I18nProvider";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

function makeLoginSchema(t: TFunction) {
  return z.object({
    username: z
      .string()
      .trim()
      .min(1, t("admin.login.validation.usernameRequired"))
      .max(100),
    password: z
      .string()
      .min(8, t("admin.login.validation.passwordMin"))
      .max(200),
  });
}

type LoginValues = z.infer<ReturnType<typeof makeLoginSchema>>;

export default function AdminLoginPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const toast = useAppToast();
  const auth = useAuth();

  const isRtl = locale === "ar";

  const [showPassword, setShowPassword] = React.useState(false);

  const loginSchema = React.useMemo(() => makeLoginSchema(t), [t]);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
    mode: "onBlur",
  });

  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (auth.status === "authenticated") {
      router.replace("/admin");
    }
  }, [auth.status, router]);

  async function onSubmit(values: LoginValues) {
    setSubmitting(true);
    try {
      await auth.login(values.username, values.password);
      toast.success(t("toast.success"), t("admin.login.successToast"));
      router.replace("/admin");
    } catch (e) {
      toast.apiError(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-linear-to-b from-secondary/20 via-background to-muted/40">
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16">
        <div className="flex items-center justify-end">
          <LocaleSwitcher />
        </div>
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">
              {t("admin.login.title")}
            </CardTitle>
            <CardDescription>{t("admin.title")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                className="grid gap-4"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("admin.login.username")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <UserCircleIcon
                            className={cn(
                              "pointer-events-none absolute top-2.5 size-4 text-muted-foreground",
                              isRtl ? "right-3" : "left-3"
                            )}
                          />
                          <Input
                            className={cn(isRtl ? "pr-9" : "pl-9")}
                            autoComplete="username"
                            {...field}
                          />
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
                      <FormLabel>{t("admin.login.password")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <LockClosedIcon
                            className={cn(
                              "pointer-events-none absolute top-2.5 size-4 text-muted-foreground",
                              isRtl ? "right-3" : "left-3"
                            )}
                          />
                          <Input
                            className={cn(isRtl ? "pr-9 pl-10" : "pl-9 pr-10")}
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            {...field}
                          />
                          <button
                            type="button"
                            className={cn(
                              "absolute top-2 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground",
                              isRtl ? "left-2" : "right-2"
                            )}
                            aria-label={
                              showPassword
                                ? t("admin.login.hidePassword")
                                : t("admin.login.showPassword")
                            }
                            aria-pressed={showPassword}
                            onClick={() => setShowPassword((v) => !v)}
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="size-4" />
                            ) : (
                              <EyeIcon className="size-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="mt-1 rounded-xl"
                  disabled={submitting}
                >
                  {submitting ? (
                    <ArrowPathIcon className="size-4 animate-spin" />
                  ) : null}
                  {t("admin.login.submit")}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
