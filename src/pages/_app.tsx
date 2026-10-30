import React from "react";
import Head from "next/head";
import Script from "next/script";
import DeviceDetector from "device-detector-js";

import { AppContextProvider } from "components";
import { setCdnCacheHeaders, setNoCacheHeaders } from "server/cache";

import "styles/global.scss";

const deviceDetector = new DeviceDetector();

const App = ({ Component, pageProps, userAgentAppearsMobile = false }) => {
    return (
        <AppContextProvider userAgentAppearsMobile={userAgentAppearsMobile}>
            <Head>
                <title>Regional Rail Explorer</title>
                <meta
                    name="description"
                    content="See how TransitMatters' plan for frequent, electrified Regional Rail would transform your commute."
                />
                <link rel="icon" type="image/png" href="./favicon.png" />
                <link rel="manifest" href={`/manifest.json`} />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0, maximum-scale=1.0,user-scalable=0"
                />
            </Head>
            <Script
                data-goatcounter="https://transitmatters-rrx.goatcounter.com/count"
                src="//gc.zgo.at/count.js"
            />
            <Component {...pageProps} />
        </AppContextProvider>
    );
};

App.getInitialProps = ({ ctx }) => {
    // Every page renders the same for everyone (CloudFront doesn't forward the browser's
    // User-Agent, so the check below never sees a phone), so successful pages can be cached.
    // This runs again to render the error page if the page then fails, so never cache that.
    if (ctx.res) {
        if (ctx.res.statusCode === 200 && !ctx.err) {
            setCdnCacheHeaders(ctx.res);
        } else {
            setNoCacheHeaders(ctx.res);
        }
    }
    const userAgent = ctx.req?.headers?.["user-agent"];
    if (userAgent) {
        const device = deviceDetector.parse(userAgent);
        return { userAgentAppearsMobile: device.device?.type === "smartphone" };
    }
    return {};
};

export default App;
