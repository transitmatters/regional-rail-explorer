import { useEffect, useState } from "react";

const getInitialViewportWidth = () => {
    if (typeof window !== "undefined") {
        return window.innerWidth;
    }
    return null;
};

export const useViewport = () => {
    const [viewportWidth, setViewportWidth] = useState<null | number>(getInitialViewportWidth());

    useEffect(() => {
        const listener = () => setViewportWidth(window.innerWidth);
        window.addEventListener("resize", listener);
        return () => window.removeEventListener("resize", listener);
    }, []);

    return { viewportWidth };
};
