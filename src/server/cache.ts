import type { ServerResponse } from "http";

// Responses only change when we deploy new schedules or code, and every deploy invalidates the
// whole CloudFront distribution (devops/deploy.sh). So CloudFront can serve a successful response
// for a day and refresh it in the background, while browsers revalidate on every visit and pick up
// a deploy right away. Every request CloudFront answers is one Lambda doesn't run, or bill for.
const CDN_CACHE_CONTROL = "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400";

export const setCdnCacheHeaders = (res: ServerResponse) => {
    res.setHeader("Cache-Control", CDN_CACHE_CONTROL);
};

// What Next sends for dynamic pages by default
export const setNoCacheHeaders = (res: ServerResponse) => {
    res.setHeader("Cache-Control", "private, no-cache, no-store, max-age=0, must-revalidate");
};
