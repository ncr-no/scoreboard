// This file has been moved to components/scoreboard-chart.tsx
// The RecentSubmissions component has been removed.

// Props to optionally override internal hook behavior
interface RecentSubmissionsProps {
  // Optional props for compatibility with existing code
  submissions?: Submission[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
  useExternalData?: boolean; // Set to true to use the prop data instead of the hook
}


