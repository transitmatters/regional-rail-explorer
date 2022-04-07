import { NextRequest, NextResponse } from "next/server";

export default (req: NextRequest) => {
    if (process.env.NODE_ENV === "production") {
        const { headers, url } = req;
        const isNotHttps = headers.get("x-forwarded-proto") !== "https";
        if (isNotHttps && url.startsWith("http://")) {
            const restOfUrl = url.slice(7);
            const redirectUrl = `https://${restOfUrl}`;
            return NextResponse.redirect(redirectUrl, 301);
        }
    }
    return NextResponse.next();
};
