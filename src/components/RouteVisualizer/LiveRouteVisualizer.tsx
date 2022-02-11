import React, { useMemo, useState } from "react";
import classNames from "classnames";

import { HOUR, MINUTE, stringifyTime } from "time";
import { Duration, NetworkTime, SerializableRouteInfo, SerializableTrip } from "types";
import { useIncrementingTime } from "hooks";
import { Select } from "components";

import RouteVisualizer from "./RouteVisualizer";
import styles from "./LiveRouteVisualizer.module.scss";

type Props = {
    routeInfo: SerializableRouteInfo[];
    initialTime?: NetworkTime;
};

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

const roundToNearestTimeIncrement = (now: NetworkTime, increment: Duration = MINUTE * 10) => {
    return Math.round(now / increment) * increment;
};

const selectItems = [
    { id: "present", label: "Present day" },
    { id: "phase-one", label: "Regional Rail" },
];

const LiveRouteVisualizer = (props: Props) => {
    const { routeInfo, initialTime = null } = props;
    const [baseline, enhanced] = routeInfo;
    const [scenario, setScenario] = useState("present");
    const routeInfoForScenario = scenario === "phase-one" ? enhanced : baseline;
    const { weekdayTrips } = routeInfoForScenario;
    const [earliest, latest] = useMemo(() => getTimeBounds(weekdayTrips), [weekdayTrips]);
    const [now, setNow] = useState(() => {
        if (initialTime) {
            return initialTime;
        }
        const date = new Date();
        const now = date.getHours() * HOUR + date.getMinutes() * MINUTE + date.getSeconds();
        if (now >= earliest && now <= latest) {
            return now;
        }
        return HOUR * 7.5;
    });

    useIncrementingTime({
        minutesPerSecond: 1,
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
                    selectedItem={selectItems.find((item) => item.id === scenario)!}
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
                    lineClassName={classNames(styles.line)}
                    stationClassName={classNames(styles.station)}
                    labelClassName={styles.label}
                    trainClassName={styles.train}
                    trainAtTerminusClassName={styles.trainAtTerminus}
                />
            </div>
        </div>
    );
};

export default LiveRouteVisualizer;
