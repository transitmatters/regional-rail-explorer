import type { IncomingMessage, ServerResponse } from "http";

// The Data Dashboard reads journeys and arrivals from the browser to preview Regional Rail on its
// Commuter Rail pages, then links here. Only the dashboard and RRE itself, plus their beta sites,
// may read these endpoints from another origin.
const ALLOWED_ORIGINS = new Set([
    "https://dashboard.transitmatters.org",
    "https://dashboard-beta.labs.transitmatters.org",
    "https://regionalrail.rocks",
    "https://rre-beta.labs.transitmatters.org",
]);

// We echo the request's Origin when it's allowed, so the response depends on Origin. CloudFront
// includes Origin in the cache key for /api/* (devops/cloudformation.json), which splits each API
// response into at most one cached copy per allowed origin plus one for same-origin requests.
export const setCorsHeaders = (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader("Vary", "Origin");
    const { origin } = req.headers;
    if (origin && ALLOWED_ORIGINS.has(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
};
