import { useQuery } from '@tanstack/react-query';
import { useConfig } from '@/contexts/config-context';
import { getSubmissions } from '@/lib/api';
import type { SubmissionsResponse } from '@/types/ctfd';

export function useSubmissions(params?: {
  type?: 'correct' | 'incorrect';
  per_page?: number;
  page?: number;
  challenge_id?: number;
  user_id?: number;
}) {
  const { config, isConfigured } = useConfig();

  return useQuery<SubmissionsResponse>({
    queryKey: ['submissions', params, config.apiUrl, config.apiToken],
    queryFn: () => getSubmissions(config, params),
    enabled: isConfigured,
    refetchInterval: config.refetchInterval > 10000 ? config.refetchInterval : 15000, // Default to 15s if not set
    staleTime: Math.max(config.refetchInterval || 15000, 10000), // Cache for at least 10s
  });
}
