import type { AuthSession, CurrentUser } from '@projectflow/shared';
import { apiRequest } from '@/lib/api-client';

export interface LoginPayload {
  email: string;
  password: string;
}

export function login(payload: LoginPayload): Promise<AuthSession> {
  return apiRequest<AuthSession>('/auth/login', {
    method: 'POST',
    body: payload,
    anonymous: true,
  });
}

export function fetchCurrentUser(): Promise<CurrentUser> {
  return apiRequest<CurrentUser>('/auth/me');
}
