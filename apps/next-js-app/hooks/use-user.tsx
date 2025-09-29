'use client';

// Tanstack React Query
import { useQuery, useQueryClient } from '@tanstack/react-query';

// API Handler
import { apiHandler } from '../lib/api-handler';

// Types
import type { User, Session } from '@repo/database';

interface MeResponse {
  success: boolean;
  user: User;
  session: Session;
}

interface UseUserOptions {
  enabled?: boolean;
}

interface SignOutResponse {
  success: boolean;
  message: string;
}

function getSessionToken(): string {
  const sessionData = localStorage.getItem('session');
  if (!sessionData) throw new Error('No session found');

  const parsedSession = JSON.parse(sessionData);
  if (!parsedSession.token) throw new Error('No session token found');

  return parsedSession.token;
}

export function useUser(options: UseUserOptions = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async (): Promise<MeResponse> => {
      const token = getSessionToken();

      const response = await apiHandler.get<MeResponse>('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    enabled: enabled && typeof window !== 'undefined',
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const signOut = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = getSessionToken();

      const response = await apiHandler.post<SignOutResponse>(
        '/api/users/sign-out',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.error) {
        return { success: false, error: response.error };
      }

      localStorage.removeItem('session');
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  };

  return { ...userQuery, signOut };
}