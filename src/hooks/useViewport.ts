import { useEffect, useState } from "react";

type Viewport<T = number> = {
    width: T;
    height: T;
};

export const useViewport = () => {
    const [viewport, setViewport] = useState<null | Viewport>(null);

    useEffect(() => {
        const handleResize = () =>
            setViewport({ width: window.innerWidth, height: window.innerHeight });

        if (typeof window !== "undefined") {
            window.addEventListener("resize", handleResize);
            handleResize();
            return () => window.removeEventListener("resize", handleResize);
        }
    }, []);

    if (viewport) {
        return {
            viewportWidth: viewport.width,
            viewportHeight: viewport.height,
            isMobile: viewport?.width <= 700,
        };
    }
    return { viewportWidth: null, viewportHeight: null };
};
