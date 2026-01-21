import { MessageBus } from "~/messaging";

import type { TabMetadata, TabMetadataRequest, TabMetadataResponse } from "./models";

export interface ITabInfoService {
  fetchMetadata(request: TabMetadataRequest): Promise<TabMetadataResponse>;
}

export class BackgroundTabInfoService implements ITabInfoService {
  async fetchMetadata(request: TabMetadataRequest): Promise<TabMetadataResponse> {
    try {
      return await MessageBus.send("metadata:fetch", request, { timeout: 15000 });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch metadata",
      };
    }
  }
}

export class BackendTabInfoService implements ITabInfoService {
  constructor(private apiEndpoint: string) {}

  async fetchMetadata(request: TabMetadataRequest): Promise<TabMetadataResponse> {
    try {
      const response = await fetch(`${this.apiEndpoint}/metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const metadata = (await response.json()) as TabMetadata;
      return { success: true, metadata };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch metadata from API",
      };
    }
  }
}

export class CachedTabInfoService implements ITabInfoService {
  constructor(private fallbackService: ITabInfoService) {}

  async fetchMetadata(request: TabMetadataRequest): Promise<TabMetadataResponse> {
    const cached = await this.getFromCache(request.url);
    if (cached) {
      return { success: true, metadata: cached };
    }

    const response = await this.fallbackService.fetchMetadata(request);
    if (response.success && response.metadata) {
      await this.saveToCache(response.metadata);
    }

    return response;
  }

  private async getFromCache(_url: string): Promise<TabMetadata | null> {
    return null;
  }

  private async saveToCache(_metadata: TabMetadata): Promise<void> {}
}

let defaultService: ITabInfoService = new BackgroundTabInfoService();

export function getTabInfoService(): ITabInfoService {
  return defaultService;
}

export function setTabInfoService(service: ITabInfoService): void {
  defaultService = service;
}
