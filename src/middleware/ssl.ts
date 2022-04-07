import { NextRequest, NextResponse } from "next/server";

import { getHost } from "server/host";

export const sslMiddleware = () => (req: NextRequest) => {
    if (process.env.NODE_ENV === "production") {
        const { pathname, search, href } = req.nextUrl;
        const isNotHttps = !href.startsWith("https://");
        console.log({ isNotHttps });
        if (isNotHttps) {
            const host = getHost(req);
            const redirectUrl = `https://${host}${pathname}${search}`;
            console.log({ host, pathname, search, redirectUrl });
            return NextResponse.redirect(redirectUrl, 301);
        }
    }
    return NextResponse.next();
};
