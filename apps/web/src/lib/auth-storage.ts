const ACCESS_TOKEN_KEY = 'projectflow.accessToken';

/**
 * The access token lives in localStorage so the API client can attach it to
 * every request. Reads are guarded because they also run during SSR.
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}
