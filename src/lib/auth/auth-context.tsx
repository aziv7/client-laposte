'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import { adminLogin, adminLogout, adminRefresh } from '@/lib/api/client';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type AdminUser = {
  id: number;
  username: string;
  role: 'ADMIN';
};

type AuthContextValue = {
  status: AuthStatus;
  accessToken: string | null;
  admin: AdminUser | null;
  setAccessToken: (token: string | null) => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

function decodeJwtPayload(token: string): unknown | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = parts[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const json = atob(padded);
    return JSON.parse(json) as unknown;
  } catch {
    return null;
  }
}

function tokenToAdminUser(token: string): AdminUser | null {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload !== 'object') return null;

  const rec = payload as Record<string, unknown>;
  const sub = typeof rec.sub === 'string' ? rec.sub : null;
  const username = typeof rec.username === 'string' ? rec.username : null;
  const role = rec.role === 'ADMIN' ? 'ADMIN' : null;

  if (!sub || !username || !role) return null;
  const id = Number(sub);
  if (Number.isNaN(id)) return null;
  return { id, username, role };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPath = (pathname ?? '').startsWith('/admin');

  const [status, setStatus] = React.useState<AuthStatus>('unauthenticated');
  const [accessTokenState, setAccessTokenState] = React.useState<string | null>(null);
  const [admin, setAdmin] = React.useState<AdminUser | null>(null);

  const setAccessToken = React.useCallback((token: string | null) => {
    setAccessTokenState(token);
    setAdmin(token ? tokenToAdminUser(token) : null);
  }, []);

  React.useEffect(() => {
    if (!isAdminPath) return;

    // If we already have an in-memory token, consider the session ready.
    if (accessTokenState) {
      setStatus('authenticated');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    (async () => {
      try {
        const res = await adminRefresh();
        if (cancelled) return;
        setAccessToken(res.accessToken);
        setStatus('authenticated');
      } catch {
        if (cancelled) return;
        setAccessToken(null);
        setStatus('unauthenticated');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAdminPath, accessTokenState, setAccessToken]);

  const login = React.useCallback(
    async (username: string, password: string) => {
      const res = await adminLogin({ username, password });
      setAccessToken(res.accessToken);
      setStatus('authenticated');
    },
    [setAccessToken],
  );

  const logout = React.useCallback(async () => {
    try {
      await adminLogout();
    } finally {
      setAccessToken(null);
      setStatus('unauthenticated');
    }
  }, [setAccessToken]);

  const ctx = React.useMemo<AuthContextValue>(
    () => ({
      status,
      accessToken: accessTokenState,
      admin,
      setAccessToken,
      login,
      logout,
    }),
    [status, accessTokenState, admin, setAccessToken, login, logout],
  );

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


