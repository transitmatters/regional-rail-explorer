import React from "react";
import DeviceDetector from "device-detector-js";

import { AppContextProvider } from "components";

const deviceDetector = new DeviceDetector();

const App = ({ Component, pageProps, userAgentAppearsMobile = false }) => {
    return (
        <AppContextProvider userAgentAppearsMobile={userAgentAppearsMobile}>
            <Component {...pageProps} />
        </AppContextProvider>
    );
};

App.getInitialProps = ({ ctx }) => {
    const userAgent = ctx.req?.headers?.["user-agent"];
    if (userAgent) {
        const device = deviceDetector.parse(userAgent);
        return { userAgentAppearsMobile: device.device?.type === "smartphone" };
    }
    return {};
};

export default App;
