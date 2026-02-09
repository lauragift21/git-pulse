import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute — data is "fresh" for 60s
      refetchInterval: 60 * 1000, // Poll every 60s for near-realtime updates
      refetchOnWindowFocus: true, // Refetch when user tabs back in
      refetchIntervalInBackground: false, // Pause polling when tab is hidden
      retry: 1,
    },
  },
});
