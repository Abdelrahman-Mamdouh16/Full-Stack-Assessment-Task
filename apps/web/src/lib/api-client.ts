import type { ApiErrorBody } from '@projectflow/shared';
import { getAccessToken } from './auth-storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4732';

export class ApiError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }

  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** Skip attaching the bearer token, for the login and register calls. */
  anonymous?: boolean;
}

/**
 * Single entry point for talking to the ProjectFlow API. Owns the base URL,
 * auth header and error shape so callers only deal with typed data.
 */
export async function apiRequest<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const { method = 'GET', body, query, anonymous = false } = options;

  const headers = new Headers({ Accept: 'application/json' });
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  if (!anonymous) {
    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_URL}${path}${buildQueryString(query)}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, extractErrorMessage(payload, response.status));
  }

  return payload as TResponse;
}

function buildQueryString(query: RequestOptions['query']): string {
  if (!query) {
    return '';
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

function extractErrorMessage(payload: unknown, statusCode: number): string {
  const body = payload as Partial<ApiErrorBody> | null;
  if (body && typeof body.message === 'string' && body.message.length > 0) {
    return body.message;
  }
  return `Request failed with status ${statusCode}`;
}
