import { useCallback, useState } from "react";

export const usePendingPromise = () => {
    const [isPending, setIsPending] = useState<boolean>(false);

    const wrapPending = useCallback((p: Promise<any>) => {
        setIsPending(true);
        return p.finally(() => setIsPending(false));
    }, []);

    return [isPending, wrapPending] as const;
};
