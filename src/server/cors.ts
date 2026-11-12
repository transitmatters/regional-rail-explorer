import type { ServerResponse } from "http";

// The Data Dashboard (dashboard.transitmatters.org) reads journeys and arrivals from the browser to
// preview Regional Rail on its Commuter Rail pages, then links here. These endpoints are public,
// read-only and take no credentials, so any origin may read them. The header doesn't depend on the
// request, so CloudFront can cache it with the response without adding Origin to the cache key.
export const setCorsHeaders = (res: ServerResponse) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
};
