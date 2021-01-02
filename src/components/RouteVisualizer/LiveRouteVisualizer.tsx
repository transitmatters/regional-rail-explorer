import React, { useEffect, useMemo, useState } from "react";

import { HOUR, MINUTE, stringifyTime } from "time";
import { NetworkTime, SerializableTrip } from "types";

import RouteVisualizer, { RouteVisualizerProps } from "./RouteVisualizer";

type Props = Omit<RouteVisualizerProps, "now">;

const getTimeBounds = (trips: SerializableTrip[]): [NetworkTime, NetworkTime] => {
    let earliest = Infinity;
    let latest = -Infinity;
    for (const trip of trips) {
        const stopTimes = trip.stopTimes.map((st) => st.time);
        earliest = Math.min(earliest, ...stopTimes);
        latest = Math.max(latest, ...stopTimes);
    }
    return [earliest, latest];
};

interface UseIncrementingTimeOptions {
    minutesPerSecond: number;
    ticksPerSecond: number;
    setTime: (setter: (n: number) => number) => void;
    timeBounds: [NetworkTime, NetworkTime];
}

const useIncrementingTime = (options: UseIncrementingTimeOptions) => {
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

const LiveRouteVisualizer = (props: Props) => {
    const { trips } = props;
    const [earliest, latest] = useMemo(() => getTimeBounds(trips), [trips]);
    const [now, setNow] = useState(HOUR * 7.5);

    useIncrementingTime({
        minutesPerSecond: 5,
        ticksPerSecond: 30,
        setTime: setNow,
        timeBounds: [earliest, latest],
    });

    return (
        <>
            {stringifyTime(now, { use12Hour: true })}
            <RouteVisualizer {...props} now={now} />
        </>
    );
};

export default LiveRouteVisualizer;
