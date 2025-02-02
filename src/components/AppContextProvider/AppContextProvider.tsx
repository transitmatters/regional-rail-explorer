import React, { useEffect, useRef, useState } from "react";

import { useViewport } from "hooks";

type DivRef = React.MutableRefObject<null | HTMLDivElement>;

export type AppContextType = {
    isMobile: boolean;
    globalNavRef: DivRef;
    controlsRef: DivRef;
    stationPickerDiscloseBelowElementRef: DivRef;
};

export const AppContext = React.createContext<AppContextType>({
    isMobile: false,
    globalNavRef: React.createRef(),
    controlsRef: React.createRef(),
    stationPickerDiscloseBelowElementRef: React.createRef(),
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
    const stationPickerDiscloseBelowElementRef = isMobile ? globalNavRef : controlsRef;

    const { viewportWidth } = useViewport();

    useEffect(() => {
        if (typeof viewportWidth === "number") {
            setIsMobile(viewportWidth <= 700);
        }
    }, [viewportWidth]);

    return (
        <AppContext.Provider
            value={{
                controlsRef,
                globalNavRef,
                isMobile,
                stationPickerDiscloseBelowElementRef,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export default AppContextProvider;
