import { createLogger } from "./Logger";

const logger = createLogger("url");

const UTMParams = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
const FacebookParams = ["fbclid"];
const miscTrackingParams = [
  "origin",
  "ocid",
  "amp",
  "trackingId",
  "ref",
  "ref_source",
  "ref_src",
  "ref_url",
  "_amp",
];

const trackingParamSet = new Set([...UTMParams, ...FacebookParams, ...miscTrackingParams]);

export function stripTrackingParams(url: string): string {
  try {
    const u = new URL(url);
    for (const p of trackingParamSet) {
      u.searchParams.delete(p);
    }

    return u.toString();
  } catch (e) {
    logger.debug("Failed to strip tracking params", url, e);
    return url;
  }
}

export function canonicalizeURL(
  url: string,
  config: {
    stripTracking?: boolean;
  } = {
    stripTracking: true,
  },
) {
  let canonical = url;
  if (config.stripTracking) {
    canonical = stripTrackingParams(url);
  }

  return canonical;
}

export function getDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return url;
  }
}
