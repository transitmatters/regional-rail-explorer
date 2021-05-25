import React from "react";

type AppFrameContextType = {
    globalNav: null | HTMLDivElement;
};

export const AppFrameContext = React.createContext<AppFrameContextType>({ globalNav: null });
