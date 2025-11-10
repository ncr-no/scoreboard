import { useState, useEffect } from 'react';
import { useSubmissions } from './useSubmissions';
import { useConfig } from '@/contexts/config-context';
import type { Submission } from '@/types/ctfd';

/**
 * Custom hook for fetching the latest submissions in real-time
 * Always returns the most recent submissions sorted by date (newest first)
 * @param enabled - Whether the hook should be enabled (default: true)
 */
export function useLiveSubmissions(enabled: boolean = true) {
  const { config } = useConfig();
  const [lastPage, setLastPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Initial query to get metadata and total count
  const {
    data: metaData,
    isLoading: metaLoading,
  } = useSubmissions({
    type: 'correct',
    per_page: 20,
    enabled,
  });

  // Calculate the last page based on total count
  useEffect(() => {
    if (enabled && metaData?.meta?.pagination?.total) {
      const totalSubmissions = metaData.meta.pagination.total;
      const calculatedLastPage = Math.max(1, Math.ceil(totalSubmissions / perPage));
      setLastPage(calculatedLastPage);
    }
  }, [metaData, perPage, enabled]);

  // Fetch the actual submissions with the last page
  const {
    data: submissionsData,
    isLoading: submissionsLoading,
    isError,
    error,
    refetch: refetchSubmissions
  } = useSubmissions({
    type: 'correct',
    per_page: perPage,
    page: lastPage,
    enabled,
  });

  // Process submissions to ensure proper sorting (newest first)
  const submissions = submissionsData?.data 
    ? [...submissionsData.data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  // Function to manually refresh data
  const refresh = () => {
    // Recalculate last page and refetch data
    if (metaData?.meta?.pagination?.total) {
      const totalSubmissions = metaData.meta.pagination.total;
      const calculatedLastPage = Math.max(1, Math.ceil(totalSubmissions / perPage));
      setLastPage(calculatedLastPage);
    }
    refetchSubmissions();
  };

  // Whether the hook is currently loading data
  const isLoading = metaLoading || submissionsLoading;

  return {
    submissions,
    isLoading,
    isError,
    error,
    refresh,
    lastPage,
    perPage,
    setPerPage,
    totalSubmissions: metaData?.meta?.pagination?.total || 0
  };
}
