'use client';

import { useI18n } from '@/i18n/I18nProvider';
import { CardRequestsTable } from '@/app/admin/_components/CardRequestsTable';

export default function AdminHomePage() {
  const { t } = useI18n();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t('admin.dashboard.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.dashboard.subtitle')}</p>
      </div>

      <CardRequestsTable />
    </div>
  );
}


