import React from "react";

type AppFrameContextType = {
    controlsContainer: null | HTMLDivElement;
};

export const AppFrameContext = React.createContext<AppFrameContextType>({
    controlsContainer: null,
});
