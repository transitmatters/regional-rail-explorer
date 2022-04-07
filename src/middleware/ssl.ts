import { NextRequest, NextResponse } from "next/server";

type Options = {
    enabled: boolean;
    host: null | string;
};

export const sslMiddleware = (options: Options) => (req: NextRequest) => {
    const { enabled, host: optionsHost } = options;
    if (enabled) {
        const {
            nextUrl: { pathname, search, host: reqHost },
            headers,
        } = req;
        const xfp = headers.get("x-forwarded-proto");
        if (xfp !== "https") {
            const host = optionsHost || reqHost;
            const redirectUrl = `https://${host}${pathname}${search}`;
            return NextResponse.redirect(redirectUrl, 301);
        }
    }
    return NextResponse.next();
};
