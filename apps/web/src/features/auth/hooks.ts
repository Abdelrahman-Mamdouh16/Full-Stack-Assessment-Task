'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { AuthSession, CurrentUser } from '@projectflow/shared';
import { clearAccessToken, setAccessToken } from '@/lib/auth-storage';
import { queryKeys } from '@/lib/query-keys';
import { fetchCurrentUser, login, type LoginPayload } from './api';

export function useCurrentUser() {
  return useQuery<CurrentUser>({
    queryKey: queryKeys.currentUser,
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<AuthSession, Error, LoginPayload>({
    mutationFn: login,
    onSuccess: async (session) => {
      setAccessToken(session.accessToken);
      await queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
      router.replace('/projects');
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return () => {
    clearAccessToken();
    queryClient.clear();
    router.replace('/login');
  };
}
