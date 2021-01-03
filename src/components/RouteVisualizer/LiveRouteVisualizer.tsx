import React, { useEffect, useMemo, useState } from "react";
import classNames from "classnames";

import { HOUR, MINUTE, stringifyTime } from "time";
import { Duration, NetworkTime, SerializableRouteInfo, SerializableTrip } from "types";
import { Select } from "components";

import RouteVisualizer from "./RouteVisualizer";
import styles from "./LiveRouteVisualizer.module.scss";

interface Props {
    routeInfo: SerializableRouteInfo[];
}

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

const roundToNearestTimeIncrement = (now: NetworkTime, increment: Duration = MINUTE * 10) => {
    return Math.round(now / increment) * increment;
};

const selectItems = [
    { id: "present", label: "Present day" },
    { id: "phase-one", label: "Regional Rail Phase One" },
];

const LiveRouteVisualizer = (props: Props) => {
    const { routeInfo } = props;
    const [baseline, enhanced] = routeInfo;
    const [scenario, setScenario] = useState("present");
    const routeInfoForScenario = scenario === "phase-one" ? enhanced : baseline;
    const { weekdayTrips } = routeInfoForScenario;
    const [earliest, latest] = useMemo(() => getTimeBounds(weekdayTrips), [weekdayTrips]);
    const [now, setNow] = useState(HOUR * 7.5);

    useIncrementingTime({
        minutesPerSecond: 5,
        ticksPerSecond: 30,
        setTime: setNow,
        timeBounds: [earliest, latest],
    });

    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <Select
                    disclosureProps={{ outline: true }}
                    items={selectItems}
                    selectedItem={selectItems.find((item) => item.id === scenario)}
                    onSelect={(item) => setScenario(item.id)}
                />
                <div className={styles.time}>
                    {stringifyTime(roundToNearestTimeIncrement(now), { use12Hour: true })}
                </div>
            </div>
            <div className={styles.visualizerWrapper}>
                <RouteVisualizer
                    {...props}
                    now={now}
                    trips={weekdayTrips}
                    branchMap={enhanced.branchMap}
                    stationNames={enhanced.stationNames}
                    lineClassName={styles.line}
                    stationClassName={styles.station}
                    labelClassName={styles.label}
                    trainClassName={styles.train}
                    trainAtTerminusClassName={styles.trainAtTerminus}
                />
            </div>
        </div>
    );
};

export default LiveRouteVisualizer;
