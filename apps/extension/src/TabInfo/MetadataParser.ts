import type { TabMetadata } from "./models";

type ParseMode = "dom" | "regex";

export class MetadataParser {
  static parseFromHtml(html: string, url: string, mode: ParseMode = "regex"): TabMetadata {
    if (mode === "dom" && typeof DOMParser !== "undefined") {
      return this.parseWithDom(html, url);
    }
    return this.parseWithRegex(html, url);
  }

  private static parseWithDom(html: string, url: string): TabMetadata {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const metadata: TabMetadata = {
      url,
      fetchedAt: new Date().toISOString(),
    };

    const getMeta = (value: string, attr: "property" | "name" | "itemprop" = "property") => {
      return doc.querySelector(`meta[${attr}="${value}"]`)?.getAttribute("content") || null;
    };

    metadata.title =
      getMeta("og:title") ||
      getMeta("twitter:title") ||
      doc.querySelector("title")?.textContent?.trim() ||
      undefined;

    metadata.description =
      getMeta("og:description") ||
      getMeta("twitter:description") ||
      getMeta("description", "name") ||
      undefined;

    const imageUrl = getMeta("og:image") || getMeta("twitter:image");
    if (imageUrl) {
      metadata.image = this.resolveUrl(imageUrl, url);
    }

    metadata.siteName = getMeta("og:site_name") || undefined;
    metadata.type = getMeta("og:type") || undefined;
    metadata.locale = getMeta("og:locale") || undefined;

    metadata.twitterCard = getMeta("twitter:card") || undefined;
    metadata.twitterSite = getMeta("twitter:site") || undefined;
    metadata.twitterCreator = getMeta("twitter:creator") || undefined;

    metadata.author = getMeta("author", "name") || getMeta("article:author") || undefined;

    metadata.publishedTime =
      getMeta("article:published_time") || getMeta("datePublished", "itemprop") || undefined;
    metadata.modifiedTime =
      getMeta("article:modified_time") || getMeta("dateModified", "itemprop") || undefined;

    const keywordsStr = getMeta("keywords", "name");
    if (keywordsStr) {
      metadata.keywords = keywordsStr
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
    }

    return metadata;
  }

  private static parseWithRegex(html: string, url: string): TabMetadata {
    const metadata: TabMetadata = {
      url,
      fetchedAt: new Date().toISOString(),
    };

    metadata.title =
      this.getMetaContent(html, "og:title") ||
      this.getMetaContent(html, "twitter:title") ||
      this.getTitleTag(html) ||
      undefined;

    metadata.description =
      this.getMetaContent(html, "og:description") ||
      this.getMetaContent(html, "twitter:description") ||
      this.getMetaContent(html, "description", "name") ||
      undefined;

    const imageUrl =
      this.getMetaContent(html, "og:image") || this.getMetaContent(html, "twitter:image");
    if (imageUrl) {
      metadata.image = this.resolveUrl(imageUrl, url);
    }

    metadata.siteName = this.getMetaContent(html, "og:site_name") || undefined;
    metadata.type = this.getMetaContent(html, "og:type") || undefined;
    metadata.locale = this.getMetaContent(html, "og:locale") || undefined;

    metadata.twitterCard = this.getMetaContent(html, "twitter:card") || undefined;
    metadata.twitterSite = this.getMetaContent(html, "twitter:site") || undefined;
    metadata.twitterCreator = this.getMetaContent(html, "twitter:creator") || undefined;

    metadata.author =
      this.getMetaContent(html, "author", "name") ||
      this.getMetaContent(html, "article:author") ||
      undefined;

    metadata.publishedTime =
      this.getMetaContent(html, "article:published_time") ||
      this.getMetaContent(html, "datePublished", "itemprop") ||
      undefined;
    metadata.modifiedTime =
      this.getMetaContent(html, "article:modified_time") ||
      this.getMetaContent(html, "dateModified", "itemprop") ||
      undefined;

    const keywordsStr = this.getMetaContent(html, "keywords", "name");
    if (keywordsStr) {
      metadata.keywords = keywordsStr
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
    }

    return metadata;
  }

  private static getMetaContent(
    html: string,
    value: string,
    attr: "property" | "name" | "itemprop" = "property",
  ): string | null {
    const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`<meta[^>]+${attr}=["']${escapedValue}["'][^>]+content=["']([^"']+)["']`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${escapedValue}["']`, "i"),
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        return this.decodeHtmlEntities(match[1]);
      }
    }

    return null;
  }

  private static getTitleTag(html: string): string | null {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match?.[1] ? this.decodeHtmlEntities(match[1].trim()) : null;
  }

  private static decodeHtmlEntities(str: string): string {
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, "/");
  }

  private static resolveUrl(urlStr: string, baseUrl: string): string {
    try {
      if (urlStr.startsWith("http://") || urlStr.startsWith("https://")) {
        return urlStr;
      }
      return new URL(urlStr, baseUrl).href;
    } catch {
      return urlStr;
    }
  }
}
