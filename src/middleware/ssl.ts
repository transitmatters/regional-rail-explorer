import { NextRequest, NextResponse } from "next/server";

import { getHost } from "server/host";

export const sslMiddleware = () => (req: NextRequest) => {
    if (process.env.NODE_ENV === "production") {
        const { headers, nextUrl } = req;
        const isNotHttps = headers.get("x-forwarded-proto") !== "https";
        console.log({
            NODE_ENV: process.env.NODE_ENV,
            PRODUCTION_HOST: process.env.PRODUCTION_HOST,
            HEROKU_APP_NAME: process.env.HEROKU_APP_NAME,
            headers,
        });
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
