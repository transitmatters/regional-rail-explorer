import { sslMiddleware } from "middleware/ssl";

const getHost = () => {
    if (process.env.PRODUCTION_HOST) {
        return process.env.PRODUCTION_HOST;
    }
    if (process.env.HEROKU_APP_NAME) {
        return `${process.env.HEROKU_APP_NAME}.herokuapp.com`;
    }
    return null;
};

export default sslMiddleware({
    enabled: process.env.NODE_ENV === "production",
    host: getHost(),
});
