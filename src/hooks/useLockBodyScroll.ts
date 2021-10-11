import { useEffect } from "react";

export const useLockBodyScroll = (enabled: boolean) => {
    useEffect(() => {
        if (enabled) {
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = "initial";
            };
        }
    }, [enabled]);
};
