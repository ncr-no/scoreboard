// /src/hooks/api/useScoreboard.ts
import { useQuery } from '@tanstack/react-query';
import { getScoreboard } from '@/lib/api';
import { useConfig } from '@/contexts/config-context';
import type { ScoreboardEntry } from '@/types/ctfd';

export function useScoreboard() {
  const { config, isConfigured } = useConfig();
  
  return useQuery<{ data: Record<string, ScoreboardEntry> }>({
    queryKey: ['scoreboard', config.apiUrl, config.apiToken, config.topTeamsCount],
    queryFn: () => getScoreboard(config),
    refetchInterval: config.refetchInterval, // Use configurable refetch interval
    enabled: isConfigured, // Only run query when config is available
  });
}