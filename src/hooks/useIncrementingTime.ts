import { useEffect } from "react";

import { MINUTE } from "time";
import { NetworkTime } from "types";

type Options = {
    minutesPerSecond: number;
    ticksPerSecond: number;
    setTime: (setter: (n: number) => number) => void;
    timeBounds: [NetworkTime, NetworkTime];
};

export const useIncrementingTime = (options: Options) => {
    const { minutesPerSecond, ticksPerSecond, setTime, timeBounds } = options;
    const [earliest, latest] = timeBounds;
    const intervalMs = 1000 / ticksPerSecond;
    const minutesPerTick = minutesPerSecond / ticksPerSecond;
    useEffect(() => {
        const intervalHandle = setInterval(
            () =>
                setTime((prev) => {
                    const next = prev + minutesPerTick * MINUTE;
                    if (next > latest) {
                        return earliest;
                    }
                    return next;
                }),
            intervalMs
        );
        return () => clearInterval(intervalHandle);
    }, [earliest, latest, intervalMs, minutesPerTick]);
};
