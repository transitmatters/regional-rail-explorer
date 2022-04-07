import { NextRequest, NextResponse } from "next/server";

type Options = {
    enabled: boolean;
    host: null | string;
};

export const sslMiddleware = (options: Options) => (req: NextRequest) => {
    const { enabled, host: optionsHost } = options;
    if (enabled) {
        const { pathname, search, href, host: reqHost } = req.nextUrl;
        const isNotHttps = !href.startsWith("https://");
        if (isNotHttps) {
            const host = optionsHost || reqHost;
            const redirectUrl = `https://${host}${pathname}${search}`;
            console.log({ host, pathname, search, redirectUrl });
            return NextResponse.redirect(redirectUrl, 301);
        }
    }
    return NextResponse.next();
};
