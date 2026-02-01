import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { TabMetadata } from "./models";
import { getTabInfoService } from "./TabInfoService";

interface UseTabInfoQueryOptions {
  tabId?: string;
  url: string;
  enabled?: boolean;
}

async function fetchTabInfo({ tabId, url }: { tabId?: string; url: string }) {
  const service = getTabInfoService();
  const response = await service.fetchMetadata({ tabId, url });

  if (!response.success) {
    throw new Error(response.error || "Failed to fetch metadata");
  }

  return response.metadata || null;
}

export function usePreloadTabInfo() {
  const queryClient = useQueryClient();

  return ({ tabId, url }: { tabId?: string; url: string }) => {
    queryClient.prefetchQuery({
      queryKey: ["tab-info", url],
      queryFn: () => fetchTabInfo({ tabId, url }),
    });
  };
}

export function useTabInfoQuery({ tabId, url, enabled = true }: UseTabInfoQueryOptions) {
  return useQuery<TabMetadata | null, Error>({
    queryKey: ["tab-info", url],
    queryFn: async () => {
      return fetchTabInfo({ tabId, url });
    },
    enabled: enabled && Boolean(url),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}
