import { useQuery } from "@tanstack/react-query";

import type { TabMetadata } from "./models";
import { getTabInfoService } from "./TabInfoService";

interface UseTabInfoQueryOptions {
  tabId: string;
  url: string;
  enabled?: boolean;
}

export function useTabInfoQuery({ tabId, url, enabled = true }: UseTabInfoQueryOptions) {
  return useQuery<TabMetadata | null, Error>({
    queryKey: ["tab-info", url],
    queryFn: async () => {
      const service = getTabInfoService();
      const response = await service.fetchMetadata({ tabId, url });

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch metadata");
      }

      return response.metadata || null;
    },
    enabled: enabled && Boolean(url),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}
