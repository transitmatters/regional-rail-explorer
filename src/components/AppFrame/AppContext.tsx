import React from "react";

type AppContextType = {
    stationPickerDiscloseBelowElement: null | HTMLDivElement;
    isMobile: boolean;
};

export const AppContext = React.createContext<AppContextType>({
    stationPickerDiscloseBelowElement: null,
    isMobile: false,
});
