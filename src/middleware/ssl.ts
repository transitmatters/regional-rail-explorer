import { NextRequest, NextResponse } from "next/server";

type Options = {
    enabled: boolean;
    host: null | string;
};

export const sslMiddleware = (options: Options) => (req: NextRequest) => {
    const { enabled, host: optionsHost } = options;
    const {
        nextUrl: { pathname, search, host: reqHost },
        headers,
    } = req;
    const xfp = headers.get("x-forwarded-proto");
    if (enabled) {
        if (xfp === "http") {
            const host = optionsHost || reqHost;
            const redirectUrl = `https://${host}${pathname}${search}`;
            console.log({ host, pathname, search, redirectUrl });
            return NextResponse.redirect(redirectUrl, 301);
        }
    } else {
        console.log("not enabled, but", {
            optionsHost,
            pathname,
            search,
            reqHost,
            headers: { ...headers },
            xfp,
        });
    }
    return NextResponse.next();
};
