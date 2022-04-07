import { NextRequest, NextResponse } from "next/server";

import { getHost } from "server/host";

export const sslMiddleware = () => (req: NextRequest) => {
    if (process.env.NODE_ENV === "production") {
        const { headers, nextUrl } = req;
        const isNotHttps = headers.get("x-forwarded-proto") !== "https";
        console.log({ env: process.env, headers });
        console.log({ isNotHttps });
        if (isNotHttps) {
            const { pathname, search } = nextUrl;
            const host = getHost(req);
            const redirectUrl = `https://${host}${pathname}${search}`;
            console.log({ host, pathname, search, redirectUrl });
            return NextResponse.redirect(redirectUrl, 301);
        }
    }
    return NextResponse.next();
};
