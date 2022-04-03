import React from "react";
import DeviceDetector from "device-detector-js";

import { AppContextProvider } from "components";

const deviceDetector = new DeviceDetector();

const App = ({ Component, pageProps, userAgentAppearsMobile }) => {
    return (
        <AppContextProvider userAgentAppearsMobile={userAgentAppearsMobile}>
            <Component {...pageProps} />
        </AppContextProvider>
    );
};

App.getInitialProps = ({ ctx }) => {
    const {
        req: { headers },
    } = ctx;
    const userAgent = headers["user-agent"];
    const device = deviceDetector.parse(userAgent);
    return { userAgentAppearsMobile: device.device?.type === "smartphone" };
};

export default App;
