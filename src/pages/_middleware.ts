import { sslMiddleware } from "middleware/ssl";

const getHost = () => {
    if (process.env.PRODUCTION_HOST) {
        return process.env.PRODUCTION_HOST;
    }
    return null;
};

export default sslMiddleware({
    enabled: process.env.NODE_ENV === "production" && process.env.FORCE_SSL === "true",
    host: getHost(),
});
