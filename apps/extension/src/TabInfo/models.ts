export interface TabMetadata {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  type?: string;
  locale?: string;
  twitterCard?: string;
  twitterSite?: string;
  twitterCreator?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
  fetchedAt: string;
  error?: string;
}

export interface TabMetadataRequest {
  tabId?: string;
  url: string;
}

export interface TabMetadataResponse {
  success: boolean;
  metadata?: TabMetadata;
  error?: string;
}
