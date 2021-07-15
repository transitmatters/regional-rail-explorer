import React, { useState, useEffect } from "react";
import { CgSpinner } from "react-icons/cg";

import { stationsByLine, stationsById } from "stations";

import * as api from "api";
import {
    JourneyInfo,
    NetworkTime,
    NetworkDayKind,
    TimeOfDay,
    JourneyApiResult,
    JourneyParams,
} from "types";
import {
    DeparturePicker,
    JourneyPicker,
    JourneyComparison,
    JourneyErrorState,
    AppFrame,
    SuggestedJourneys,
} from "components";
import { useRouterBoundState, usePendingPromise } from "hooks";

import styles from "./Explorer.module.scss";
import { getAdvantageousDepartureTime } from "./departures";

const scenarioIds = ["present", "phase_one"];

const journeyParams1: JourneyParams = {
    fromStationId: "place-NEC-2173",
    toStationId: "place-bbsta",
    day: "weekday",
    time: 32010,
};

const journeyParams2: JourneyParams = {
    fromStationId: "place-DB-2222",
    toStationId: "place-knncl",
    day: "weekday",
    time: 51300,
};

const journeyParams3: JourneyParams = {
    fromStationId: "place-FR-0098",
    toStationId: "place-ER-0115",
    day: "weekday",
    time: 73358,
};

const journey = [journeyParams1, journeyParams2, journeyParams3];

const Explorer = () => {
    const [
        { fromStationId, toStationId, day, time, reverse = false },
        updateJourneyParams,
    ] = useRouterBoundState(
        {
            fromStationId: {
                initial: null as null | string,
                param: "from",
            },
            toStationId: {
                initial: null as null | string,
                param: "to",
            },
            day: {
                initial: "weekday" as NetworkDayKind,
                param: "day",
            },
            time: {
                initial: null as null | number,
                param: "time",
                decode: parseInt,
                encode: (t) => t?.toString(),
            },
            reverse: {
                initial: null as null | boolean,
                param: "reverse",
                decode: (s) => s === "1",
                encode: (b) => (b ? "1" : "0"),
            },
        },
        (previousState, nextState) => {
            return {
                shallow: true,
                replace:
                    previousState.fromStationId === nextState.fromStationId &&
                    previousState.toStationId === nextState.toStationId,
            };
        }
    );
    const [arrivals, setArrivals] = useState<null | NetworkTime[][]>(null);
    const [journeys, setJourneys] = useState<null | JourneyApiResult>(null);
    const [requestedTimeOfDay, setRequestedTimeOfDay] = useState<null | TimeOfDay>(null);
    const [isJourneyPending, wrapJourneyPending] = usePendingPromise();

    useEffect(() => {
        setArrivals(null);
        if (fromStationId && toStationId && day) {
            api.arrivals(fromStationId, toStationId, day, scenarioIds).then(setArrivals);
            if (!time) {
                setRequestedTimeOfDay("morning");
            }
        }
    }, [fromStationId, toStationId, day]);

    useEffect(() => {
        setJourneys(null);
        if (fromStationId && toStationId && day && time) {
            wrapJourneyPending(
                api
                    .journeys(fromStationId, toStationId, day, time, !!reverse, scenarioIds)
                    .then(setJourneys)
            );
        }
    }, [fromStationId, toStationId, day, time, reverse]);

    useEffect(() => {
        if (requestedTimeOfDay && arrivals) {
            const [baselineArrivals, enhancedArrivals] = arrivals;
            const time = getAdvantageousDepartureTime(
                requestedTimeOfDay,
                baselineArrivals,
                enhancedArrivals
            )!;
            setRequestedTimeOfDay(null);
            updateJourneyParams({ time });
        }
    }, [requestedTimeOfDay, arrivals]);

    const renderDeparturePicker = () => {
        if (arrivals) {
            const [baselineArrivals, enhancedArrivals] = arrivals;
            return (
                <DeparturePicker
                    baselineArrivals={baselineArrivals}
                    enhancedArrivals={enhancedArrivals}
                    spanFullDay={false}
                    showArrivals={!reverse}
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
            const journeyResolvedWithError = journeys.find((j) => "error" in j);
            if (journeyResolvedWithError && "error" in journeyResolvedWithError) {
                const {
                    payload: { scenario },
                } = journeyResolvedWithError;
                return <JourneyErrorState scenarioWithError={scenario} />;
            }
            const [baseline, enhanced] = journeys as JourneyInfo[];
            return <JourneyComparison baseline={baseline} enhanced={enhanced} />;
        }
        return null;
    };

    const renderSuggestedJourneys = () => {
        if (!journeys) {
            return <SuggestedJourneys suggestedJourneys={journey} />;
        } else {
            return null;
        }
    };

    return (
        <AppFrame
            mode="journey"
            containerClassName={styles.explorer}
            controls={
                <JourneyPicker
                    disabled={isJourneyPending}
                    time={time}
                    day={day}
                    stationsById={stationsById}
                    stationsByLine={stationsByLine}
                    fromStationId={fromStationId}
                    toStationId={toStationId}
                    onSelectJourney={updateJourneyParams}
                    onSelectTimeOfDay={setRequestedTimeOfDay}
                    onSelectDay={(day) => updateJourneyParams({ day })}
                />
            }
        >
            {renderSuggestedJourneys()}
            {renderDeparturePicker()}
            {renderJourneyComparison()}
        </AppFrame>
    );
};

export default Explorer;
