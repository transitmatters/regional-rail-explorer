import React, { useState, useEffect } from "react";
import { CgSpinner } from "react-icons/cg";

import { stationsByLine, stationsById } from "stations";

import * as api from "api";
import { JourneyInfo, NetworkTime, NetworkDayKind } from "types";
import { DeparturePicker, JourneyPicker, JourneyComparison } from "components";
import { useRouterBoundState } from "hooks/useRouterBoundState";
import { usePendingPromise } from "hooks/usePendingPromise";

import styles from "./Explorer.module.scss";

const scenarioNames = ["present", "phase_one"];

const Explorer = () => {
    const [{ fromStationId, toStationId, day, time }, updateJourneyParams] = useRouterBoundState({
        fromStationId: {
            initial: null as string,
            param: "from",
        },
        toStationId: {
            initial: null as string,
            param: "to",
        },
        day: {
            initial: "weekday" as NetworkDayKind,
            param: "day",
        },
        time: {
            initial: null as number,
            param: "time",
            decode: parseInt,
            encode: (t) => t?.toString(),
        },
    });
    const [arrivals, setArrivals] = useState<NetworkTime[][]>(null);
    const [journeys, setJourneys] = useState<JourneyInfo[]>(null);
    const [isJourneyPending, wrapJourneyPending] = usePendingPromise();

    useEffect(() => {
        if (fromStationId && toStationId && day) {
            api.arrivals(fromStationId, toStationId, day, scenarioNames).then(setArrivals);
        }
    }, [fromStationId, toStationId, day]);

    useEffect(() => {
        if (time) {
            wrapJourneyPending(
                api.journeys(fromStationId, toStationId, day, time, scenarioNames).then(setJourneys)
            );
        }
    }, [fromStationId, toStationId, day, time]);

    const renderDeparturePicker = () => {
        if (arrivals) {
            const [baselineArrivals, enhancedArrivals] = arrivals;
            return (
                <DeparturePicker
                    baselineArrivals={baselineArrivals}
                    enhancedArrivals={enhancedArrivals}
                    spanFullDay={false}
                    onSelectTime={(time) => updateJourneyParams({ time })}
                    time={time}
                    disabled={isJourneyPending}
                />
            );
        }
        return null;
    };

    const renderJourneyComparison = () => {
        if (isJourneyPending) {
            return (
                <div className={styles.spinnerContainer}>
                    <CgSpinner className="spinning" size={50} />
                </div>
            );
        }
        if (journeys) {
            const [baseline, enhanced] = journeys;
            return <JourneyComparison baseline={baseline} enhanced={enhanced} />;
        }
        return null;
    };

    return (
        <div className={styles.explorer}>
            <JourneyPicker
                disabled={isJourneyPending}
                time={time}
                day={day}
                stationsById={stationsById}
                stationsByLine={stationsByLine}
                fromStationId={fromStationId}
                toStationId={toStationId}
                onSelectJourney={updateJourneyParams}
                onSelectTimeOfDay={() => {}}
                onSelectDay={(day) => updateJourneyParams({ day })}
            />
            {renderDeparturePicker()}
            {renderJourneyComparison()}
        </div>
    );
};

export default Explorer;
