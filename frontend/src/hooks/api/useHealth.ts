import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/services/api';
import type { HealthStatus } from '@/types/health';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => apiGet<HealthStatus>('/api/health', signal),
    refetchInterval: 30_000,
    retry: false,
  });
}
