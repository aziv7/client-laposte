'use client';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { cn } from '@/lib/utils';

export function ToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={4500}
      newestOnTop
      closeOnClick={false}
      pauseOnHover
      draggable={false}
      limit={4}
      icon={false}
      toastClassName={({ type }) =>
        cn(
          // shell
          'pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border bg-card/95 p-4 text-foreground shadow-lg backdrop-blur',
          // subtle left accent
          'before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-border',
          type === 'success' && 'border-emerald-500/30 before:bg-emerald-500/60',
          type === 'error' && 'border-destructive/40 before:bg-destructive/70',
          type === 'warning' && 'border-amber-500/30 before:bg-amber-500/60',
          type === 'info' && 'border-sky-500/30 before:bg-sky-500/60',
          type === 'default' && 'border-border/60',
        )
      }
      bodyClassName={() => 'flex w-full items-start gap-3 p-0'}
      progressClassName={() => 'bg-foreground/15'}
      className="!w-[380px] !p-4"
    />
  );
}


