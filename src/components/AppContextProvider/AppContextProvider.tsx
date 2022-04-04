import React, { useEffect, useRef, useState } from "react";
import { Provider as RkProvider } from "reakit";

import { useViewport } from "hooks";

type DivRef = React.MutableRefObject<null | HTMLDivElement>;

export type AppContextType = {
    stationPickerDiscloseBelowElement: DivRef["current"];
    isMobile: boolean;
    globalNavRef: DivRef;
    controlsRef: DivRef;
};

export const AppContext = React.createContext<AppContextType>({
    stationPickerDiscloseBelowElement: null,
    isMobile: false,
    globalNavRef: React.createRef(),
    controlsRef: React.createRef(),
});

type Props = {
    userAgentAppearsMobile: boolean;
    children: React.ReactNode;
};

const AppContextProvider = (props: Props) => {
    const { userAgentAppearsMobile, children } = props;
    const [isMobile, setIsMobile] = useState(userAgentAppearsMobile);

    const controlsRef = useRef<null | HTMLDivElement>(null);
    const globalNavRef = useRef<null | HTMLDivElement>(null);
    const stationPickerDiscloseBelowElement = (isMobile ? globalNavRef : controlsRef).current;

    const { viewportWidth } = useViewport();

    useEffect(() => {
        if (typeof viewportWidth === "number") {
            setIsMobile(viewportWidth <= 700);
        }
    }, [viewportWidth]);

    return (
        <RkProvider>
            <AppContext.Provider
                value={{ controlsRef, globalNavRef, isMobile, stationPickerDiscloseBelowElement }}
            >
                {children}
            </AppContext.Provider>
        </RkProvider>
    );
};

export default AppContextProvider;
