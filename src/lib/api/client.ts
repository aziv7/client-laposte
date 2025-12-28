export type ApiErrorShape = {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
};

export class ApiClientError extends Error {
  status: number;
  code: string;
  requestId?: string;
  retryAfterSeconds?: number;

  constructor(input: {
    status: number;
    code: string;
    message: string;
    requestId?: string;
    retryAfterSeconds?: number;
  }) {
    super(input.message);
    this.name = 'ApiClientError';
    this.status = input.status;
    this.code = input.code;
    this.requestId = input.requestId;
    this.retryAfterSeconds = input.retryAfterSeconds;
  }
}

export type CardStatusRequest = {
  nom: string;
  prenom: string;
  cin: string;
  codePostal: string;
  gouvernorat: string;
};

export type CardStatusResponse = {
  status: string;
  pickupEstablishment: string | null;
  pickupAddress: string | null;
  updatedAt: string;
};

export type AdminLoginRequest = {
  username: string;
  password: string;
};

export type AdminLoginResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  admin: { id: number; username: string; role: 'ADMIN' };
};

export type AdminRefreshResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
};

export type CardRequestStatus = 'CREATED' | 'IN_PROGRESS' | 'READY' | 'DELIVERED' | 'CANCELLED';

export type AdminCardRequestItem = {
  id: number;
  nom: string;
  prenom: string;
  cin: string;
  genre: string | null;
  institut: string | null;
  gouvernorat: string;
  diplome: string | null;
  codePostal: string;
  status: string;
  pickupEstablishment: string | null;
  pickupAddress: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminCardRequestsListResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: AdminCardRequestItem[];
};

export type AdminCardRequestsListQuery = {
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'status' | 'gouvernorat' | 'cin';
  sortDir?: 'asc' | 'desc';

  status?: string;
  gouvernorat?: string;
  institut?: string;
  diplome?: string;
  genre?: string;
  cin?: string;
  nom?: string;
  prenom?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type AdminCardRequestUpdateBody = {
  status?: CardRequestStatus;
  pickupEstablishment?: string;
  pickupAddress?: string;
};

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  accessToken?: string | null;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
};

type AdminRequestOptions = {
  accessToken: string;
  onAccessTokenRefreshed?: (nextToken: string) => void;
  signal?: AbortSignal;
};

function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

function buildUrl(path: string, query?: ApiRequestOptions['query']): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${getApiBaseUrl()}/v1${normalizedPath}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function parseRetryAfterSeconds(res: Response): number | undefined {
  const retryAfter = res.headers.get('retry-after');
  if (retryAfter) {
    const asNumber = Number(retryAfter);
    if (!Number.isNaN(asNumber)) return Math.max(0, Math.ceil(asNumber));
    const asDate = Date.parse(retryAfter);
    if (!Number.isNaN(asDate)) return Math.max(0, Math.ceil((asDate - Date.now()) / 1000));
  }

  const rateLimitReset = res.headers.get('ratelimit-reset') ?? res.headers.get('rateLimit-reset');
  if (rateLimitReset) {
    const n = Number(rateLimitReset);
    if (!Number.isNaN(n)) {
      const nowSeconds = Math.floor(Date.now() / 1000);
      // Heuristic: some servers send an epoch timestamp, others a delta in seconds.
      const delta = n > nowSeconds + 5 ? n - nowSeconds : n;
      return Math.max(0, Math.ceil(delta));
    }
  }

  return undefined;
}

async function parseJsonSafe(res: Response): Promise<unknown | null> {
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function request<T>(path: string, opts: ApiRequestOptions = {}): Promise<T> {
  const url = buildUrl(path, opts.query);

  const headers: Record<string, string> = {
    accept: 'application/json',
  };

  if (opts.accessToken) {
    headers.authorization = `Bearer ${opts.accessToken}`;
  }

  let body: BodyInit | undefined;
  if (opts.body !== undefined) {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers,
    body,
    signal: opts.signal,
    credentials: opts.credentials ?? 'omit',
  });

  if (res.ok) {
    // Some endpoints return 204 (no content)
    if (res.status === 204) return undefined as T;
    const parsed = await parseJsonSafe(res);
    return parsed as T;
  }

  const parsed = await parseJsonSafe(res);
  const retryAfterSeconds = res.status === 429 ? parseRetryAfterSeconds(res) : undefined;

  if (parsed && typeof parsed === 'object' && 'error' in parsed) {
    const err = (parsed as ApiErrorShape).error;
    throw new ApiClientError({
      status: res.status,
      code: err.code ?? `HTTP_${res.status}`,
      message: err.message ?? `HTTP ${res.status}`,
      requestId: err.requestId,
      retryAfterSeconds,
    });
  }

  throw new ApiClientError({
    status: res.status,
    code: `HTTP_${res.status}`,
    message: res.statusText || `HTTP ${res.status}`,
    retryAfterSeconds,
  });
}

let refreshInFlight: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const res = await request<AdminRefreshResponse>('/admin/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      return res.accessToken;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function adminRequest<T>(
  path: string,
  opts: Omit<ApiRequestOptions, 'accessToken'> & AdminRequestOptions,
): Promise<T> {
  try {
    return await request<T>(path, { ...opts, accessToken: opts.accessToken });
  } catch (e) {
    const err = e instanceof ApiClientError ? e : null;
    if (!err || err.status !== 401) throw e;

    // Attempt one refresh + retry once.
    const nextToken = await refreshAccessToken();
    opts.onAccessTokenRefreshed?.(nextToken);
    return await request<T>(path, { ...opts, accessToken: nextToken });
  }
}

// --- Public ---

export function publicGetCardStatus(
  body: CardStatusRequest,
  opts?: { signal?: AbortSignal },
): Promise<CardStatusResponse> {
  return request<CardStatusResponse>('/public/card-status', {
    method: 'POST',
    body,
    signal: opts?.signal,
  });
}

// --- Admin Auth ---

export function adminLogin(body: AdminLoginRequest, opts?: { signal?: AbortSignal }): Promise<AdminLoginResponse> {
  return request<AdminLoginResponse>('/admin/auth/login', {
    method: 'POST',
    body,
    credentials: 'include',
    signal: opts?.signal,
  });
}

export function adminLogout(opts?: { signal?: AbortSignal }): Promise<void> {
  return request<void>('/admin/auth/logout', {
    method: 'POST',
    credentials: 'include',
    signal: opts?.signal,
  });
}

export function adminRefresh(opts?: { signal?: AbortSignal }): Promise<AdminRefreshResponse> {
  return request<AdminRefreshResponse>('/admin/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    signal: opts?.signal,
  });
}

// --- Admin Card Requests ---

export function adminListCardRequests(
  query: AdminCardRequestsListQuery,
  opts: AdminRequestOptions,
): Promise<AdminCardRequestsListResponse> {
  return adminRequest<AdminCardRequestsListResponse>('/admin/card-requests', {
    method: 'GET',
    query,
    accessToken: opts.accessToken,
    onAccessTokenRefreshed: opts.onAccessTokenRefreshed,
    signal: opts.signal,
  });
}

export function adminUpdateCardRequest(
  id: number,
  body: AdminCardRequestUpdateBody,
  opts: AdminRequestOptions,
): Promise<{ ok: true }> {
  return adminRequest<{ ok: true }>(`/admin/card-requests/${id}`, {
    method: 'PATCH',
    body,
    accessToken: opts.accessToken,
    onAccessTokenRefreshed: opts.onAccessTokenRefreshed,
    signal: opts.signal,
  });
}


