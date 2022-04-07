import { NextRequest } from "next/server";

export const getHost = (req: NextRequest) => {
    const { PRODUCTION, PRODUCTION_HOST, HEROKU_APP_NAME } = process.env;
    if (HEROKU_APP_NAME) {
        return `${HEROKU_APP_NAME}.herokuapp.com`;
    }
    if (PRODUCTION) {
        return PRODUCTION_HOST;
    }
    return req.nextUrl.host;
};
