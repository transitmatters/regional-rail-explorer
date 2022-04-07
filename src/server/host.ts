import { NextRequest } from "next/server";

export const getHost = (req: NextRequest) => {
    if (process.env.HEROKU_APP_NAME) {
        return `${process.env.HEROKU_APP_NAME}.herokuapp.com`;
    }
    if (process.env.NODE_ENV == "production") {
        return process.env.PRODUCTION_HOST;
    }
    return req.nextUrl.host;
};
